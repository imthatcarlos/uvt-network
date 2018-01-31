const util = require('ethereumjs-util');

const UVTCore = artifacts.require('./UVTCore.sol');
const UVTToken = artifacts.require('./UVTToken.sol');

const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const expectEvent = require('../node_modules/zeppelin-solidity/test/helpers/expectEvent');
const addValidGateway = require('./helpers/addValidGateway');

/**
 * Create instance of UVTToken and UVTCore, and mint some for the contract
 */
async function setupContracts() {
  var token = await UVTToken.new();
  var ledger = await UVTCore.new(token.address);
  await token.mint(ledger.address, 1000000);
  await token.finishMinting();

  return [ledger, token];
}

/**
 * Adds 3 gateways to be used in tests, with default values
 */
async function addValidGateways(ledger, accounts) {
  addValidGateway(ledger, accounts[5]);
  addValidGateway(ledger, accounts[6]);
  addValidGateway(ledger, accounts[7]);
}

/**
 * First steps to many of these tests 1) Buy UVT 2) Approve the fee and 3) Create
 * a generic SearchRequest with params:
 * owner = accounts[1]
 * endpointId = 123
 * gatewayIds = [0,1,2] (from addValidGateways)
 */
async function createValidSearchRequest(ledger, token, accounts) {
  var uvtFee = 30; // 10 UVT per gateway
  await ledger.buyUVT(uvtFee, {from: accounts[1], value: uvtFee});
  await token.approve(ledger.address, uvtFee, {from: accounts[1]});
  return await ledger.createSearchRequest(123, [0,1,2], {from: accounts[1]});
}

contract('UVTCore', function(accounts) {
  describe('buyUVT', function() {
    it('sends UVT tokens to account in exchange for ETH', async() => {
      var contracts = await setupContracts();
      var ledger = contracts[0];
      var token = contracts[1];

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
      var ledger = await UVTCore.new(token.address);
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

      await addValidGateways(ledger, accounts);
      await createValidSearchRequest(ledger, token, accounts);

      var data = await ledger.getMySearchRequest({from: accounts[1]});
      assert.equal(data[0], accounts[1], 'record was saved to storage with correct owner');
    });

    describe('-- Inherited from UVTChannels', function() {
      describe('_openChannel', function() {
        it('creates a channel and adds it to storage', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];

          await addValidGateways(ledger, accounts);
          await createValidSearchRequest(ledger, token, accounts);

          var data = await ledger.getMySearchRequest({from: accounts[1]});
          var channelData = await ledger.getChannel(data[3]);
          assert.equal(channelData[0], accounts[1], 'record was saved to storage with correct owner');
        });

        it('moves UVT tokens from the sender to the contract', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];

          await addValidGateways(ledger, accounts);

          // code from createValidSearchRequest()
          var uvtFee = 30; // 10 UVT per gateway
          await ledger.buyUVT(uvtFee, {from: accounts[1], value: uvtFee});
          await token.approve(ledger.address, uvtFee, {from: accounts[1]});

          var contractBalanceBefore = await token.balanceOf(ledger.address);
          var accountBalanceBefore = await token.balanceOf(accounts[1]);

          return await ledger.createSearchRequest(123, [0,1,2], {from: accounts[1]});

          var contractBalanceAfter = await token.balanceOf(ledger.address);
          var accountBalanceAfter = await token.balanceOf(accounts[1]);

          assert.equal(web3.toDecimal(contractBalanceAfter), web3.toDecimal(contractBalanceBefore) - uvtFee, 'account paid UVT tokens');
          assert.equal(web3.toDecimal(accountBalanceAfter), web3.toDecimal(accountBalanceBefore) + uvtFee, 'contract received UVT tokens');
        });

        it('broadcasts a ChannelOpened event', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];

          await addValidGateways(ledger, accounts);
          var tx = await createValidSearchRequest(ledger, token, accounts);
          expectEvent.inTransaction(tx, 'ChannelOpened');
        });

        it('should not open a channel if the account does not have enough UVT', async() => {
          var contracts = await setupContracts();
          var ledger = contracts[0];
          var token = contracts[1];

          await addValidGateways(ledger, accounts);

          // code from createValidSearchRequest()
          var uvtFee = 30; // 10 UVT per gateway
          var userBought = 5;
          await ledger.buyUVT(userBought, {from: accounts[1], value: userBought});
          await token.approve(ledger.address, uvtFee, {from: accounts[1]});
          try {
            await ledger.createSearchRequest(123, [0,1,2], {from: accounts[1]});
            assert.fail('it should have thrown before');
          } catch (error) {
            assertRevert(error);
          }
        });
      });
    });
  });
});
