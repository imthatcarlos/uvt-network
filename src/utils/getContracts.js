import contract from 'truffle-contract';
import getWeb3 from 'utils/getWeb3';

import tokenArtifact from 'abis/UVTToken.json';
import coreArtifact from 'abis/UVTCore.json';

const UVTTOKEN_ADDRESS='0x6096a16bf9f30f05ea2ae908be5aa46d79734683';
const UVTCORE_ADDRESS='0xda9b5906ef23c2cf5dac3b16c41daa10c07c4e8f';

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
