import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

import MyGateway from 'components/Gateway/MyGateway.jsx';
import Searches from 'components/Gateway/Searches.jsx';
import GatewayWalletCard from 'components/Gateway/GatewayWalletCard.jsx'

import { ScaleLoader } from 'react-spinners';
import Async from 'react-promise'
import moize from 'moize';

const ipObj = require("ip");

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyAwj2Pbd4SdxIFMUQOREZu8T2iAK87hvdI',
  Promise: Promise
});

class Gateway extends Component {
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);
      this.shareLocation = this.shareLocation.bind(this);
      this.registerDevice = this.registerDevice.bind(this);
      this.getAccountGateway = this.getAccountGateway.bind(this);

      this.state = {
        _hasSharedLocation: false,
        _isLoading: false,
        _isAdding: false,
        ip: ipObj.address(),
        lat: null,
        long: null,
        city: null,
        area: null
      };


    }

    componentDidMount() {

    }

    getAccountGateway() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.props.uvtCore.getMyGateway({from: _this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          if (res[0] === "") {
            reject(res);
          } else {
            var data = {
              id: _this.props.web3.toDecimal(res[0]),
              ip: res[1],
              lat: res[2],
              long: res[3],
              city: res[4],
              area: res[5],
              wirelessData: res[6]
            }
            resolve(data);
          }
        })
        .catch((err) => {
          console.log("no gateway found");
          reject(err); // they haven't registered device
        });
      });
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

            _this.setState({
              lat: position.coords.latitude,
              long: position.coords.longitude,
              city: locality[0]["long_name"],
              area: postalCode[0]["long_name"],
              _hasSharedLocation: true
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }

    registerDevice() {
      this.setState({_isAdding: true});

      this.props.uvtCore.addGateway(
        this.state.ip,
        this.state.lat.toString(),
        this.state.long.toString(),
        this.state.city,
        this.state.area,
        "",
        {from: this.props.web3.eth.coinbase, gas: 256000}
      ).then(function(txHash) {
        console.log('Tx:' + txHash);
      }).catch(function(error) {
        console.log(error);
      });
    }

    render() {
        // Some logic to determine whether the account has already registered a
        // gateway or not

        var locationInfo;
        if (this.state._hasSharedLocation) {
          locationInfo = (
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
          );
        }
        else {
          locationInfo = (
            <Row>
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
          );
        }

        return (
            <div className="content">
                <Grid fluid>
                    <Async
                        promise={this.getAccountGateway()}
                        then={(results) => {
                            return (
                              <Row>
                                  <Column width="6/12">
                                      <Row>
                                          <Column>
                                              <GatewayWalletCard
                                                  uvtToken={this.props.uvtToken}
                                                  uvtCore={this.props.uvtCore}
                                                  web3={this.props.web3}
                                                  notifications={this.props.notifications}
                                              />
                                          </Column>
                                      </Row>
                                      <Row>
                                          <Column>
                                              <MyGateway
                                                  address={this.props.web3.eth.coinbase}
                                                  data={results}
                                              />
                                          </Column>
                                      </Row>
                                  </Column>
                                  <Column width="6/12">
                                      <Searches gatewayId={results.id} uvtCore={this.props.uvtCore} />
                                  </Column>
                              </Row>
                            )
                        }}
                        catch={() => { // means they haven't registered a gateway with this account
                          return (
                              <Row>
                                  <Column width="6/12">
                                      <Card
                                          title="Register Device As Gateway"
                                          category="Register your device to be part of the UVT network and earn UVT tokens"
                                          content={
                                              <form>
                                                  <FormInputs
                                                      ncols = {["col-md-12"]}
                                                      proprieties = {[
                                                          {
                                                           label : "Metamask Account",
                                                           type : "text",
                                                           bsClass : "form-control",
                                                           placeholder : "-- UNLOCK YOUR METAMASK ACCOUNT AND REFRESH--",
                                                           defaultValue : this.props.web3.eth.coinbase,
                                                           disabled : true
                                                          }
                                                      ]}
                                                  />
                                                  <FormInputs
                                                      ncols = {["col-md-6" , "col-md-6"]}
                                                      proprieties = {[
                                                          {
                                                           label : "IP Address",
                                                           type : "text",
                                                           bsClass : "form-control",
                                                           placeholder : "IP Address",
                                                           defaultValue : this.state.ip,
                                                           disabled: true
                                                          },
                                                          {
                                                             label : "Wireless Data",
                                                             type : "text",
                                                             bsClass : "form-control",
                                                             placeholder : "",
                                                             disabled: true
                                                          }
                                                      ]}
                                                  />

                                                  { locationInfo }

                                                  <Button
                                                      bsStyle="info"
                                                      pullRight
                                                      onClick={() => this.registerDevice()}
                                                      disabled={this.props.web3.eth.coinbase === null || this.state.lat === null || this.state._isAdding}
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
                        }}
                    />
                </Grid>
            </div>
        );
    }
}

export default Gateway;
