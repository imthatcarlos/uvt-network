import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';
import { Table, Col, ControlLabel } from 'react-bootstrap';

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

import MapCard from 'components/Client/MapCard.jsx';
import WalletCard from 'components/Client/WalletCard.jsx';

import Async from 'react-promise';
import { ScaleLoader } from 'react-spinners';

const SEARCH_STATES = [
  "Searching",
  "Found",
  "Cancelled",
  "Expired"
]

class CurrentSearch extends Component {
  constructor(props) {
    super(props);
    this.onGetBalance = this.onGetBalance.bind(this);
    this.expiresDateLocal = this.expiresDateLocal.bind(this);
    this.getSearchStatus = this.getSearchStatus.bind(this);
    this.getGateways = this.getGateways.bind(this);
    this.cancelSearch = this.cancelSearch.bind(this);
    this.newSearch = this.newSearch.bind(this);
    this.searchExpired = this.searchExpired.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.watchForEndpointFound = this.watchForEndpointFound.bind(this);

    this.state = {
      _endpointFound: false,
      _isCanceling: false,
      gateways: []
    }

    // need to do here sine stopWatching() doesn't work
    // and we can't setState on unmounted components
    if (this.props.isPrevious) {
      if (SEARCH_STATES[this.props.data.state] === "Found") {
        this.watchForEndpointFound();
      }
    }
  }

  componentWillUnmount() {
    this.props.uvtCore.SearchEndpointFound().stopWatching();
  }

  expiresDateLocal() {
    var date = new Date(this.props.data.expires);
    return date.toLocaleString("en-US", {hour12: true });
  }

  onGetBalance(balance) {
    //this.setState({balance: balance});
  }

  getGateways() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      var promises = _this.props.data.invokedGatewayIds.map((id) => {
        if (id != 0) {
          return _this.props.deviceRegistry.getGatewayCoordinates.call(
            id,
            {from: _this.props.web3.eth.coinbase}
          )
          .then((res) => {
            return [id, parseFloat(res[0]), parseFloat(res[1])];
          }).catch((error) => { reject(error); console.log(error) });
        }
      });

