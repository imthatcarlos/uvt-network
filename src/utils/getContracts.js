import contract from 'truffle-contract';

import Web3 from 'web3';
import getWeb3 from 'utils/getWeb3';

import tokenArtifact from 'abis/UVTToken.json';
import coreArtifact from 'abis/UVTCore.json';

const UVTTOKEN_ADDRESS='0x8ac427b54c3ac7e28f970015366dee69d2e421d0';
const UVTCORE_ADDRESS='0x01a38a4982d412f505357f42c516162a63ce24ec';

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
