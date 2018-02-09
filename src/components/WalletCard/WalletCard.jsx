import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

class WalletCard extends Component {

    constructor(props) {
      super(props);

      this.state = {
        uvtToken: props.uvtToken,
        _isBuying: false
      };
    }

    buyTokens() {

    }

    render() {
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
                                                      <i className="pe-7s-wallet text-success"></i>
                                                  </div>
                                              </Col>
                                              <Col xs={9}>
                                                  <div className="numbers">
                                                      <p>Balance (UVT)</p>
                                                      200
                                                  </div>
                                              </Col>
                                          </div>
                                      </Col>
                                      <Col md={6}>
                                          <form>
                                              <Col md={8}>
                                                  <FormGroup>
                                                      <ControlLabel>Buy UVT Tokens</ControlLabel>
                                                      <FormControl type={"text"} bsClass={"form-control"} placeholder={"0.00"} />
                                                  </FormGroup>
                                              </Col>
                                              <Col md={4}>
                                                  <br/>
                                                  <Button
                                                      bsStyle="info"
                                                      onClick={() => this.buyTokens()}
                                                  >
                                                    Buy
                                                  </Button>
                                                  <div className="clearfix"></div>
                                              </Col>
                                            </form>
                                      </Col>
                                  </Row>
                                  {/*<div className="footer">
                                      <hr />
                                      <div className="stats">

                                      </div>
                                  </div>*/}
                              </div>
                          </div>
                        </Col>
                    </Row>

                </Grid>
            </div>
        );
    }
}

export default WalletCard;