      Promise.all(promises).then((results) => {
        resolve(results);
      });
    });
  }

  getSearchStatus() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      if (!_this.props.isPrevious) {
        _this.props.uvtCore.getSearchRequestStatus({from: _this.props.web3.eth.coinbase})
        .then((results) => {
          var state = SEARCH_STATES[_this.props.web3.toDecimal(results)];

          if (state === "Expired") {
            _this.searchExpired();
          }

          resolve(state);
        })
        .catch((err) => {
          reject(err);
        });
      } else {
        var state = SEARCH_STATES[_this.props.data.state];
        resolve(state);
      }
    });
  }

  cancelSearch() {
    var _this = this;
    this.props.uvtCore.getSearchRequestId({from: this.props.web3.eth.coinbase})
    .then((id) => {
      _this.props.addNotification("Cancelling search request...", "warning");
      _this.setState({_isCanceling: true});
      _this.props.uvtCore.cancelSearch(id, {from: this.props.web3.eth.coinbase, gas: 300000})
      .then(() => {
        _this.props.storeSearchRequestId(id);
        _this.props.addNotification("Search request cancelled", "success");
      })
      .catch((err) => {
        console.log(err);
      });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  // TODO: since we're relying on props.previousSearchRequestId, this will be
  // called every time we fetch the status. The smart contracts protects against
  // this by requiring the search request to be active for searchExpired() to
  // execute
  searchExpired() {
    var _this = this;
    this.props.uvtCore.getSearchRequestId({from: this.props.web3.eth.coinbase})
    .then((id) => {
      _this.props.addNotification("Search request has expired...", "warning");
      _this.props.uvtCore.searchExpired(id, {from: this.props.web3.eth.coinbase, gas: 300000})
      .then(() => {
        _this.props.addNotification("Gateways have received payment", "warning");
      })
      .catch((err) => {
        console.log(err);
      });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  newSearch() {
    this.props.redisClient.set('gateways', null);
    this.props.storeSearchRequestId(null);
  }

  // NOTE: there's no mining on testrpc, so we always get all events, regardless
  // of the fromBlock param in SearchEndpointFound() we provide
  watchForEndpointFound() {
    var _this = this;
    this.props.uvtCore.SearchEndpointFound(
      {id: this.props.previousId},
      {fromBlock: 0, toBlock: "latest"}
    )
    .watch(function(error, event) {
      var ts = _this.props.web3.toDecimal(event.args.time);
      var date = new Date(ts * 1000);
      _this.setState({
        foundLat: event.args.lat,
        foundLong: event.args.long,
        foundDate: date.toLocaleString("en-US", {hour12: true })
      });
    });
  }

  render() {
    var mapInfo;
    if (SEARCH_STATES[this.props.data.state] === "Found") {
      mapInfo = (
        <Column width="7/12">
          <MapCard
              status={"Found"}
              foundLat={this.state.foundLat}
              foundLong={this.state.foundLong}
              gateways={[]}
              zip={""}
          />
        </Column>
      )
    } else {
      mapInfo = (
        <Column width="7/12">
            <Async
              promise={this.getGateways()}
              then={(results) => {
                return (
                  <MapCard
                      status={SEARCH_STATES[this.props.data.state]}
                      expires={this.props.data.expires}
                      gateways={results}
                      zip={""}
                  />
                )
              }}
            />
        </Column>
      )
    }

    return (
      <div className="content">
          <Grid fluid>
              <Row>
                  <Column width="5/12">
                      <WalletCard {...this.props}
                        onGetBalance={this.onGetBalance}
                      />

                      <Card
                          title="Search status"
                          content={
                              <div className="content">
                                  <Async
                                    promise={this.getSearchStatus()}
                                    then={(results) => {
                                      var button;
                                      switch (results) {
                                        case "Searching":
                                          button = <Button style={{ marginTop: "8px"}}
                                              bsStyle="danger"
                                              onClick={() => this.cancelSearch()}
                                              disabled={this.state._isCanceling}
                                          >
                                              {
                                                this.state._isCanceling? <ScaleLoader
                                                    color={"#FF4A55"}
                                                    height={16}
                                                    width={1}
                                                    loading={this.state._isCanceling}
                                                /> : "Cancel"
                                              }
                                          </Button>
                                          break;
                                        case "Expired":
                                        case "Cancelled":
                                          button = <Button style={{ marginTop: "16px"}}
                                              bsStyle="success"
                                              onClick={() => this.newSearch()}
                                          >
                                              {
                                                this.state._isCanceling? <ScaleLoader
                                                    color={"#FF4A55"}
                                                    width={7}
                                                    height={16}
                                                    loading={false}
                                                /> : "New Search"
                                              }
                                          </Button>
                                          break;
                                        case "Found":
                                          button = <Button style={{ marginTop: "16px"}}
                                              bsStyle="success"
                                              onClick={() => this.newSearch()}
                                          >New Search</Button>
                                          break;
                                      }
                                      var info;
                                      if (results == "Found") {
                                        info = (
                                          <div>
                                            <Col md={5}>
                                              <ControlLabel>Date Found</ControlLabel>
                                              <p style={{fontSize:"22px"}}>{this.state.foundDate}</p>
                                            </Col>
                                            <Col md={3}>
                                              <ControlLabel>Location</ControlLabel>
                                              <p style={{fontSize:"22px"}}>See Map</p>
                                              {button}
                                            </Col>
                                          </div>
                                        )
                                      } else {
                                        info = (
                                          <div>
                                            <Col md={5}>
                                              <ControlLabel>Expires</ControlLabel>
                                              <p style={{fontSize:"22px"}}>{this.expiresDateLocal()}</p>
                                            </Col>
                                            <Col md={3}>
                                              {button}
                                            </Col>
                                          </div>
                                        )
                                      }
                                      return (
                                        <Row>
                                          <Col md={4}>
                                            <ControlLabel>Status</ControlLabel>
                                            <p style={{fontSize:"22px"}}>{results}</p>
                                          </Col>
                                          {info}
                                        </Row>
                                      )
                                    }}
                                  />
                                  <Row>
                                    <FormInputs
                                        ncols = {["col-md-12"]}
                                        proprieties = {[
                                            {
                                              name: "endpointId",
                                              label : "Item Endpoint ID",
                                              type : "text",
                                              bsClass : "form-control",
                                              defaultValue: this.props.data.endpointId,
                                              disabled: true
                                            }
                                        ]}
                                    />
                                  </Row>
                                  <Row>
                                    <div className="">
                                      <ControlLabel>Invoked Gateways</ControlLabel>
                                      <Table striped hover>
                                          <tbody>
                                            {
                                              this.props.data.invokedGatewayIds.map((id, idx) => {
                                                return (
                                                  <tr key={idx}>
                                                      <td>Gateway ID: {id}</td>
                                                      <td>1 mile radius</td>
                                                      <td><i className="pe-7s-check"></i> IP Verified</td>
                                                  </tr>
                                                )
                                              })
                                            }
                                          </tbody>
                                      </Table>
                                    </div>
                                  </Row>
                              </div>
                          }
                      />
                  </Column>
                  { mapInfo }
              </Row>
          </Grid>
      </div>
    )
  }
}

export default CurrentSearch
