import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';
import {Table, Col} from 'react-bootstrap'

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

import NewGateway from 'components/Gateway/NewGateway.jsx';
import MyGateway from 'components/Gateway/MyGateway.jsx';
import SearchLog from 'components/Gateway/SearchLog.jsx';
import GatewayWalletCard from 'components/Gateway/GatewayWalletCard.jsx'

import Async from 'react-promise';

class Gateway extends Component {
    constructor(props) {
      super(props);

      this.getAccountGateway = this.getAccountGateway.bind(this);
      this.addNotification = this.addNotification.bind(this);
      this.onGatewayAdded = this.onGatewayAdded.bind(this);
      this.onGatewayRemoved = this.onGatewayRemoved.bind(this);

      this.state = {
        gatewayData: []
      };
    }

    onGatewayAdded() {
      this.setState({gatewayData: []});
    }

    onGatewayRemoved() {
      this.setState({gatewayData: []});
    }

    getAccountGateway() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.props.deviceRegistry.getMyGateway({from: _this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          if (res[0] === "") {
            reject(res);
          } else {
            var data = {
              id: _this.props.web3.toDecimal(res[0]),
              ip: res[1],
              lat: _this.props.web3.toDecimal(res[2]),
              long: _this.props.web3.toDecimal(res[3]),
              city: res[4],
              area: res[5],
              addressAndPhone: res[6]
            }
            resolve(data);
          }
        })
        .catch((err) => {
          reject(err); // they haven't registered this device
        });
      });
    }

    addNotification(message, level = "success") {
      this.props.notifications.addNotification({
          title: (<span data-notify="icon" className="pe-7s-bell"></span>),
          message: (
              <div>
                  {message}
              </div>
          ),
          level: level,
          position: "tr",
          autoDismiss: 10,
      });
    }

    render() {
        var content;
        if (this.state.gatewayData.length > 0) {
          content = <Row>
              <Column width="6/12">
                  <Row>
                      <Column>
                          <GatewayWalletCard {...this.props}/>
                      </Column>
                  </Row>
                  <Row>
                      <Column>
                          <MyGateway
                              address={this.props.web3.eth.coinbase}
                              data={this.state.gatewayData}
                          />
                      </Column>
                  </Row>
              </Column>
              <Column width="6/12">
                  <SearchLog {...this.props} />
              </Column>
          </Row>
        } else {
          content = <Async
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
                                        {...this.props}
                                        onGatewayRemoved={this.onGatewayRemoved}
                                        addNotification={this.addNotification}
                                    />
                                </Column>
                            </Row>
                        </Column>
                        <Column width="6/12">
                            <Row>
                                <Column width="6/12">
                                  <Card
                                      title="Gateway Status"
                                      category=""
                                      content={
                                          <div className="card-stats">
                                              <Row>
                                                  <Col xs={4}>
                                                      <div style={{marginTop: ""}}>
                                                          <div className="icon-big text-center icon-warning">
                                                              <i className="pe-7s-power text-success"></i>
                                                          </div>
                                                      </div>
                                                  </Col>
                                                  <Col xs={7}>
                                                      <div className="numbers">
                                                        Live
                                                        <p>Since 2/10</p>
                                                      </div>
                                                  </Col>
                                              </Row>
                                              <div className="space" style={{paddingBottom: "55px"}}></div>
                                              <div className="footer">
                                                  <hr />
                                                  <div className="stats">
                                                      <i className="pe-7s-refresh-cloud"></i>  Dynamic IP Updated: 5 days ago
                                                  </div>
                                              </div>
                                          </div>
                                      }
                                  />
                                </Column>
                                <Column width="6/12">
                                  <Card
                                      title="Earnings"
                                      category=""
                                      content={
                                          <Table hover>
                                            <tbody>
                                              <tr>
                                                <th>Week:</th>
                                                <td>20 UVT</td>
                                              </tr>
                                              <tr>
                                                <th>Month:</th>
                                                <td>140 UVT</td>
                                              </tr>
                                              <tr>
                                                <th>Year:</th>
                                                <td>510 UVT</td>
                                              </tr>
                                            </tbody>
                                          </Table>
                                      }
                                  />
                                </Column>
                            </Row>
                            <Row>
                              <Column width="12/12">
                                <SearchLog
                                  gatewayId={results.id}
                                  uvtCore={this.props.uvtCore}
                                  web3={this.props.web3}
                                  gatewayLat={results.lat}
                                  gatewayLong={results.long}
                                  addNotification={this.addNotification}
                                  storeSearchRequestId={this.props.storeSearchRequestId}
                                  redisClient={this.props.redisClient}
                                />
                              </Column>
                            </Row>
                        </Column>
                    </Row>
                  )
              }}
              catch={() => {
                return (
                  <NewGateway {...this.props} onGatewayAdded={this.onGatewayAdded} addNotification={this.addNotification}/>
                )
              }}
          />
        }

        return (
            <div className="content">
                <Grid fluid>
                    {content}
                </Grid>
            </div>
        );
    }
}

export default Gateway;
