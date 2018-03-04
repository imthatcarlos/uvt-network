/**
 * This script is meant to act as a seed task, preparing contracts for demo purposes
 *
 * NOTE: testrpc must be running with contracts already migrated in order for this to run
 *
 * 1. Mint 10000 UVT for the UVTCore contract
 * 2. Create a dummy Gateway to use up the 0 id
 * 3. Create 'real' gateways used for the demo
 */

const Web3 = require('web3');
const contract = require('truffle-contract');

const tokenArtifact = require('./../src/json/UVTToken.json');
const coreArtifact  = require('./../src/json/UVTCore.json');
const odrArtifact   = require('./../src/json/OpenDeviceRegistry.json');

var fs = require("fs");
var path = require("path");
var filePath = path.join(__dirname, "../src/json/addresses.json");
var json = JSON.parse(fs.readFileSync(filePath, "utf8"));

const network = "development";

const UVTTOKEN_ADDRESS = json["contracts"][network]["UVTToken"];
const UVTCORE_ADDRESS  = json["contracts"][network]["UVTCore"];
const ODR_ADDRESS      = json["contracts"][network]["OpenDeviceRegistry"];

const UVT_MINT_AMOUNT = 10000;
// to be created by eth accounts 4..8
const SEED_GATEWAY_DATA = [
  ["127.0.0.3", "37.5566867", "-122.3291684", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.4", "37.5566797", "-122.3251684", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.5", "37.5566707", "-122.3203706", "San Mateo", "94402", "809+Bromfield+Rd/+San+Mateo,+CA+94402"],
  ["127.0.0.6", "41.9367710", "-87.737053", "Chicago", "60641", "4159+W+Addison+St/Chicago,+IL+60641"],
  ["127.0.0.7", "41.9536108", "-87.7821306", "Chicago", "60641", "4159+W+Addison+St/Chicago,+IL+60641"]
]

async function mintToken(contracts) {
  try {
    await contracts.uvtToken.mint(
      contracts.uvtCore.address,
      UVT_MINT_AMOUNT,
      {from: contracts.web3.eth.accounts[0]}
    );
    await contracts.uvtToken.finishMinting({from: contracts.web3.eth.accounts[0]});
    console.log("minted 10000 tokens for UVTCore at: " + contracts.uvtCore.address);
  } catch(error) {
    console.log(error);
  }
}

async function addDummyGateway(contracts) {
  try {
    await contracts.deviceRegistry.addGateway(
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      {from: contracts.web3.eth.accounts[9], gas: 300000}
    );
    console.log("added dummy gateway, taking care of index 0");
  } catch(error) {
    console.log(error);
  }
}

async function addRealGateways(contracts) {
  for(var i = 0; i < SEED_GATEWAY_DATA.length; i++) {
    try {
      await contracts.deviceRegistry.addGateway(
        SEED_GATEWAY_DATA[i][0],
        SEED_GATEWAY_DATA[i][1],
        SEED_GATEWAY_DATA[i][2],
        SEED_GATEWAY_DATA[i][3],
        SEED_GATEWAY_DATA[i][4],
        SEED_GATEWAY_DATA[i][5],
        {from: contracts.web3.eth.accounts[8-i], gas: 300000}
      );
      console.log("added gateway for web3.eth.accounts[" + (8-i) +"]: " + contracts.web3.eth.accounts[8-i]);
    } catch (error) {
      console.log(error);
    }
  }
}

async function setUVTCoreAddress(contracts) {
  await contracts.uvtToken.setUVTCoreAddress(contracts.uvtCore.address, {from: contracts.web3.eth.accounts[0]});
  console.log("set UVTCore address on UVTToken");
}

function getContracts() {
  // TODO: from configured??
  var provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  var web3 = new Web3(provider);

  const coreContract = contract(coreArtifact);
  const tokenContract = contract(tokenArtifact);
  const odrContract = contract(odrArtifact);

  coreContract.setProvider(web3.currentProvider);
  tokenContract.setProvider(web3.currentProvider);
  odrContract.setProvider(web3.currentProvider);

  const core = coreContract.at(UVTCORE_ADDRESS);
  const token = tokenContract.at(UVTTOKEN_ADDRESS);
  const deviceRegistry = odrContract.at(ODR_ADDRESS);

  return {
    web3:     web3,
    uvtToken: token,
    uvtCore:  core,
    deviceRegistry: deviceRegistry
  };
}

module.exports = function(callback) {
  console.log("start seeding");
  var contracts = getContracts();
  try {
    setUVTCoreAddress(contracts);
    mintToken(contracts);
    addDummyGateway(contracts);
    addRealGateways(contracts);
  } catch(error) {
    console.log(error);
    console.log("seed unsuccessful - see errors");
    callback(err);
  }
}
