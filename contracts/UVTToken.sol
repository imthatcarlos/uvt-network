pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol';

/*
 * A MintableToken is both a StandardToken and Ownable
 */
contract UVTToken is MintableToken {
  string public name = "Universal Visibility Token";
  string public symbol = "UVT";
  uint8 public decimals = 18;
}
