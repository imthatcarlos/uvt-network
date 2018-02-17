const util = require('ethereumjs-util');

const UVTCore = artifacts.require('./UVTCore.sol');
const UVTToken = artifacts.require('./UVTToken.sol');
const OpenDeviceRegistry = artifacts.require('./OpenDeviceRegistry.sol');

const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const expectEvent = require('../node_modules/zeppelin-solidity/test/helpers/expectEvent');
const addValidGateway = require('./helpers/addValidGateway');
const increaseTime = require('./helpers/increaseTime');

// Values to be used for most SearchRequest instances
const uvtFee = 30; // 10 UVT per gateway
const endpointId = '123';
const endpointSecret = 'secret';

/**
 * Create instance of UVTToken and UVTCore, and mint some for the contract
 */
async function setupContracts() {
  var token = await UVTToken.new();
  var deviceRegistry = await OpenDeviceRegistry.new();
  var ledger = await UVTCore.new(token.address, deviceRegistry.address);

  await token.mint(ledger.address, 1000000);
  await token.finishMinting();

  return [ledger, token, deviceRegistry];
}

/**
 * Adds 3 gateways to be used in tests, with default values
 */
async function addValidGateways(deviceRegistry, accounts) {
  addValidGateway(deviceRegistry, accounts[5]);
  addValidGateway(deviceRegistry, accounts[6]);
  addValidGateway(deviceRegistry, accounts[7]);
}

/**
 * First steps to many of these tests 1) Buy UVT 2) Approve the fee and 3) Create
 * a generic SearchRequest with params:
 * owner = account
 * endpointId = 123
 * gatewayIds = [0,1,2] (from addValidGateways)
 */
async function createValidSearchRequest(ledger, token, account) {
  await ledger.buyUVT(uvtFee, {from: account, value: uvtFee});
  await token.approve(ledger.address, uvtFee, {from: account});
  return await ledger.createSearchRequest(endpointId, [0,1,2], {from: account});
}

/**
 * Signs data regarding the endpoint with the account's address
 */
function signEndpointData(account) {
  var messageHash = web3.sha3(endpointId, endpointSecret);
  var sig = web3.eth.sign(account, messageHash).slice(2);
  var r = '0x' + sig.slice(0, 64);
  var s = '0x' + sig.slice(64, 128);
  var v = web3.toDecimal('0x' + sig.slice(128, 130)) + 27;

  return [messageHash, r, s, v];
}

