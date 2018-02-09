import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import {Card} from 'components/Card/Card.jsx';

class Dashboard extends Component {
    render() {
        return (
            <div className="content">
                <Grid fluid>
                    <Row>
                        <Col lg={4} sm={6}>
                          <div className="card card-stats">
                              <div className="content">
                                  <Row>
                                      <Col xs={5}>
                                          <div className="icon-big text-center icon-warning">
                                              <i className="pe-7s-wallet text-success"></i>
                                          </div>
                                      </Col>
                                      <Col xs={7}>
                                          <div className="numbers">
                                              <p>UVT Balance</p>
                                              200
                                          </div>
                                      </Col>
                                  </Row>
                                  <div className="footer">
                                      <hr />
                                      <div className="stats">

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

export default Dashboard;
