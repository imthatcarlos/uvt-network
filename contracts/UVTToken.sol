pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol';
import './UVTCore.sol';
import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';

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
   * NOTE: Overriden so we can approve the fee and create the search
   *       request in one transaction
   *
   * @param _spender   The address which will spend the funds - NOTE: not using anymore
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
    returns (bytes32)
  {
    allowed[msg.sender][address(this)] = _value;
    Approval(msg.sender, address(this), _value);

    bytes32 id = coreContract.createSearchRequest(endpointId, gatewayIds);

    // transfer funds to escrow contract
    require(_transferFrom(msg.sender, _spender, _value));

    return id;
  }

  /**
   * Taken from zeppelin-solidity/contracts/token/StandardToken.sol
   * NOTE: Overridden so we can approve the fee from this contract
   *
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function _transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][address(this)]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][address(this)] = allowed[_from][address(this)].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }
}
