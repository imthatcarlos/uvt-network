import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';
import { Table, Col } from 'react-bootstrap';

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import Checkbox from 'elements/CustomCheckbox/CustomCheckbox.jsx';

import MapCard from 'components/Client/MapCard.jsx';
import WalletCard from 'components/Client/WalletCard.jsx';
import { ScaleLoader } from 'react-spinners';

class NewSearch extends Component {
  constructor(props) {
    super(props);

    this.getGateways = this.getGateways.bind(this);
    this.approveFee = this.approveFee.bind(this);
    this.createSearchRequest = this.createSearchRequest.bind(this);
    this.onGetBalance = this.onGetBalance.bind(this);

    this.state = {
      _isFetchingGateways: false,
      _isAppoving: false,
      endpointId: "0x61b3898bc853c561e2ea0fd4ea2801f795a733d0",
      balance: 0,
      gateways: [],
      shouldInvokeGateway: {},
      inputCity: "",
      inputZip: "",
      costUVT: 0
    };
  }

  onGetBalance(balance) {
    this.setState({balance: balance});
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  getGateways() {
    this.setState({_isFetchingGateways: true});
    var _this = this;
    this.props.deviceRegistry.getGatewaysInRange.call(this.state.inputCity, this.state.inputZip)
    .then((results) => {
      var ids = results.filter(id => id.toNumber() != 0);
      var promises = ids.map((id) => {
        if (id.toNumber() != 0) {
          return _this.props.deviceRegistry.getGatewayCoordinates.call(id.toNumber()).then((res) => {
            return [id.toNumber(), parseFloat(res[0]), parseFloat(res[1])];
          }).catch((error) => { console.log(error) });
        }
      });

      Promise.all(promises).then((results) => {
        if (results.length == 0) {
          _this.props.addNotification("No gateways found!", "warning");
        }
        _this.setState({
          gateways: results,
          _isFetchingGateways: false
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  gatewayChecked(event) {
    var currentCost = this.state.costUVT;
    var toInvoke = this.state.shouldInvokeGateway;
    toInvoke[event.target.id] = event.target.checked;

    event.target.checked? currentCost += 10 : currentCost -= 10;
    this.setState({
      costUVT: currentCost,
      shouldInvokeGateway: toInvoke
    });
  }

  approveFee() {
    if (this.state.balance < this.state.costUVT) {
      this.props.addNotification("Not enough funds, purchase some UVT");
      return;
    }

    var _this = this;
    var gasPrice = this.props.web3.toWei('0.000000005', 'ether'); // 5 wGwei
    this.setState({_isAppoving: true});

    // let's check if they have already approved a fee higher than this one
    this.props.uvtToken.allowance.call(
      this.props.web3.eth.coinbase,
      this.props.uvtCore.address,
      {from: this.props.web3.eth.coinbase}
    )
    .then((result) => {
      if (result.toNumber() >= this.state.costUVT) {
        _this.props.addNotification("Account already approved allowance of " + result.toNumber() + " UVT", "success");
        _this.createSearchRequest();
      } else {
        this.props.addNotification("Approving fee...", "warning");
        this.props.uvtToken.approve(
          this.props.uvtCore.address,
          this.state.costUVT,
          {from: this.props.web3.eth.coinbase, gasPrice: gasPrice}
        )
        .then((results) => {
          _this.props.addNotification("Fee approved!", "success");
          _this.createSearchRequest();
        })
        .catch((error) => {
          console.log(error);
          this.setState({_isAppoving: false});
        })
      }
    });
  }

  createSearchRequest() {
    var gasPrice = this.props.web3.toWei('0.000000005', 'ether'); // 5 wGwei
    var _this = this;
    var toInvoke = [];
    for (var id in this.state.shouldInvokeGateway) {
      if (this.state.shouldInvokeGateway[id]) {
        toInvoke.push(parseInt(id));
      }
    }

    this.props.addNotification("Submitting request...", "warning");
    this.props.uvtCore.createSearchRequest(
      _this.props.web3.toBigNumber(this.state.endpointId),
      toInvoke,
      {from: this.props.web3.eth.coinbase, gasPrice: gasPrice}
    )
    .then((results) => {
      _this.props.addNotification("Request successfully submitted!");
      _this.props.addNotification("Search now in progress...");
      this.props.onNewRequest();
    })
    .catch((error) => {
      console.log(error);
      this.setState({_isAppoving: false});
    })
  }

  render() {
    var gatewaysCard;
    if (this.state.gateways.length > 0) {

      var summary = <Grid fluid>
          <Row>
              <Col md={8}>
                  <div className="card-stats" style={{marginTop: "8px"}}>
                      <Col xs={3}>
                          <div className="icon-big text-center icon-warning">
                              <i className="pe-7s-wallet text-success"></i>
                          </div>
                      </Col>
                      <Col xs={9}>
                        <div className="numbers">
                            <p>Total Search Escrow</p>
                            { this.state.costUVT } UVT
                        </div>
                      </Col>
                  </div>
              </Col>
              <Col md={4}>
                  <Button style={{ marginTop: "14px"}}
                      bsStyle="info"
                      onClick={() => this.approveFee()}
                      disabled={this.state._isAppoving}
                  >
                      {
                        this.state._isAppoving? <ScaleLoader
                            color={"#1DC7EA"}
                            width={7}
                            height={16}
                            loading={this.state._isAppoving}
                        /> : "Approve Fee"
                      }
                  </Button>
                  <div className="clearfix"></div>
              </Col>
          </Row>
      </Grid>

      gatewaysCard = <Card
            title="Select the gateways to search for your item"
            subtitle="Each gateway selected will cost 10 UVT to invoke"
            content={
                <div className="content">
                    <Table striped hover>
                        <tbody>
                            {
                              this.state.gateways.map((data, idx) => {
                                return (
                                  <tr key={idx}>
                                      <td>
                                          <Checkbox
                                              number={data[0]}
                                              isChecked={false}
                                              onClick={this.gatewayChecked.bind(this)}
                                          />
                                      </td>
                                      <td>Gateway ID: {data[0]}</td>
                                      <td>1 mile radius</td>
                                      <td><i className="pe-7s-check"></i> IP Verified</td>
                                  </tr>
                                )
                              })
                            }
                        </tbody>
                    </Table>

                    <hr/>

                    { summary }
                </div>
            }
        />
    }

    return (
      <Grid fluid>
          <Row>
              <Column width="5/12">
                  <WalletCard
                    uvtToken={this.props.uvtToken}
                    uvtCore={this.props.uvtCore}
                    web3={this.props.web3}
                    notifications={this.props.notifications}
                    onGetBalance={this.onGetBalance}
                  />

                  <div className="content">
                      <Card
                          title="Lost your item? Let's start by finding available gateways in your area"
                          content={
                            <Row>
                                <form>
                                    <Column>
                                        <FormInputs
                                            ncols = {["col-md-12"]}
                                            proprieties = {[
                                                {
                                                  name: "endpointId",
                                                  label : "Item Endpoint ID",
                                                  type : "text",
                                                  bsClass : "form-control",
                                                  defaultValue: this.state.endpointId,
                                                  disabled: true
                                                }
                                            ]}
                                        />
                                    </Column>
                                    <Column width="2/3">
                                        <FormInputs
                                            ncols = {["col-md-6", "col-md-6"]}
                                            proprieties = {[
                                                {
                                                  name: "inputCity",
                                                  label : "City",
                                                  type : "text",
                                                  bsClass : "form-control",
                                                  onChange: this.handleChange.bind(this),
                                                  placeholder : "Enter your city"
                                                },
                                                {
                                                  name: "inputZip",
                                                  label : "Zip Code",
                                                  type : "number",
                                                  bsClass : "form-control",
                                                  onChange: this.handleChange.bind(this),
                                                  placeholder : "Enter your zip code",
                                                }
                                            ]}
                                        />
                                    </Column>
                                    <Column width="1/3">
                                        <br/>
                                        <Button style={{ marginTop: "8px"}}
                                            bsStyle="info"
                                            onClick={() => this.getGateways()}
                                            disabled={this.state.inputCity == "" || this.state.inputZip == ""}
                                        >
                                            {
                                              this.state._isFetchingGateways? <ScaleLoader
                                                  color={"#1DC7EA"}
                                                  width={7}
                                                  height={16}
                                                  loading={this.state._isFetchingGateways}
                                              /> : "Find Gateways"
                                            }
                                        </Button>
                                        <div className="clearfix"></div>
                                    </Column>
                                  </form>
                              </Row>
                          }
                      />

                      { gatewaysCard }
                  </div>

              </Column>
              <Column width="7/12">
                  <MapCard
                      searching={false}
                      gateways={this.state.gateways}
                      zip={this.state.zip}
                  />
              </Column>
          </Row>
      </Grid>
    )
  }
}

export default NewSearch
