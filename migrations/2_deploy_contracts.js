var UVTToken = artifacts.require("./UVTToken");
var UVTCore  = artifacts.require("./UVTCore");

var fs = require("fs");
var path = require("path");

module.exports = function(deployer) {
  var filePath = path.join(__dirname, "../json/addresses.json");
  var data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  var networkIdx = process.argv.indexOf("network");
  var network = networkIdx != -1 ? process.argv[networkIdx + 1] : "development"

  deployer.deploy(UVTToken).then(function() {
    deployer.deploy(UVTCore, UVTToken.address).then(function() {

      data["contracts"][network]["UVTToken"] = UVTToken.address;
      data["contracts"][network]["UVTCore"] = UVTCore.address;

      var json = JSON.stringify(data);
      fs.writeFileSync(filePath, json, "utf8");
    })
  })
};
