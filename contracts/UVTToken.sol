pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol';
import './UVTCore.sol';

/**
 * A MintableToken is both a StandardToken and Ownable
 */
contract UVTToken is MintableToken {
  string public name = "Universal Visibility Token";
  string public symbol = "UVT";
  uint8 public decimals = 18;

  UVTCore coreContract;

  /**
   * Set the address of the UVTCore contract
   */
  function setUVTCoreAddress(address uvtCore) public onlyOwner {
    coreContract = UVTCore(uvtCore);
  }

  /**
   * Taken from zeppelin-solidity/contracts/token/StandardToken.sol
   * Approve the passed address to spend the specified amount of tokens on
   * behalf of msg.sender.
   *
   * NOTE: This function exists so we can approve the fee and create the search
   *       request in one transaction
   *
   * @param _spender   The address which will spend the funds
   * @param _value     The amount of tokens to be spent
   * @param endpointId The id of the endpoint gateways are to find
   * @param gatewayIds The ids of gateways to be invoked
   */
  function approveAndCreateRequest(
    address _spender,
    uint256 _value,
    bytes32 endpointId,
    uint[] gatewayIds
  )
    public
    returns (bool)
  {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);

    coreContract.createSearchRequest(endpointId, gatewayIds);

    return true;
  }
}
