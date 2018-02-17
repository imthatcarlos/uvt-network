var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = process.env.REACT_APP_INFURA_TOKEN || "e4X2v9uOjyfm58d51YBq";

// metamask ropsten wallet
var mnemonic = "output layer famous stuff unit swift clip crumble puppy involve tape hybrid";
var metamask_address_idx = 0;

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id,
      gas: 6721975 // 4700000
    },
    ropsten: {
      network_id: 3,
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"+infura_apikey, metamask_address_idx)
    }
  }
};
