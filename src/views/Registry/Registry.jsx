import React, { Component } from 'react';
import { Grid, Row, Col, Table } from 'react-bootstrap';

import Card from 'components/Card/Card.jsx';
import {thArray, tdArray} from 'variables/Variables.jsx';

import Async from 'react-promise'
import { ScaleLoader } from 'react-spinners';

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
      return new Promise(function(resolve, reject) {
        _this.props.uvtCore.getGatewaysCount()
        .then((res) => {
          if (res.toNumber() == 0) { reject(res); }

          // TODO: account for when contracts's storage array has gaps
          var arr = [...Array(res.toNumber()).keys()].map((idx) => {
            return _this.props.uvtCore.getGateway(idx).then((res) => {
              return res;
            }).catch((error) => { console.log(error) });
          });

          console.log(arr);
          resolve(arr);
        })
        .catch((err) => {
          reject(err);
        });
      });
    }

    getGateways(promises) {
      return new Promise(function(resolve, reject) {
        Promise.all(promises).then((results) => {
          resolve(results);
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
                                                <th>Owner Address</th>
                                                <th>IP Address</th>
                                                <th>Latitude</th>
                                                <th>Longitude</th>
                                                <th>City</th>
                                                <th>Zip Code</th>
                                                <th>Wireless Data</th>
                                            </tr>
                                        </thead>

                                        <Async
                                          promise={this.preparePromises()}
                                          then={(promises) => {
                                            return (
                                              <Async
                                                promise={this.getGateways(promises)}
                                                then={(results) => {
                                                  return (
                                                    <tbody>
                                                      {
                                                        results.map((data, idx) => {
                                                          return (
                                                            <tr key={idx}>
                                                              <td>{idx}</td>
                                                              <td>{data[0]}</td>
                                                              <td>{data[1]}</td>
                                                              <td>{data[2]}</td>
                                                              <td>{data[3]}</td>
                                                              <td>{data[4]}</td>
                                                              <td>{data[5]}</td>
                                                              <td>{data[6]}</td>
                                                            </tr>
                                                          )
                                                        })
                                                      }
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
