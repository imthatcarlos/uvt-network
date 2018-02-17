import contract from 'truffle-contract';
import getWeb3 from 'utils/getWeb3';

import tokenArtifact from 'json/UVTToken.json';
import coreArtifact from 'json/UVTCore.json';
import odrArtifact from 'json/OpenDeviceRegistry.json';

var addresses = require("json/addresses.json");

const UVTTOKEN_ADDRESS = addresses["contracts"]["development"]["UVTToken"];
const UVTCORE_ADDRESS  = addresses["contracts"]["development"]["UVTCore"];
const ODR_ADDRESS      = addresses["contracts"]["development"]["OpenDeviceRegistry"];

let getContracts = new Promise(function(resolve, reject) {
  getWeb3
  .then(results => {
    const coreContract = contract(coreArtifact);
    const tokenContract = contract(tokenArtifact);
    const odrContract = contract(odrArtifact);

    coreContract.setProvider(results.web3.currentProvider);
    tokenContract.setProvider(results.web3.currentProvider);
    odrContract.setProvider(results.web3.currentProvider);

    const core = coreContract.at(UVTCORE_ADDRESS);
    const token = tokenContract.at(UVTTOKEN_ADDRESS);
    const deviceRegistry = odrContract.at(ODR_ADDRESS);

    var data = {
      web3:           results.web3,
      uvtToken:       token,
      uvtCore:        core,
      deviceRegistry: deviceRegistry
    };

    resolve(data);
  })
  .catch(() => {
    console.log('Error finding web3.');
  });
})

export default getContracts
