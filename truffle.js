let getWalletProvider = require('./src/utils/getWalletProvider');
let contractOwnerAddressIdx = 0;

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
      provider: getWalletProvider(contractOwnerAddressIdx),
      gas: 4700000
    }
  }
};
