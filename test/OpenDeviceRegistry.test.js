const util = require('ethereumjs-util');

const UVTCore = artifacts.require('./UVTCore.sol');

const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const expectEvent = require('../node_modules/zeppelin-solidity/test/helpers/expectEvent');
const addValidGateway = require('./helpers/addValidGateway');

contract('UVTCore', function(accounts) {
  describe('-- Inherited from OpenDeviceRegistry', function() {
    describe('addGateway', function() {
      it('creates a gateway and adds it to storage', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var gatewayId = await ledger.getMyGatewayId();
        var res = await ledger.getGateway(gatewayId);
        assert.equal(res[0], accounts[0], 'ledger was saved to storage with correct owner');
      });

      it('should not allow a gateway added without an ip', async() => {
        var ledger = await UVTCore.new();
        try {
          await ledger.addGateway(
            '',
            '41.878114',
            '-87.629798',
            'chicago',
            '60641',
            ''
          );
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('should not allow a gateway added without a latitude or longitude', async() => {
        var ledger = await UVTCore.new();
        try {
          await ledger.addGateway(
            '127.0.0.1',
            '',
            '',
            'chicago',
            '60641',
            ''
          );
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('broadcasts a GatewayAdded event', async() => {
        var ledger = await UVTCore.new();
        var tx = await addValidGateway(ledger, accounts[0]);
        expectEvent.inTransaction(tx, 'GatewayAdded');
      });

      it('should not allow an address to own more than one gateway', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);
        await addValidGateway(ledger, accounts[1]);
        try {
          await addValidGateway(ledger, accounts[1]);
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });
    });

    describe('removeGateway', function() {
      it('deletes a gateway and removes it from storage', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var gatewayId = await ledger.getMyGatewayId();
        await ledger.removeGateway(gatewayId);

        try {
          await ledger.getMyGatewayId();
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('broadcasts a GatewayRemoved event', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var gatewayId = await ledger.getMyGatewayId();
        var tx = await ledger.removeGateway(gatewayId);
        expectEvent.inTransaction(tx, 'GatewayRemoved');
      });

      it('should not allow anyone but the gateway owner to remove it', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var gatewayId = await ledger.getMyGatewayId();
        try {
          await ledger.removeGateway(gatewayId, {from: accounts[1]});
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });
    });

    describe('getGatewaysInRange', function() {
      it('returns ids for gateways in the specified city/area', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);
        await addValidGateway(ledger, accounts[1]);
        await addValidGateway(ledger, accounts[2], '10026');
        await addValidGateway(ledger, accounts[3], '10027');

        var res = await ledger.getGatewaysInRange('chicago', '10027');
        var ids = res.map(x => web3.toDecimal(x)).filter(Number); // don't need non-zero

        assert.equal(ids[0], 3, 'only the gateway with id 3 is returned');
      });
    });

    describe('getGatewayCoordinates', function() {
      it('returns geo location data for a gateway', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var data = await ledger.getGatewayCoordinates(0);

        assert.equal(data[0], '41.878114', 'returns the lat for gateway at index 0');
        assert.equal(data[1], '-87.629798', 'returns the long for gateway at index 0');
      });
    });

    describe('getGateway', function() {
      it('returns all the data for a gateway id', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var data = await ledger.getGateway(0);
        assert.equal(data[0], accounts[0], 'the owner matches');
        assert.equal(data[1], '127.0.0.1', 'the ip matches');
        assert.equal(data[2], '41.878114', 'the lat matches');
        assert.equal(data[3], '-87.629798', 'the long matches');
      });

      it('should not allow anyone but the contract owner to access', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        try {
          var data = await ledger.getGateway(0, {from: accounts[1]});
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });
    });

    describe('getGatewaysCount', function() {
      it('returns the number of gateways in storage', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);
        await addValidGateway(ledger, accounts[1]);

        var res = await ledger.getGatewaysCount();
        assert.equal(web3.toDecimal(res), 2, 'returns 2');
      });

      it('should not allow anyone but the contract owner to access', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);
        await addValidGateway(ledger, accounts[1]);

        try {
          await ledger.getGatewaysCount({from: accounts[1]});
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });
    });

    describe('getMyGatewayId', function() {
      it('returns the id for the owner\'s gateway', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        var res = await ledger.getMyGatewayId();
        assert.equal(web3.toDecimal(res), 0, 'returns the correct id');
      });

      it('fails when the owner has no gateway created', async() => {
        var ledger = await UVTCore.new();
        await addValidGateway(ledger, accounts[0]);

        try {
          await ledger.getMyGatewayId({from: accounts[1]});
          assert.fail('it should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });
    });
  });
});
