import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

import { ScaleLoader } from 'react-spinners';

const ipObj = require("ip");
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyAwj2Pbd4SdxIFMUQOREZu8T2iAK87hvdI',
  Promise: Promise
});

class NewGateway extends Component {
  constructor(props) {
    super(props);

    this.shareLocation = this.shareLocation.bind(this);
    this.registerDevice = this.registerDevice.bind(this);
    this.hasEmptyFields = this.hasEmptyFields.bind(this);

    this.state = {
      _hasSharedLocation: false,
      _isLoading: false,
      _isAdding: false,
      ip: ipObj.address(),
      lat: null,
      long: null,
      city: null,
      area: null,
      streetAddress: null,
      addressLine2: null,
      phoneNumber: null
    };
  }

  shareLocation() {
    this.setState({_isLoading: true});
    var _this = this;
    navigator.geolocation.getCurrentPosition(function(position) {
      var latlng = position.coords.latitude + "," + position.coords.longitude;
      googleMapsClient.reverseGeocode({latlng: latlng, result_type: "street_address"}).asPromise()
        .then((response) => {
          var locality = response.json.results[0]["address_components"]
            .filter(hash => hash["types"].includes("locality"));
          var postalCode = response.json.results[0]["address_components"]
            .filter(hash => hash["types"].includes("postal_code"));
          var state = response.json.results[0]["address_components"]
            .filter(hash => hash["types"].includes("administrative_area_level_1"));

          var addressLine2 = locality[0]["long_name"] + ", " + state[0]["short_name"] + " " + postalCode[0]["long_name"];
          _this.setState({
            lat: position.coords.latitude,
            long: position.coords.longitude,
            city: locality[0]["long_name"],
            area: postalCode[0]["long_name"],
            addressLine2: addressLine2,
            _hasSharedLocation: true
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  hasEmptyFields() {
    return (
      this.state.lat === null ||
      this.state.streetAddress === null ||
      this.state.phoneNumber === null
    );
  }

  registerDevice() {
    this.setState({_isAdding: true});
    var _this = this;
    var address = this.state.streetAddress.split(" ").join("+");
    var zip = this.state.addressLine2.split(" ").join("+");
    var addressAndPhone = address + "/" + zip + "/" + this.state.phoneNumber;

    this.props.deviceRegistry.addGateway(
      this.state.ip,
      this.state.lat.toString(),
      this.state.long.toString(),
      this.state.city,
      this.state.area,
      addressAndPhone,
      {from: this.props.web3.eth.coinbase, gas: 300000}
    ).then(function(txHash) {
      _this.props.addNotification("Device successfully registered!", "success");
      _this.props.onGatewayAdded();
      console.log('Tx:' + txHash);
    }).catch(function(error) {
      console.log(error);
    });
  }

  render() {
    var locationInfo;
    if (this.state._hasSharedLocation) {
      locationInfo = (
        <div>
            <FormInputs
                ncols = {["col-md-3","col-md-3","col-md-3","col-md-3"]}
                proprieties = {[
                    {
                       label : "Latitude",
                       type : "text",
                       bsClass : "form-control",
                       defaultValue: this.state.lat,
                       disabled: true
                    },
                    {
                       label : "Longitude",
                       type : "text",
                       bsClass : "form-control",
                       defaultValue: this.state.long,
                       disabled: true
                    },
                    {
                       label : "City",
                       type : "text",
                       bsClass : "form-control",
                       defaultValue: this.state.city,
                       disabled: true
                    },
                    {
                       label : "Area",
                       type : "text",
                       bsClass : "form-control",
                       defaultValue: this.state.area,
                       disabled: true
                    }
                ]}
            />

            <FormInputs
                ncols = {["col-md-5" , "col-md-4", "col-md-3"]}
                proprieties = {[
                    {
                       label : "Street Address",
                       name: "streetAddress",
                       type : "text",
                       bsClass : "form-control",
                       placeholder: "123 W YourStreet",
                       onChange: this.handleChange.bind(this)
                    },
                    {
                       label : "City, State Zip",
                       name: "addressLine2",
                       type : "text",
                       bsClass : "form-control",
                       defaultValue: this.state.addressLine2,
                       disabled: true
                    },
                    {
                       label : "Phone Number",
                       name: "phoneNumber",
                       type : "text",
                       bsClass : "form-control",
                       placeholder : "111-111-1111",
                       onChange: this.handleChange.bind(this)
                    }
                ]}
            />
        </div>
      );
    } else {
      locationInfo = <Row>
        <Column width="1/3" offset="1/3">
          <Button
              bsStyle="warning"
              onClick={() => this.shareLocation()}
              disabled={this.state._isLoading}
          >
              { this.state._isLoading? <ScaleLoader
                  color={"#FF9500"}
                  loading={this.state._isLoading}
                  height={15}
                  width={7}
              /> : "Share Location" }
          </Button>
          <div className="clearfix"></div>
          <br/>
        </Column>
      </Row>
    }

    return (
      <Row>
          <Column width="6/12">
              <Card
                  title="Register Device As Gateway"
                  category="Register your device to be part of the UVT network and earn UVT tokens"
                  content={
                      <form>
                          <FormInputs
                              ncols = {["col-md-8", "col-md-4"]}
                              proprieties = {[
                                {
                                   label : "Gateway Wallet Address",
                                   type : "text",
                                   bsClass : "form-control",
                                   placeholder : "-- UNLOCK YOUR METAMASK ACCOUNT AND REFRESH--",
                                   defaultValue : this.props.web3.eth.coinbase,
                                   disabled : true
                                 },
                                 {
                                   label : "IP Address",
                                   type : "text",
                                   bsClass : "form-control",
                                   placeholder : "IP Address",
                                   defaultValue : this.state.ip,
                                   disabled: true
                                 }
                              ]}
                          />

                          { locationInfo }

                          <Button
                              bsStyle="info"
                              pullRight
                              onClick={() => this.registerDevice()}
                              disabled={this.props.web3.eth.coinbase === null || this.state._isAdding || this.hasEmptyFields()}
                          >
                          { this.state._isAdding? <ScaleLoader
                              color={"#1DC7EA"}
                              loading={this.state._isAdding}
                              height={16}
                              width={7}
                          /> : "Register Device" }
                          </Button>
                          <div className="clearfix"></div>
                      </form>
                  }
              />
          </Column>
      </Row>
    )
  }
}
export default NewGateway
