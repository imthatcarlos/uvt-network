var UVTToken  = artifacts.require("./UVTToken");
var UVTCore  = artifacts.require("./UVTCore");

module.exports = function(deployer) {
  deployer.deploy(UVTToken).then(function() {
    deployer.deploy(UVTCore, UVTToken.address);
  })
};
