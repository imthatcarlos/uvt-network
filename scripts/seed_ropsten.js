/**
 * This script is meant to act as a seed task, preparing contracts for the Ropsten
 * test network
 *
 * NOTE: contracts should be migrated, and 6 extra Metamask accounts available with ETH
 *
 * 1. Mint 10000 UVT for the UVTCore contract
 * 2. Create a dummy Gateway to use up the 0 id
 * 3. Create 'real' gateways used for the demo
 */

const Web3 = require('web3');
const contract = require('truffle-contract');

const getWalletProvider = require('./../src/utils/getWalletProvider');

const tokenArtifact = require('./../src/json/UVTToken.json');
const coreArtifact  = require('./../src/json/UVTCore.json');
const odrArtifact   = require('./../src/json/OpenDeviceRegistry.json');

var fs = require("fs");
var path = require("path");
var filePath = path.join(__dirname, "../src/json/addresses.json");
var json = JSON.parse(fs.readFileSync(filePath, "utf8"));

const NETWORK = "ropsten";

const UVTTOKEN_ADDRESS = json["contracts"][NETWORK]["UVTToken"];
const UVTCORE_ADDRESS  = json["contracts"][NETWORK]["UVTCore"];
const ODR_ADDRESS      = json["contracts"][NETWORK]["OpenDeviceRegistry"];

const UVT_MINT_AMOUNT = 1000;
// to be created by eth accounts 4..8
const SEED_GATEWAY_DATA = [
  ["127.0.0.3", "37.5566867", "-122.3291684", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.4", "37.5566797", "-122.3251684", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.6", "41.9367710", "-87.737053", "Chicago", "60641", "4159+W+Addison+St/Chicago,+IL+60641"],
  ["127.0.0.5", "37.5566707", "-122.3203706", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.7", "41.9536108", "-87.7821306", "Chicago", "60641", "4159+W+Addison+St/Chicago,+IL+60641"]
]

const NEW_OWNER_ADDRESS="0x4D801B0a7db8097BeCF2B3142B8245923781e1c4"

async function mintToken(contracts, ownerAccount) {
  console.log("minting tokens...");
  try {
    var tx = await contracts.uvtToken.mint(
      contracts.uvtCore.address,
      UVT_MINT_AMOUNT,
      {from: ownerAccount, gas: 300000}
    );
    await contracts.uvtToken.finishMinting({from: ownerAccount});
    console.log("minted " + UVT_MINT_AMOUNT + " tokens for UVTCore at: " + contracts.uvtCore.address);
  } catch(error) {
    console.log(error);
  }
}

async function addDummyGateway(deviceRegistry, account) {
  console.log("adding dummy gateway...");
  try {
    var tx = await deviceRegistry.addGateway(
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      {from: account, gas: 300000}
    );
    console.log("added dummy gateway, taking care of index 0");
  } catch(error) {
    console.log(error);
  }
}

async function addRealGateway(deviceRegistry, account, seedData) {
  console.log("adding real gateway...");
  try {
    await deviceRegistry.addGateway(
      seedData[0],
      seedData[1],
      seedData[2],
      seedData[3],
      seedData[4],
      seedData[5],
      {from: account, gas: 300000}
    );
    console.log("added gateway for web3.eth.account: " + account);
  } catch (error) {
    console.log(error);
  }
}

function getContracts(metamaskAddressIdx) {
  var web3 = new Web3(getWalletProvider(metamaskAddressIdx));

  var coreContract = contract(coreArtifact);
  var tokenContract = contract(tokenArtifact);
  var odrContract = contract(odrArtifact);

  coreContract.setProvider(web3.currentProvider);
  tokenContract.setProvider(web3.currentProvider);
  odrContract.setProvider(web3.currentProvider);

  var core = coreContract.at(UVTCORE_ADDRESS);
  var token = tokenContract.at(UVTTOKEN_ADDRESS);
  var deviceRegistry = odrContract.at(ODR_ADDRESS);

  return {
    web3:     web3,
    uvtToken: token,
    uvtCore:  core,
    deviceRegistry: deviceRegistry
  };
}

async function destroyContracts() {
  var contracts = getContracts(0);
  console.log("getting contract owner account...");
  await contracts.web3.eth.getAccounts(async function(error, result) {
    console.log("destroying UVTCore and OpenDeviceRegistry...");
    await contracts.uvtCore.destroy({from: result[0], gas: 300000});
    await contracts.deviceRegistry.destroy({from: result[0], gas: 300000});
    console.log("contracts destroyed");
  });
}

async function transferOwnership() {
  var contracts = getContracts(0); // contracts owner

  console.log("getting contract owner account...");
  await contracts.web3.eth.getAccounts(async function(error, result) {
    console.log("setting new owner for all smart contracts");
    await contracts.uvtCore.transferOwnership(NEW_OWNER_ADDRESS, {from: result[0]});
    console.log("UVTCore - done");
    await contracts.deviceRegistry.transferOwnership(NEW_OWNER_ADDRESS, {from: result[0]});
    console.log("OpenDeviceRegistry - done");
    await contracts.uvtToken.transferOwnership(NEW_OWNER_ADDRESS, {from: result[0]});
    console.log("UVTToken - done");
  });
}

// Metamask provider won't refresh, so we can't do all blocks at once.
// The for loop at the end won't work either.
module.exports = async function(callback) {
  console.log("start seeding - ropsten");

  // var contracts = getContracts(0); // contracts owner
  // console.log("getting owner web3 account...");
  // await contracts.web3.eth.getAccounts(async function(error, result) {
  //   if (!error) {
  //     console.log("account: " + result[0]);
  //     try {
  //       await mintToken(contracts, result[0]);
  //     } catch(error) {
  //       console.log(error);
  //       console.log("seed unsuccessful - see errors");
  //       callback(err);
  //     }
  //   }
  // });

  // var _contracts = getContracts(1);
  // console.log("getting web3 metamask account at id: 1");
  // await _contracts.web3.eth.getAccounts(function(error, result) {
  //   if (!error) {
  //     console.log("account: " + result[0]);
  //     try {
  //       addDummyGateway(_contracts.deviceRegistry, result[0]);
  //     } catch(error) {
  //       console.log(error);
  //       console.log("seed unsuccessful - see errors");
  //       callback(err);
  //     }
  //   }
  // });
  //
  // var seedData = SEED_GATEWAY_DATA;
  // for (var i = 0; i < SEED_GATEWAY_DATA.length; i++) {
  //   var _contracts = getContracts(i + 2);
  //   console.log("getting web3 metamask account at id: " + (i+2));
  //   _contracts.web3.eth.getAccounts(function(error, result) {
  //     if (!error) {
  //       console.log("account: " + result[0]);
  //       try {
  //         addRealGateway(_contracts.deviceRegistry, result[0], seedData[0]);
  //         seedData.shift();
  //       } catch(error) {
  //         console.log(error);
  //         console.log("seed unsuccessful - see errors");
  //         callback(err);
  //       }
  //     }
  //   });
  // }
}
