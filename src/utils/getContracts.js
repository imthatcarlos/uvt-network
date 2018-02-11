import contract from 'truffle-contract';
import getWeb3 from 'utils/getWeb3';

import tokenArtifact from './../json/UVTToken.json';
import coreArtifact from './../json/UVTCore.json';

var fs = require("fs");
var path = require("path");
var filePath = path.join(__dirname, "../../json/addresses.json");
var json = JSON.parse(fs.readFileSync(filePath, "utf8"));

const UVTTOKEN_ADDRESS = json["contracts"]["development"]["UVTToken"];
const UVTCORE_ADDRESS  = json["contracts"]["development"]["UVTCore"];

let getContracts = new Promise(function(resolve, reject) {
  getWeb3
  .then(results => {
    const coreContract = contract(coreArtifact);
    const tokenContract = contract(tokenArtifact);

    coreContract.setProvider(results.web3.currentProvider);
    tokenContract.setProvider(results.web3.currentProvider);

    const core = coreContract.at(UVTCORE_ADDRESS);
    const token = tokenContract.at(UVTTOKEN_ADDRESS);

    var data = {
      web3:     results.web3,
      uvtToken: token,
      uvtCore:  core
    };

    resolve(data);
  })
  .catch(() => {
    console.log('Error finding web3.');
  });
})

export default getContracts
