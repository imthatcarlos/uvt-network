pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/token/ERC20.sol';

/**
 * @title UVTChannels
 * @author Carlos Beltran <imthatcarlos@gmail.com>
 *
 * @dev Ethereum payment channels allow for off-chain transactions with an on-chain
 * settlement. Parties open one channel with a deposit, continue to sign and verify
 * transactions off-chain, and close the channel with one final transaction, on-chain.
 *
 * This implementation is simplified for the purposes of UVT Network. One channel
 * is created between the search initiator and the gateways invoked, with
 * funds being disbursed to all after the search concludes. Functions are
 * internal, with the exception of getters
 *
 */
contract UVTChannels {

  //============================================================================
  // EVENTS
  //============================================================================

  event ChannelOpened(bytes32 indexed id);
  event ChannelClosed(bytes32 indexed id);

  //============================================================================
  // STORAGE
  //============================================================================

  enum ChannelState { Open, Closed }

  struct Channel {
    address sender;
    uint[] gatewayIds;
    uint deposit;
    ChannelState state;
    uint paidOut;
  }

  mapping (bytes32 => Channel) channels;
  mapping (address => bytes32) activeIds;

  //============================================================================
  // MODIFIERS
  //============================================================================

  modifier validChannel(bytes32 id) {
    require(channels[id].deposit != 0);
    _;
  }

  modifier notClosed(bytes32 id) {
    require(channels[id].state != ChannelState.Closed);
    _;
  }

  //============================================================================
  // EXTERNAL FUNCTIONS
  //============================================================================

  function getChannelId(address sender)
    external
    view
    returns (bytes32)
  {
    return activeIds[sender];
  }

  function getChannel(bytes32 id)
    external
    validChannel(id)
    view
    returns (
      address sender,
      uint[] gatewayIds,
      uint deposit,
      ChannelState state,
      uint paidOut
    )
  {
    Channel memory channel = channels[id];

    sender = channel.sender;
    gatewayIds = channel.gatewayIds;
    deposit = channel.deposit;
    state = channel.state;
    paidOut = channel.paidOut;
  }

  function getChannelStatus(bytes32 id)
    external
    validChannel(id)
    constant
    returns (ChannelState)
  {
    return channels[id].state;
  }

  //============================================================================
  // INTERNAL FUNCTIONS
  //============================================================================

  /**
   * Open a new channel with the recipient. Require a non-zero message
   *
   * @param gatewayIds The ids of gateways to be part of the channel
   * @param amount     The deposit amount (in UVT)
   * @param uvtToken   ERC20 object for UVTToken
   */
  function _openChannel(uint[] gatewayIds, uint amount, ERC20 uvtToken)
    internal
    returns (bytes32)
  {
    // create a channel with the id being a hash of the data
    bytes32 id = keccak256(msg.sender, gatewayIds[0], now);

    Channel memory newChannel = Channel({
      sender: msg.sender,
      gatewayIds: gatewayIds,
      deposit: amount,
      state: ChannelState.Open,
      paidOut: 0
    });

    // make the deposit
    require(uvtToken.transferFrom(msg.sender, address(this), amount));

    // add it to storage and lookup
    channels[id] = newChannel;
    activeIds[msg.sender] = id;

    ChannelOpened(id);

    return id;
  }

  /**
   * Close the channel
   *
   * @param id The channel id
   */
  function _closeChannel(bytes32 id)
    internal
    notClosed(id)
    returns (bool)
  {
    // close the channel
    channels[id].state = ChannelState.Closed;

    // remove from lookup
    delete activeIds[channels[id].sender];

    ChannelClosed(id);

    return true;
  }

  function _reopenChannel(bytes32 id)
   internal
   returns (bool)
  {
    // open the channel
    channels[id].state = ChannelState.Open;

    // add to lookup
    activeIds[channels[id].sender] = id;

    ChannelOpened(id);

    return true;
  }
}
