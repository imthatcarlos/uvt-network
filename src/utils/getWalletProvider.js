var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = process.env.REACT_APP_INFURA_TOKEN || "e4X2v9uOjyfm58d51YBq";

// metamask ropsten wallet
var mnemonic = "output layer famous stuff unit swift clip crumble puppy involve tape hybrid";

let getWalletProvider = function(metamaskAddressIdx = 0) {
  return new HDWalletProvider(
    mnemonic,
    "https://ropsten.infura.io/"+infura_apikey,
    metamaskAddressIdx
  );
}

module.exports = getWalletProvider;
