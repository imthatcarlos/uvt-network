import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';

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

      this.state = {
        gatewayData: []
      };
    }

    onGatewayAdded() {
      this.setState({gatewayData: []});
    }

    getAccountGateway() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.props.uvtCore.getMyGateway({from: _this.props.web3.eth.coinbase, gasLimit: 21000})
        .then((res) => {
          console.log(res);
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
              addressAndPhone: res[6]
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
          autoDismiss: 5,
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
                                    />
                                </Column>
                            </Row>
                        </Column>
                        <Column width="6/12">
                            <SearchLog gatewayId={results.id} uvtCore={this.props.uvtCore} />
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
