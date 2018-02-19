# UVT Network
This nodejs application interacts with the smart contracts UVTCore, UVTToken,
and OpenDeviceRegistry. Currently deployed on the Ropsten testnet, at addresses:
```
UVTToken:           0x4dbd7410c285abf0df95424598fa54a7a53a9863
UVTCore:            0x27cc7461e492dc20ef1cfe32f24d2e40cead2823
OpenDeviceRegistry: 0x20b07d5d3113d7c5c0f9407d59b80ed732aafbca
```

### Setup
Clone the repo and run `npm install`. You will need truffle installed globally

### Compile & migrate
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

### Run tests
Make sure you have testrpc (or ganache-cli) running and listening on port 8545
```
truffle test
```
