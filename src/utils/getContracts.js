import contract from 'truffle-contract';
import getWeb3 from 'utils/getWeb3';

import tokenArtifact from 'abis/UVTToken.json';
import coreArtifact from 'abis/UVTCore.json';

const UVTTOKEN_ADDRESS='0xe5909d3643c5647150235442961414c0628d4dc6';
const UVTCORE_ADDRESS='0x529346e9b5d8f88db7cfa54e7024b472c62bb533';

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
