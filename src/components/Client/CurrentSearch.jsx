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

    this.state = {
      _endpointFound: false,
      gateways: []
    }
  }

  expiresDateLocal() {
    var ts = this.props.data.expires;
    var date = new Date(ts * 1000);
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
          return _this.props.uvtCore.getGatewayCoordinates(id).then((res) => {
            return [id, parseFloat(res[0]), parseFloat(res[1])];
          }).catch((error) => { reject(error); console.log(error) });
        }
      });

      Promise.all(promises).then((results) => {
        resolve(results);
      });
    });
  }

  getRequestStatus() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.props.uvtCore.getSearchRequestStatus()
      .then((results) => {
        var state = _this.props.web3.toDecimal(results);
        resolve(SEARCH_STATES[state]);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  render() {
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
                                    promise={this.getRequestStatus()}
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
                                                    width={7}
                                                    height={16}
                                                    loading={this.state._isCanceling}
                                                /> : "Cancel"
                                              }
                                          </Button>
                                          break;
                                        case "Found":
                                        case "Cancelled":
                                        case "Expired":
                                          button = <Button style={{ marginTop: "16px"}}
                                              bsStyle="success"
                                              onClick={() => this.newRequest()}
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
                                      }
                                      return (
                                        <Row>
                                          <Col md={4}>
                                            <ControlLabel>Status</ControlLabel>
                                            <p style={{fontSize:"22px"}}>{results}</p>
                                          </Col>
                                          <Col md={5}>
                                            <ControlLabel>Expires</ControlLabel>
                                            <p style={{fontSize:"22px"}}>{this.expiresDateLocal()}</p>
                                          </Col>
                                          <Col md={3}>
                                            {button}
                                          </Col>
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
                  <Column width="7/12">
                      <Async
                        promise={this.getGateways()}
                        then={(results) => {
                          return (
                            <MapCard
                                searching={true}
                                gateways={results}
                                zip={""}
                            />
                          )
                        }}
                      />
                  </Column>
              </Row>
          </Grid>
      </div>
    )
  }
}

export default CurrentSearch
