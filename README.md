# UVT Network

[Demo video](https://drive.google.com/file/d/1ZyiQ1nvjOl33c2a_JvzJI2A2oR2MHrCN/view?usp=sharing)

This nodejs application interacts with the smart contracts UVTCore, UVTToken,
and OpenDeviceRegistry. Currently deployed on the Ropsten testnet, at addresses:
```
UVTToken:           0x692def9b34d77fc6a0508e170b49e37405bd12f5
UVTCore:            0x07efab77857bec0085dd0ed4457c8c82e7d9ead1
OpenDeviceRegistry: 0xdde5eb3cd07e7aca1377af8aeea23f1636ec1ca3
```

### Setup
Clone the repo and run `npm install`. You will need truffle installed globally

### Compile & migrate
Make sure you have testrpc (or ganache-cli) running and listening on port 8545
```
truffle compile
truffle migrate --network [development|ropsten]
```

### Development
To start the application locally on port 3000 run `npm start`.

There is a "seed" script that mints tokens for UVTCore, and add valid (and one dummy)
devices to the ODR. You will need testrpc (or ganache-cli) running
in order for the script to access test ETH accounts.
```
truffle exec scripts/seed.js
```

And for Ropsten
```
truffle exec scripts/seed_ropsten.js --network ropsten
```

For populating, transferring contract ownership and destroying contracts. Make
sure `mnemonic` in `utils/getWalletProvider.js` is set to your Metamask seed words

### Run tests
```
truffle test
```
