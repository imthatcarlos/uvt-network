const util = require('ethereumjs-util');

const UVTCore = artifacts.require('./UVTCore.sol');
const UVTToken = artifacts.require('./UVTToken.sol');

const assertRevert = require('../node_modules/zeppelin-solidity/test/helpers/assertRevert');
const expectEvent = require('../node_modules/zeppelin-solidity/test/helpers/expectEvent');

/**
 * Create instance of UVTToken and mint some for the account given
 */
async function mintToken (account, coreContract) {
  var token = await MyToken.new({from: account});
  await token.mint(coreContract, 1000000);
  await token.finishMinting();
  return token;
}