contract('UVTCore', function(accounts) {
  describe('buyUVT', function() {
    it('sends UVT tokens to account in exchange for ETH', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await ledger.buyUVT(5, {from: accounts[1], value: 5});
      var balance = await token.balanceOf(accounts[1]);
      assert.equal(balance, 5, 'the account now has balance of 5');
    });

    it('broadcasts a PurchasedUVT event', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var tx = await ledger.buyUVT(5, {from: accounts[1], value: 5});
      expectEvent.inTransaction(tx, 'PurchasedUVT');
    });

    it('should not send tokens when it did not mint any', async() => {
      var token = await UVTToken.new();
      var deviceRegistry = await OpenDeviceRegistry.new();
      var ledger = await UVTCore.new(token.address, deviceRegistry.address);
      try {
        await ledger.buyUVT(5, {from: accounts[1], value: 5});
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should not send tokens without payment', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      try {
        await ledger.buyUVT(5, {from: accounts[1]});
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });
  });

  describe('createSearchRequest', function() {
    it('creates a SearchRequest and saves it to storage', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);

      var data = await ledger.getSearchRequest({from: accounts[1]});
      assert.equal(data[0], accounts[1], 'record was saved to storage with correct owner');
    });

    describe('-- Inherited from UVTChannels', function() {
      describe('_openChannel', function() {
        it('creates a channel and adds it to storage', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);
          await createValidSearchRequest(ledger, token, accounts[1]);

          var data = await ledger.getSearchRequest({from: accounts[1]});
          var channelData = await ledger.getChannel(data[3]);
          assert.equal(channelData[0], accounts[1], 'record was saved to storage with correct owner');
        });

        it('moves UVT tokens from the sender to the contract', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);

          // code from createValidSearchRequest()
          var uvtFee = 30; // 10 UVT per gateway
          await ledger.buyUVT(uvtFee, {from: accounts[1], value: uvtFee});
          await token.approve(ledger.address, uvtFee, {from: accounts[1]});

          var contractBalanceBefore = await token.balanceOf(ledger.address);
          var accountBalanceBefore = await token.balanceOf(accounts[1]);

          return await ledger.createSearchRequest(endpointId, [0,1,2], {from: accounts[1]});

          var contractBalanceAfter = await token.balanceOf(ledger.address);
          var accountBalanceAfter = await token.balanceOf(accounts[1]);

          assert.equal(web3.toDecimal(contractBalanceAfter), web3.toDecimal(contractBalanceBefore) - uvtFee, 'account paid UVT tokens');
          assert.equal(web3.toDecimal(accountBalanceAfter), web3.toDecimal(accountBalanceBefore) + uvtFee, 'contract received UVT tokens');
        });

        it('broadcasts a ChannelOpened event', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);
          var tx = await createValidSearchRequest(ledger, token, accounts[1]);
          expectEvent.inTransaction(tx, 'ChannelOpened');
        });

        it('should not open a channel if the account does not have enough UVT', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);

          // code from createValidSearchRequest()
          var uvtFee = 30; // 10 UVT per gateway
          var userBought = 5;
          await ledger.buyUVT(userBought, {from: accounts[1], value: userBought});
          await token.approve(ledger.address, uvtFee, {from: accounts[1]});
          try {
            await ledger.createSearchRequest(endpointId, [0,1,2], {from: accounts[1]});
            assert.fail('it should have thrown before');
          } catch (error) {
            assertRevert(error);
          }
        });
      });
    });
  });

  describe('endpointFound', function() {
    it('correctly verifies an endpoint signature and updates the search state', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      // user encrypted endpoint data and it was stored in memory by the item's
      // LoRa transmitter
      var sigData = signEndpointData(accounts[1]);

      // an invoked gateway found the item, notifies the contract with the item's
      // encrypted data, along with geo location
      await ledger.endpointFound(
        requestId,
        [sigData[0], sigData[1], sigData[2]],
        sigData[3],
        '41.878114',
        '-87.629798',
        {from: accounts[5]} // the gateway owner
      );

      var state = await ledger.getSearchRequestStatus({from: accounts[1]});
      assert.equal(state.toNumber(), 1, 'search state is now SearchState.Found');
    });

    it('pays out the gateways with the finder receiving more', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      // user encrypted endpoint data and it was stored in memory by the item's
      // LoRa transmitter
      var sigData = signEndpointData(accounts[1]);

      // an invoked gateway found the item, notifies the contract with the item's
      // encrypted data, along with geo location
      await ledger.endpointFound(
        requestId,
        [sigData[0], sigData[1], sigData[2]],
        sigData[3],
        '41.878114',
        '-87.629798',
        {from: accounts[5]} // the gateway owner
      );

      // if the uvtFee was 30, the finderPayout should be 14 and othersPayout 8
      var finderBalance = await token.balanceOf(accounts[5]);
      var otherBalance = await token.balanceOf(accounts[6]);
      assert.equal(finderBalance, 14, 'finder was paid out correctly');
      assert.equal(otherBalance, 8, 'other was paid out correctly');
    });

    it('broadcasts a SearchEndpointFound event', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      // user encrypted endpoint data and it was stored in memory by the item's
      // LoRa transmitter
      var sigData = signEndpointData(accounts[1]);

      // an invoked gateway found the item, notifies the contract with the item's
      // encrypted data, along with geo location
      var tx = await ledger.endpointFound(
        requestId,
        [sigData[0], sigData[1], sigData[2]],
        sigData[3],
        '41.878114',
        '-87.629798',
        {from: accounts[5]} // the gateway owner
      );

      expectEvent.inTransaction(tx, 'SearchEndpointFound');
    });

    it('should not allow a non-gateway owner to call', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      // user encrypted endpoint data and it was stored in memory by the item's
      // LoRa transmitter
      var sigData = signEndpointData(accounts[1]);

      try {
        // an address not linked to a gateway attempts to call, they somehow
        // got ahold of the signature data
        await ledger.endpointFound(
          0,
          [sigData[0], sigData[1], sigData[2]],
          sigData[3],
          '41.878114',
          '-87.629798',
          {from: accounts[9]} // they don't own a gateway
        );
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    describe('-- Inherited from UVTChannels', function() {
      describe('_closeChannel', function() {
        it('changes the channel state to Closed and emits an event', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);
          await createValidSearchRequest(ledger, token, accounts[1]);
          var requestId = await ledger.getSearchRequestId({from: accounts[1]});

          // user encrypted endpoint data and it was stored in memory by the item's
          // LoRa transmitter
          var sigData = signEndpointData(accounts[1]);

          // an invoked gateway found the item, notifies the contract with the item's
          // encrypted data, along with geo location
          var tx = await ledger.endpointFound(
            requestId,
            [sigData[0], sigData[1], sigData[2]],
            sigData[3],
            '41.878114',
            '-87.629798',
            {from: accounts[5]} // the gateway owner
          );

          var data = await ledger.getSearchRequestById(requestId);
          var state = await ledger.getChannelState(data[3]);
          assert.equal(state, 1, 'the channel state is ChannelState.Closed');

          expectEvent.inTransaction(tx, 'ChannelClosed');
        });
      });
    });
  });

  describe('searchExpired', function() {
    it('returns false when the search has not expired', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var res = await ledger.searchExpired.call(requestId, {from: accounts[1]});
      assert.equal(res, false, 'it has not expired');
    });

    it('returns true when the search has expired', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var twoHours = 60 * 60 * 2; // requests expire after an hour
      await increaseTime(twoHours);

      var res = await ledger.searchExpired.call(requestId, {from: accounts[1]});
      assert.equal(res, true, 'it has expired');
    });

    it('should not allow call when the request is no longer active', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var twoHours = 60 * 60 * 2; // requests expire after an hour
      await increaseTime(twoHours);

      await ledger.searchExpired(requestId, {from: accounts[1]});

      try {
        await ledger.searchExpired(requestId, {from: accounts[1]});
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it('updates the request state to expired and emits an event', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var twoHours = 60 * 60 * 2; // requests expire after an hour
      await increaseTime(twoHours);

      var tx = await ledger.searchExpired(requestId, {from: accounts[1]});
      expectEvent.inTransaction(tx, 'SearchExpired');

      var data = await ledger.getSearchRequestById(requestId);
      assert.equal(data[4], 3, 'the state is set to SearchState.Expired');
    });

    it('if the request expired, it pays out gateways equally', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var twoHours = 60 * 60 * 2; // requests expire after an hour
      await increaseTime(twoHours);

      await ledger.searchExpired(requestId, {from: accounts[1]});

      // if the uvtFee was 30, everyone gets 10
      var gateway1Balance = await token.balanceOf(accounts[5]);
      var gateway2Balance = await token.balanceOf(accounts[6]);
      var gateway3Balance = await token.balanceOf(accounts[7]);
      assert.equal(web3.toDecimal(gateway1Balance), web3.toDecimal(gateway2Balance), 'first 2 paid the same');
      assert.equal(web3.toDecimal(gateway1Balance), web3.toDecimal(gateway3Balance), 'as was the third');
    });

    describe('-- Inherited from UVTChannels', function() {
      describe('_closeChannel', function() {
        it('changes the channel state to Closed and emits an event', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);
          await createValidSearchRequest(ledger, token, accounts[1]);
          var requestId = await ledger.getSearchRequestId({from: accounts[1]});

          var twoHours = 60 * 60 * 2; // requests expire after an hour
          await increaseTime(twoHours);

          var tx = await ledger.searchExpired(requestId, {from: accounts[1]});

          var data = await ledger.getSearchRequestById(requestId);
          var state = await ledger.getChannelState(data[3]);
          assert.equal(state, 1, 'the channel state is ChannelState.Closed');

          expectEvent.inTransaction(tx, 'ChannelClosed');
        });
      });
    });
  });

  describe('cancelSearch', function() {
    it('updates the search state and emits an event', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var tx = await ledger.cancelSearch(requestId, {from: accounts[1]});
      var data = await ledger.getSearchRequestById(requestId);
      assert.equal(data[4].toNumber(), 2, 'the request state is SearchState.Cancelled');

      expectEvent.inTransaction(tx, 'SearchCancelled');
    });

    it('refunds the account if within the grace period of 15 minutes', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var balanceBefore = await token.balanceOf(accounts[1]);
      var tx = await ledger.cancelSearch(requestId, {from: accounts[1]});
      var balanceAfter = await token.balanceOf(accounts[1]);
      assert.equal(web3.toDecimal(balanceAfter), web3.toDecimal(balanceBefore) + uvtFee, 'user was refunded');
    });

    it('pays out the gateways equally if past the grace period of 15 minutes', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var seconds = 60 * 16;
      await increaseTime(seconds);

      await ledger.cancelSearch(requestId, {from: accounts[1]});

      // if the uvtFee was 30, everyone gets 10
      var gateway1Balance = await token.balanceOf(accounts[5]);
      var gateway2Balance = await token.balanceOf(accounts[6]);
      var gateway3Balance = await token.balanceOf(accounts[7]);
      assert.equal(web3.toDecimal(gateway1Balance), web3.toDecimal(gateway2Balance), 'first 2 paid the same');
      assert.equal(web3.toDecimal(gateway1Balance), web3.toDecimal(gateway3Balance), 'as was the third');
    });

    it('should not allow anyone but the request owner to cancel', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      try {
        await ledger.cancelSearch(requestId, {from: accounts[2]});
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should not allow call when the request is already expired', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];
      var deviceRegistry = contracts[2]

      await addValidGateways(deviceRegistry, accounts);
      await createValidSearchRequest(ledger, token, accounts[1]);
      var requestId = await ledger.getSearchRequestId({from: accounts[1]});

      var seconds = 60 * 61;
      await increaseTime(seconds);

      try {
        await ledger.cancelSearch(requestId, {from: accounts[1]});
        assert.fail('it should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    describe('-- Inherited from UVTChannels', function() {
      describe('_closeChannel', function() {
        it('changes the channel state to Closed and emits an event', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];
          var deviceRegistry = contracts[2]

          await addValidGateways(deviceRegistry, accounts);
          await createValidSearchRequest(ledger, token, accounts[1]);
          var requestId = await ledger.getSearchRequestId({from: accounts[1]});

          var tx = await ledger.cancelSearch(requestId, {from: accounts[1]});

          var data = await ledger.getSearchRequestById(requestId);
          var state = await ledger.getChannelState(data[3]);
          assert.equal(state, 1, 'the channel state is ChannelState.Closed');

          expectEvent.inTransaction(tx, 'ChannelClosed');
        });
      });
    });
  });
});
