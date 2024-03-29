pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title OpenDeviceRegistry
 * @author Carlos Beltran <imthatcarlos@gmail.com>
 *
 * @dev The ODR consists of a registry of gateways with IP addresses, latitude
 * /longitude coordinates, technical specifications like wireless technology,
 * and other data about the gateway that can assist a software client in
 * routing a request efficiently.
 * NOTE: gateway ids are zero-based, so we should create a dummy gateway on
 * contract initialization
 */
contract OpenDeviceRegistry is Ownable {

  //============================================================================
  // EVENTS
  //============================================================================

  event GatewayAdded(uint id, address by);
  event GatewayRemoved(string ip, address by);

  //============================================================================
  // STORAGE
  //============================================================================

  struct Gateway {
    address owner;
    string ip;
    string lat;
    string long;
    string city;
    string area;
    uint areaIndex;
    string physicalAddressAndNumber;
  }

  struct InvokableGateway {
    uint id;
    string lat;
    string long;
  }

  /* *
   * NOTE: Valid city and area values need to be tracked as well, not doing
   * so for the demo.
   */
  Gateway[] gateways;
  mapping (address => uint) ownerToGatewayIds;
  mapping (string => mapping(string => uint[])) cityToAreaToGatewayIds;

  //============================================================================
  // MODIFIERS
  //============================================================================

  modifier validGateway(uint id) {
    require(gateways[id].owner != address(0));
    _;
  }

  modifier onlyGatewayOwner {
    require(gateways[ownerToGatewayIds[msg.sender]].owner == msg.sender);
    _;
  }

  //============================================================================
  // PUBLIC FUNCTIONS
  //============================================================================

  /**
   * Returns the gateway owner's address
   *
   * @param id the gateway id
   */
  function getGatewayOwner(uint id)
    public
    view
    returns (address)
  {
    return gateways[id].owner;
  }

  /**
   * Returns the gateway id
   *
   * @param sender The address of the account
   */
  function getGatewayIdFromOwner(address sender)
    public
    view
    returns (uint)
  {
    return ownerToGatewayIds[sender];
  }

  /**
   * Verify that the account owns a gateway
   *
   */
  function verifyGatewayOwner(address sender)
    public
    view
    returns (bool)
  {
    return gateways[ownerToGatewayIds[sender]].owner == sender;
  }

  //============================================================================
  // EXTERNAL FUNCTIONS
  //============================================================================

  /**
   * Gateway is added to the registry, with the public address of the
   * sender being its 'owner' - an address that is payable
   *
   * @param ip           The IP address of the gateway
   * @param lat          The geo latitude of the gateway (at register time)
   * @param long         The geo longitude of the gateway (at register time)
   * @param city         The geo city of the gateway
   * @param area         The geo area of the gateway NOTE: This could be
                         postal code if following Google Maps API, otherwise
   *                     some other local geo filter.
   * @param physicalAddressAndNumber Concatenated address and phone number,
                                     delimited by '+'
   */
  function addGateway(
      string ip,
      string lat,
      string long,
      string city,
      string area,
      string physicalAddressAndNumber
  )
    external
  {
    // sanity checks
    require(ownerToGatewayIds[msg.sender] == 0);
    require(bytes(ip).length != 0);
    require(bytes(lat).length != 0);
    require(bytes(long).length != 0);

    Gateway memory newGateway = Gateway({
      owner: msg.sender,
      ip: ip,
      lat: lat,
      long: long,
      city: city,
      area: area,
      physicalAddressAndNumber: physicalAddressAndNumber,
      areaIndex: 0
    });

    // add to storage and lookup tables
    uint id = gateways.push(newGateway) - 1;
    ownerToGatewayIds[msg.sender] = id;
    gateways[id].areaIndex = cityToAreaToGatewayIds[city][area].push(id) - 1;

    GatewayAdded(id, msg.sender);
  }

  /**
   * Gateway is removed from the registry
   *
   * @param id The id of the gateway to be removed
   */
  function removeGateway(uint id) external {
    require(gateways[id].owner == msg.sender);

    Gateway memory gateway = gateways[id];

    string memory ip = gateway.ip;

    // delete from storage and lookup tables
    delete cityToAreaToGatewayIds[gateway.city][gateway.area][gateway.areaIndex];
    delete gateways[id];
    delete ownerToGatewayIds[msg.sender];

    GatewayRemoved(ip, msg.sender);
  }

  /**
   * Returns a STATIC array of gateway ids within the city and area specified
   * NOTE: Solidity does not allow using .push() on non-storage arrays
   * http://solidity.readthedocs.io/en/develop/types.html#members
   * NOTE: Can't return structs, so returning ids for now
   *
   * @param city The city the user wants gateways for
   * @param area The area the user wants gateways for
   */
  function getGatewaysInRange(string city, string area)
    external
    view
    returns (uint[20])
  {
    uint[] memory ids = cityToAreaToGatewayIds[city][area];
    uint[20] memory data;

    for(uint i = 0; i < ids.length; i++) {
      /* TODO: need truffle to allow solidity@0.4.19 */
      /* data[i] = InvokableGateway({
        id: cityToAreaToGatewayIds[city][area][i],
        lat: gateways[cityToAreaToGatewayIds[city][area][i]].lat,
        long: gateways[cityToAreaToGatewayIds[city][area][i]].long
      }); */
      data[i] = ids[i];
    }

    return data;
  }

  /**
   * Returns geo location for a gateway
   *
   * @param id The gateway id
   */
  function getGatewayCoordinates(uint id)
    external
    view
    validGateway(id)
    returns (string lat, string long)
  {
    lat = gateways[id].lat;
    long = gateways[id].long;
  }

  //============================================================================
  // PERMISSIONED FUNCTIONS
  //============================================================================

  /**
   * Returns the account's gateway id
   *
   */
  function getMyGatewayId() external view returns (uint) {
    uint id = ownerToGatewayIds[msg.sender];
    require(gateways[id].owner == msg.sender); // make sure it's not nil
    return id;
  }

  /**
   * Returns the account's gateway information
   *
   */
  function getMyGateway()
    external
    view
    onlyGatewayOwner
    returns (
      uint id,
      string ip,
      string lat,
      string long,
      string city,
      string area,
      string physicalAddressAndNumber
    )
  {
    Gateway memory gateway = gateways[ownerToGatewayIds[msg.sender]];

    id = ownerToGatewayIds[msg.sender];
    ip = gateway.ip;
    lat = gateway.lat;
    long = gateway.long;
    city = gateway.city;
    area = gateway.area;
    physicalAddressAndNumber = gateway.physicalAddressAndNumber;
  }

  /**
   * Returns all information for one gateway
   * Can only be called by the contract owner
   *
   * @param id The gateway id
   */
  function getGateway(uint id)
    external
    view
    onlyOwner
    validGateway(id)
    returns (
      address owner,
      string ip,
      string lat,
      string long,
      string city,
      string area,
      string physicalAddressAndNumber
    )
  {
    Gateway memory gateway = gateways[id];

    owner = gateway.owner;
    ip = gateway.ip;
    lat = gateway.lat;
    long = gateway.long;
    city = gateway.city;
    area = gateway.area;
    physicalAddressAndNumber = gateway.physicalAddressAndNumber;
  }

  /**
   * Returns the number of gateways in storage
   * Can only be called by the contract owner
   */
  function getGatewaysCount()
    external
    view
    onlyOwner
    returns (uint)
  {
    return gateways.length;
  }

  function destroy() external onlyOwner {
    selfdestruct(owner);
  }
}
