pragma solidity ^0.4.18;
//pragma experimental ABIEncoderV2;

import './UVTChannels.sol';
import './OpenDeviceRegistry.sol';
import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20.sol';
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title UVTCore
 * @author Carlos Beltran <imthatcarlos@gmail.com>
 *
 * @dev This contract manages the ODR, payment channels, and the invokation
 * of gateways when a user submits a search request. Certain functionality
 * is limited to the contract's owner, such as manually closing channels.
 * TODO: Contract is too large, gas exceeds the mainnet gasLimit
 * OpenDeviceRegistry could be deployed on its own
 */
contract UVTCore is UVTChannels, Ownable {

  //============================================================================
  // EVENTS
  //============================================================================

  event SearchInitiated(address indexed owner, bytes32 id, bytes32 endpointId);
  event InvokeGateway(uint indexed id, bytes32 endpointId, bytes32 requestId);
  event SearchEndpointFound(bytes32 indexed id, uint gatewayId, uint time, string lat, string long);
  event SearchCancelled(bytes32 indexed id, bool gatewaysPaid);
  event SearchExpired(bytes32 indexed id);
  event ApprovedEndpointFound(bytes32 indexed id);

  event PurchasedUVT(address indexed account, uint amount);
  event ReceivedFunds(address sender, uint value);

  //============================================================================
  // STORAGE
  //============================================================================

  enum SearchState { Searching, Found, Cancelled, Expired }

  struct SearchRequest {
    address owner;
    bytes32 endpointId;
    uint[] invokedGateways;
    bytes32 channelId;
    SearchState state;
    uint expires;
  }

  mapping (bytes32 => SearchRequest) searchRequests;
  mapping (address => bytes32) accountToRequestIds;

  address uvtTokenAddress;
  OpenDeviceRegistry public deviceRegistry;

  uint public GATEWAY_COST_UVT = 10;

  //============================================================================
  // MODIFIERS
  //============================================================================

  modifier validRequest(bytes32 id) {
    require(searchRequests[id].owner != address(0));
    _;
  }

  modifier notExpired(bytes32 id) {
    require(searchRequests[id].expires > now);
    _;
  }

  modifier onlyRequestOwner {
    require(searchRequests[accountToRequestIds[msg.sender]].owner == msg.sender);
    _;
  }

  modifier onlyOwnerOrRequestOwner(bytes32 id) {
    require(
      searchRequests[id].owner == msg.sender
      || msg.sender == owner
    );
    _;
  }

  /**
   * The contract's constructor
   * Upon initializing, the owner MUST send UVT to this contract in order to
   * fund accounts when they would like to buy UVT with ETH.
   *
   * @param tokenAddress The address of the UVTToken contract
   */
  function UVTCore(address tokenAddress, address odrAddress) public {
    owner = msg.sender;
    uvtTokenAddress = tokenAddress;
    deviceRegistry = OpenDeviceRegistry(odrAddress);
  }

  //============================================================================
  // EXTERNAL FUNCTIONS
  //============================================================================

  /**
   * Transfer UVT tokens to the account in exchange for ETH
   * NOTE: the exchange is 0.000450 ETH per UVT
   */
  function buyUVT(uint amount) external payable {
    // not necessary?
    //require(msg.value >= amount);

    ERC20 uvtToken = ERC20(uvtTokenAddress);
    require(uvtToken.transfer(msg.sender, amount));
    PurchasedUVT(msg.sender, amount);
  }

  /**
   * Create a new search request. By now, the user has selected which gateways
   * to invoke and has approved the fee.
   * A channel is created between the user and the invoked gateways, depositing
   * UVT tokens from user's account.
   * Invoked gateways are notified of the request.
   * The search is set to expire in 1 hour
   * TODO: tx.origin shouldn't be used but we are calling from UVTToken
   *
   * @param endpointId      The id of the endpoint gateways are to find
   * @param gatewayIds The ids of gateways to be invoked
   */
  function createSearchRequest(bytes32 endpointId, uint[] gatewayIds)
    public
  {
    // sanity checks
    require(endpointId != bytes32(0));
    require(gatewayIds.length != 0);

    uint totalCost = _verifyPayment(gatewayIds.length);

    // open the channel and fund it with the account's tokens
    bytes32 channelId = _openChannel(gatewayIds, totalCost, ERC20(uvtTokenAddress));

    // create the request
    bytes32 id = keccak256(tx.origin, channelId, now);
    SearchRequest memory request = SearchRequest({
      owner: tx.origin,
      endpointId: endpointId,
      invokedGateways: gatewayIds,
      channelId: channelId,
      state: SearchState.Searching,
      expires: (now + 1 hours)
    });

    // save to storage and lookup table
    searchRequests[id] = request;
    accountToRequestIds[tx.origin] = id;

    // invoke gateways
    SearchInitiated(tx.origin, id, endpointId);
    for(uint i = 0; i < gatewayIds.length; i++) {
      InvokeGateway(gatewayIds[i], endpointId, id);
    }
  }

  /**
   * Called from a gateway when it locates the missing item. Broadcasts an event
   * for the endpoint's owner to acknowledge
   *
   * @param requestId   The id of the search request
   * @param endpointSig [hash, r, s] Signature data provided by the missing item's LoRa
   * transmitter proving that it was indeed found
   * @param v           The "v" value of endpointSig
   * @param lat         The latitude part of the endpoint's current location
   * @param long        The longitude part of the endpoint's current location
   */
  /* function endpointFound(
    bytes32 requestId,
    bytes32[3] endpointSig,
    uint8 v,
    string lat,
    string long
  )
    external
    validRequest(requestId)
    notExpired(requestId)
  {
    // only a gateway owner may call this
    require(deviceRegistry.verifyGatewayOwner(msg.sender));

    uint gatewayId = deviceRegistry.getGatewayIdFromOwner(msg.sender);
    SearchRequest storage request = searchRequests[requestId];
    // verify the endpoint's signaure
    // TODO: not working atm
    //_verifyEndpoint(requestId, request.endpointId, endpointSig, v);

    // disburse the funds and close the channel
    _disburseFunds(request.channelId, true, gatewayId, true);
    _closeChannel(request.channelId);

    // update search state
    request.state = SearchState.Found;

    // remove from lookup table
    delete accountToRequestIds[msg.sender];

    SearchEndpointFound(requestId, gatewayId, now, lat, long);
  } */

  /**
   * Called to check if the request has expired, and if so, update the state
   * and close the channel.
   * This is called by the software client after the search period - the
   * invoked gateways should manage themselves
   */
  function searchExpired(bytes32 id)
    external
    validRequest(id)
    onlyRequestOwner
    returns (bool)
  {
    if (searchRequests[id].state == SearchState.Searching &&
      searchRequests[id].expires < now)
    {
      // disburse the funds and close the channel
      _disburseFunds(searchRequests[id].channelId, false, 0, true);
      _closeChannel(searchRequests[id].channelId);

      // update search state
      searchRequests[id].state = SearchState.Expired;
      SearchExpired(id);

      // remove from lookup table
      delete accountToRequestIds[msg.sender];

      return true;
    } else {
      return false;
    }
  }

  /**
   * Cancels the search request. The account is given a grace period of
   * 15 minutes where they cancel and be refunded their UVT tokens.
   * This is called by the search request owner
   */
  function cancelSearch(bytes32 id)
    external
    validRequest(id)
    notExpired(id)
    onlyRequestOwner
  {
    // diff between expiry and now should be > 45 min for refund
    bool shouldPayGateways;
    if ((searchRequests[id].expires - now) > 45 minutes) {
      shouldPayGateways = false;
    } else {
      shouldPayGateways = true;
    }

    // disburse the funds and close the channel
    _disburseFunds(searchRequests[id].channelId, false, 0, shouldPayGateways);
    _closeChannel(searchRequests[id].channelId);

    // update search state
    searchRequests[id].state = SearchState.Cancelled;

    // remove from lookup table
    delete accountToRequestIds[msg.sender];

    SearchCancelled(id, shouldPayGateways);
  }

  /**
   * Called from the software client to approve the item was found, close the
   * channel and release escrow
   *
   * @param requestId       The id of the search request
   * @param gatewayFoundId  The id of the gateway that found the item
   */
  function approveEndpointFound(
    bytes32 requestId,
    uint gatewayFoundId
  )
    external
    validRequest(requestId)
    notExpired(requestId)
    onlyRequestOwner()
  {
    SearchRequest storage request = searchRequests[requestId];

    // disburse the funds and close the channel
    _disburseFunds(request.channelId, true, gatewayFoundId, true);
    _closeChannel(request.channelId);

    // update search state
    request.state = SearchState.Found;

    // remove from lookup table
    delete accountToRequestIds[msg.sender];

    ApprovedEndpointFound(requestId);
  }

  /**
   * Renews the search request with the same parameters
   * Can only be called if the state is != Searching
   * NOTE: only possible because we don't clear the request OR channels from storage...
   * TODO: we should do this without an extra transaction, just update the channel's value
   * and notify the gateways to extend the expiry
   */
  /* function renewSearch(bytes32 id)
    external
    validRequest(id)
    onlyRequestOwner
  {
    SearchRequest storage request = searchRequests[id];

    // can only renew an expired or cancelled request
    require(request.state != SearchState.Searching);

    uint[] memory gatewayIds = channels[request.channelId].gatewayIds;

    // might not be necessary?
    _verifyPayment(gatewayIds.length);

    // open the channel and fund it with the account's tokens
    _reopenChannel(request.channelId);
    require(ERC20(uvtTokenAddress).transferFrom(
      msg.sender,
      address(this),
      channels[request.channelId].deposit
    ));

    // opened with same number of gateways, so new cost is the same
    channels[request.channelId].deposit = channels[request.channelId].deposit + channels[request.channelId].deposit;

    // update search state & expire time
    request.state = SearchState.Searching;
    request.expires = now + 1 hours;

    // re-add to lookup table
    accountToRequestIds[msg.sender] = id;

    // invoke gateways
    SearchInitiated(msg.sender, id, request.endpointId);
    for(uint i = 0; i < gatewayIds.length; i++) {
      InvokeGateway(gatewayIds[i], request.endpointId, id);
    }
  } */

  /**
   * Returns the id of the owner's search request
   * Can only be called by the owner of the request
   */
  function getSearchRequestId()
    external
    view
    onlyRequestOwner
    returns (bytes32 id)
  {

    return accountToRequestIds[msg.sender];
  }

  /**
   * Returns all information for the owner's search request
   * Can only be called by the owner of the request
   */
  function getSearchRequest()
    external
    view
    onlyRequestOwner
    returns (
      address owner,
      bytes32 endpointId,
      uint[] invokedGateways,
      bytes32 channelId,
      SearchState state,
      uint expires
    )
  {
    SearchRequest memory request = searchRequests[accountToRequestIds[msg.sender]];

    owner = request.owner;
    endpointId = request.endpointId;
    invokedGateways = request.invokedGateways;
    channelId = request.channelId;
    state = request.state;
    expires = request.expires;
  }

  /**
   * Returns the state of the owner's search request
   * Can only be called by the owner of the request
   */
  function getSearchRequestStatus()
    external
    view
    onlyRequestOwner
    returns (SearchState state)
  {
    bytes32 id = accountToRequestIds[msg.sender];

    if (
      searchRequests[id].state == SearchState.Searching
      && searchRequests[id].expires < now
    ) {
      return SearchState.Expired;
    } else {
      return searchRequests[id].state;
    }
  }

  /**
   * Returns all information for the given search request
   * Can only be called by the contract owner or request owner
   *
   * @param id The SearchRequest id
   */
  function getSearchRequestById(bytes32 id)
    external
    view
    onlyOwnerOrRequestOwner(id)
    returns (
      address owner,
      bytes32 endpointId,
      uint[] invokedGateways,
      bytes32 channelId,
      SearchState state,
      uint expires
    )
  {
    SearchRequest memory request = searchRequests[id];

    owner = request.owner;
    endpointId = request.endpointId;
    invokedGateways = request.invokedGateways;
    channelId = request.channelId;
    state = request.state;
    expires = request.expires;
  }

  function() external payable {
    ReceivedFunds(msg.sender, msg.value);
  }

  function withdrawBalance() external onlyOwner {
    owner.transfer(this.balance);
  }

  function destroy() external onlyOwner {
    selfdestruct(owner);
  }

  //============================================================================
  // INTERNAL FUNCTIONS
  //============================================================================

  /*
   * Disburse the channel's funds. If the gatewayIdFound param is set (> 0)
   * that gateway receives 50% of all other payouts
   *
   * @param channelId         The channel id
   * @param gatewayIdFound    The id of the gateway that located the endpoint.
   * Set to -1 if no gateway found the endpoint
   * @param shouldPayGateways Flag for whether the gateways are being paid out
   */
  function _disburseFunds(
      bytes32 channelId,
      bool endointFound,
      uint gatewayIdFound,
      bool shouldPayGateways
  )
    internal
    returns (bool)
  {
    Channel storage channel = channels[channelId];
    ERC20 uvtToken = ERC20(uvtTokenAddress);

    // if user cancelled within grace period, they get refunded
    if (shouldPayGateways) {
      // in case they renew the search, paidOut is updated with what they've
      // already paid
      uint value = channel.deposit - channel.paidOut;

      // what each gateway should get if evenly distributed
      uint allPayout = SafeMath.div(value, channel.gatewayIds.length);

      if (endointFound) {
        // pay gatewayIdFound 20% from everyone else's
        uint othersPayout = allPayout - SafeMath.div(allPayout, 5);
        uint finderPayout = SafeMath.mul(
          SafeMath.div(allPayout, 5),
          (channel.gatewayIds.length - 1)
        ) + allPayout;

        for (uint i = 0; i < channel.gatewayIds.length; i++) {
          if (channel.gatewayIds[i] == gatewayIdFound) {
            if (!uvtToken.transfer(deviceRegistry.getGatewayOwner(channel.gatewayIds[i]), finderPayout)) {
              return false;
            }
          } else {
            if (!uvtToken.transfer(deviceRegistry.getGatewayOwner(channel.gatewayIds[i]), othersPayout)) {
              return false;
            }
          }
        }
      } else {
        // pay everyone equally
        for (uint j = 0; j < channel.gatewayIds.length; j++) {
          if (!uvtToken.transfer(deviceRegistry.getGatewayOwner(channel.gatewayIds[j]), allPayout)) {
            return false;
          }
        }
      }

      /* TODO: a require() for the payouts being equal to the value */

      channel.paidOut = channel.deposit;
    } else {
      if (!uvtToken.transfer(channel.sender, channel.deposit)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify that the account has approved the fee
   * TODO: tx.origin shouldn't be used but we are calling from UVTToken
   *
   * @param gatewaysCount The number of gateways the account is paying for
   */
  function _verifyPayment(uint gatewaysCount) internal view returns (uint) {
    ERC20 uvtToken = ERC20(uvtTokenAddress);
    uint totalCost = _searchCost(gatewaysCount);

    // make sure they've approved the fee
    /* TODO: might not be necessary after first approval */
    require(uvtToken.allowance(tx.origin, address(this)) >= totalCost);

    return totalCost;
  }

  /**
   * The total cost (in UVT) for the search - in this case, the number of
   * gateways to be invoked
   *
   * @param gatewaysCount The number of gateways the account is paying for
   */
  function _searchCost(uint gatewaysCount) internal view returns (uint) {
    return SafeMath.mul(gatewaysCount, GATEWAY_COST_UVT);
  }

  /**
   * Verify that the endpoint is valid and signed by the account that initiated
   * the request.
   * TODO: ecrecover giving issues sometimes
   *
   * @param requestId   Id of the search request
   * @param h           Data for the endpoint's signed data [hash, r, s]
   * @param v           The "v" value of the endpoint signaure
   */
  function _verifyEndpoint(bytes32 requestId, bytes32 endpointId, bytes32[3] h, uint8 v)
    internal
    view
  {
    // testrpc and parity adds prefix when signing
    // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(prefix, h[0]);

    address signer = ecrecover(prefixedHash, v, h[1], h[2]);
    require(signer == searchRequests[requestId].owner);

    /* TODO: verify the endpointID is the same too */
  }
}
