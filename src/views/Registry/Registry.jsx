import React, { Component } from 'react';
import { Grid, Row, Col, Table } from 'react-bootstrap';

import Card from 'components/Card/Card.jsx';

import Async from 'react-promise'

class Registry extends Component {

    constructor(props) {
      super(props);
      this.getGateways = this.getGateways.bind(this);
      this.preparePromises = this.preparePromises.bind(this);

      this.state = {
        _isLoading: true
      };
    }

    preparePromises() {
      var _this = this;
      return new Promise(async function(resolve, reject) {
        // only the contract owner can see entries
        var owner = await _this.props.deviceRegistry.owner.call({from: _this.props.web3.eth.coinbase})
        if (owner != _this.props.web3.eth.coinbase) {
          reject("not owner");
        }

        _this.props.deviceRegistry.getGatewaysCount.call({from: _this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          if (res.toNumber() === 0) { resolve([]); }

          // NOTE: we account for when contracts's storage array has gaps
          // (getGateway returns bogus data)
          var arr = [...Array(res.toNumber()).keys()].map((idx) => {
            return _this.props.deviceRegistry.getGateway.call(idx,{from: _this.props.web3.eth.coinbase, gasLimit: 21000}).then((res) => {
              if (res[0] != "0x") {
                return res;
              }
            }).catch((error) => { console.log(error) });
          });
          resolve(arr);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
      });
    }

    getGateways(promises) {
      return new Promise(function(resolve, reject) {
        Promise.all(promises).then((results) => {
          resolve(results.filter(n => n));
        });
      });
    }

    render() {
        return (
            <div className="content">
                <Grid fluid>
                    <Row>
                        <Col md={12}>
                            <Card
                                title="Registered Gateways"
                                category="Only accounts with administrative access may view this information"
                                ctTableFullWidth ctTableResponsive
                                content={
                                    <Table striped hover>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Gateway Wallet Address</th>
                                                <th>IP Address</th>
                                                <th>Latitude</th>
                                                <th>Longitude</th>
                                                <th>Full Address</th>
                                                <th>Phone</th>
                                            </tr>
                                        </thead>

                                        <Async
                                          promise={this.preparePromises()}
                                          then={(promises) => {
                                            return (
                                              <Async
                                                promise={this.getGateways(promises)}
                                                then={(results) => {
                                                  var emptyLabel;
                                                  if (results.length === 0) {
                                                    emptyLabel = <tr>
                                                      <td colSpan="8">
                                                          No entries
                                                      </td>
                                                    </tr>
                                                  }
                                                  return (
                                                    <tbody>
                                                      {
                                                        results.map((data, idx) => {
                                                          var userData = data[6].split("/");
                                                          var streetAddress = (userData[0] + "+" + userData[1]).split("+").join(" ");
                                                          return (
                                                            <tr key={idx}>
                                                              <td>{idx}</td>
                                                              <td>{data[0]}</td>
                                                              <td>{data[1]}</td>
                                                              <td>{data[2]}</td>
                                                              <td>{data[3]}</td>
                                                              <td>{streetAddress}</td>
                                                              <td>{userData[2]}</td>
                                                            </tr>
                                                          )
                                                        })
                                                      }
                                                      {emptyLabel}
                                                    </tbody>
                                                  )
                                                }}
                                                pending={
                                                  <tbody>
                                                    <tr>
                                                      <td colSpan="8">
                                                          Fetching entries...
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                }
                                              />
                                            )
                                          }}
                                          catch={() => {
                                            return (
                                              <tbody>
                                                <tr style={{textAlign: "centered"}}>
                                                  <td colSpan="8">
                                                    You do not have access
                                                  </td>
                                                </tr>
                                              </tbody>
                                            )
                                          }}
                                        />

                                    </Table>
                                }
                            />
                        </Col>

                    </Row>
                </Grid>
            </div>
        );
    }
}

export default Registry;
