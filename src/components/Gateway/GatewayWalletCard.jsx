import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {Grid, Row, Col } from 'react-bootstrap';
import Button from 'elements/CustomButton/CustomButton.jsx';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { ScaleLoader } from 'react-spinners';
import Async from 'react-promise'

import moize from 'moize'
class GatewayWalletCard extends Component {

    constructor(props) {
      super(props);
      this.getUVTBalance = this.getUVTBalance.bind(this);

      this.getInputSellAmount = this.getInputSellAmount.bind(this);
      this.getInputSendAddress = this.getInputSendAddress.bind(this);
      this.getInputSendAmount = this.getInputSendAmount.bind(this);

      this.addNotification = this.addNotification.bind(this);
      this.listenForPayouts = this.listenForPayouts.bind(this);

      this.sellTokens = this.sellTokens.bind(this);
      this.sendTokens = this.sendTokens.bind(this);

      this.state = {
        _isSelling: false,
        balance: null
      };

      //this.listenForPayouts();
    }

    getUVTBalance() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.props.uvtToken.balanceOf(_this.props.web3.eth.coinbase, {gasLimit: 21000})
        .then((res) => {
          var b = res.toNumber()
          _this.setState({ balance: b });
          resolve(b);
        })
        .catch((err) => {
          //console.log(err);
          console.log("error getting balance");
          reject(err);
        });
      });
    }

    sellTokens() {
      var amount = this.getInputSellAmount();
      if (amount != "") {
        this.setState({_isSelling: true});

        this.props.uvtToken.transfer(
          this.props.uvtCore.address,
          parseInt(amount),
          {from: this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          this.addNotification("Sold " + amount + " UVT for ETH", "success");
          ReactDOM.findDOMNode(this.inputSellAmount).value = "";
          this.setState({_isSelling: false, balance: null});
        })
        .catch((err) => {
          console.log(err);
          this.addNotification("Error selling tokens", "error");
        });
      }
    }

    sendTokens() {
      var amount = this.getInputSendAmount();
      var address = this.getInputSendAddress();
      if (amount != "" && address != "") {
        this.setState({_isSending: true});

        this.props.uvtToken.transfer(
          address,
          parseInt(amount),
          {from: this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          this.addNotification("Sent " + amount + " UVT to " + address.substring(0, 5) + "...", "success");
          ReactDOM.findDOMNode(this.inputSendAmount).value = "";
          ReactDOM.findDOMNode(this.inputSendAddress).value = "";
          this.setState({_isSending: false, balance: null});
        })
        .catch((err) => {
          console.log(err);
          this.setState({_isSending: false});
          this.addNotification("Error sending tokens", "error");
        });
      }
    }

    listenForPayouts() {
      var _this = this;
      this.props.uvtCore.PurchasedUVT({account: this.props.web3.eth.coinbase})
      .watch(function(error, event) {
        // trigger getting new balance
        _this.setState({ balance: null });
      });
    }

    getInputSellAmount() {
      return ReactDOM.findDOMNode(this.inputSellAmount).value;
    }

    getInputSendAmount() {
      return ReactDOM.findDOMNode(this.inputSendAmount).value;
    }

    getInputSendAddress() {
      return ReactDOM.findDOMNode(this.inputSendAddress).value;
    }

    addNotification(message, level = "success") {
      this.props.notifications.addNotification({
          title: (<span data-notify="icon" className="pe-7s-gift"></span>),
          message: (
              <div>
                  {message}
              </div>
          ),
          level: level,
          position: "tr",
          autoDismiss: 5,
      });
    }

    render() {
        var balanceInfo;
        if (this.state.balance != null) {
            balanceInfo = (
              <div className="numbers">
                  <p>Balance (UVT)</p>
                  {this.state.balance}
              </div>
            )
        } else {
          balanceInfo = (
            <Async
              promise={this.getUVTBalance()}
              then={(results) => {
                return (
                  <div className="numbers">
                      <p>Balance (UVT)</p>
                      {results}
                  </div>
                )
              }}
              catch={() => {
                return (
                  <div className="numbers">
                      <p>Balance (UVT)</p>
                      0
                  </div>
                )
              }}
            />
          )
        }

        return (
            <div className="content">
                <Grid fluid>
                    <Row>
                        <Col>
                          <div className="card card-stats">
                              <div className="content">
                                  <Row>
                                      <Col md={6}>
                                          <div style={{marginTop: "8px"}}>
                                              <Col xs={3}>
                                                  <div className="icon-big text-center icon-warning">
                                                      <i className="pe-7s-wallet text-info"></i>
                                                  </div>
                                              </Col>
                                              <Col xs={9}>
                                                  { balanceInfo }
                                              </Col>
                                          </div>
                                      </Col>
                                      <Col md={6}>
                                        <Row>
                                            <form>
                                                <Col md={8}>
                                                    <FormGroup>
                                                        <ControlLabel>Sell UVT Tokens</ControlLabel>
                                                        <FormControl
                                                          inputRef={node => {this.inputSellAmount = node;}}
                                                          type={"text"}
                                                          bsClass={"form-control"}
                                                          placeholder={"0"}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={4}>
                                                    <br/>
                                                    <Button
                                                        bsStyle="info"
                                                        disabled={this.state._isSelling}
                                                        onClick={() => this.sellTokens()}
                                                    >
                                                        { this.state._isSelling? <ScaleLoader
                                                            color={"#1DC7EA"}
                                                            loading={this.state._isSelling}
                                                            height={16}
                                                            width={1}
                                                        /> : "Sell" }
                                                    </Button>
                                                    <div className="clearfix"></div>
                                                </Col>
                                              </form>
                                          </Row>
                                          <Row>
                                            <form>
                                                <Col md={8}>
                                                    <FormGroup>
                                                        <ControlLabel>Send UVT Tokens</ControlLabel>

                                                          <FormControl
                                                            inputRef={node => {this.inputSendAmount = node;}}
                                                            type={"text"}
                                                            bsClass={"form-control"}
                                                            placeholder={"0"}
                                                          />

                                                          <br/>
                                                          <FormControl
                                                            inputRef={node => {this.inputSendAddress = node;}}
                                                            type={"text"}
                                                            bsClass={"form-control"}
                                                            placeholder={"TO ADDRESS: "}
                                                          />

                                                    </FormGroup>
                                                </Col>
                                                <Col md={4}>
                                                    <br/>
                                                    <Button
                                                        bsStyle="info"
                                                        disabled={this.state._isSending}
                                                        onClick={() => this.sendTokens()}
                                                    >
                                                        { this.state._isSending? <ScaleLoader
                                                            color={"#1DC7EA"}
                                                            loading={this.state._isSending}
                                                            height={16}
                                                            width={1}
                                                        /> : "Send" }
                                                    </Button>
                                                    <div className="clearfix"></div>
                                                </Col>
                                              </form>
                                          </Row>
                                      </Col>
                                  </Row>
                                  <div className="footer">
                                      <hr />
                                      <div className="stats">
                                          <i className="fa fa-refresh"></i> Updated just now
                                      </div>
                                  </div>
                              </div>
                          </div>
                        </Col>
                    </Row>

                </Grid>
            </div>
        );
    }
}

export default GatewayWalletCard;
