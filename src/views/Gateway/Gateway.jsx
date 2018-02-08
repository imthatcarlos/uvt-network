import React, { Component } from 'react';
import {
    Grid, Row, Col
} from 'react-bootstrap';

import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

class Gateway extends Component {
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);

      this.state = {
        _hasSharedLocation: false,
        lat: null,
        long: null,
        city: null,
        area: null,
        web3: props.web3,
        uvtToken: props.uvtToken,
        uvtCore: props.uvtCore
      };
    }

    shareLocation() {
      navigator.geolocation.getCurrentPosition(function(position) {
        
      });
    }

    componentDidMount() {
      console.log(this.state);
    }

    render() {
        // Some logic to determine whether the account has already registered a
        // gateway or not

        var locationInfo;
        if (this.state._hasSharedLocation) {
          locationInfo = (
            <FormInputs
                ncols = {["col-md-3","col-md-3","col-md-3","col-md-3"]}
                proprieties = {[
                    {
                       label : "Latitude",
                       type : "text",
                       bsClass : "form-control",
                       placeholder : "",
                       disabled: true
                    },
                    {
                       label : "Longitude",
                       type : "text",
                       bsClass : "form-control",
                       placeholder : "",
                       disabled: true
                    },
                    {
                       label : "City",
                       type : "text",
                       bsClass : "form-control",
                       placeholder : "",
                       disabled: true
                    },
                    {
                       label : "Area",
                       type : "text",
                       bsClass : "form-control",
                       placeholder : "",
                       disabled: true
                    }
                ]}
            />
          );
        }
        else {
          locationInfo = (
            <Row>
              <Col md={5}></Col>
              <Col md={4}>
                <Button
                    bsStyle="warning"
                    onClick={() => this.shareLocation()}
                >
                    Share Location
                </Button>
                <div className="clearfix"></div>
                <br/>
              </Col>
            </Row>
          );
        }

        return (
            <div className="content">
                <Grid fluid>
                    <Row>
                        <Col md={8}>
                            <Card
                                title="Register Device As Gateway"
                                category="Register your device to be part of the UVT network and earn UVT tokens"
                                content={
                                    <form>
                                        <FormInputs
                                            ncols = {["col-md-12"]}
                                            proprieties = {[
                                                {
                                                 label : "Public Address (Metamask)",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "Address (Metamask)",
                                                 defaultValue : "0x46AC3404a54B3Eaf8d3EA687a87EaC3BBfb1bd40",
                                                 disabled : true
                                                }
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-md-6" , "col-md-6"]}
                                            proprieties = {[
                                                {
                                                 label : "IP Address",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "IP Address",
                                                 defaultValue : "127.0.0.1",
                                                 disabled: true
                                                },
                                                {
                                                   label : "Wireless Data",
                                                   type : "text",
                                                   bsClass : "form-control",
                                                   placeholder : "",
                                                   disabled: true
                                                }
                                            ]}
                                        />

                                        { locationInfo }

                                        <Button
                                            bsStyle="info"
                                            pullRight
                                            fill
                                            type="submit"
                                        >
                                            Register
                                        </Button>
                                        <div className="clearfix"></div>
                                    </form>
                                }
                            />
                        </Col>

                    </Row>
                </Grid>
            </div>
        );
    }
}

export default Gateway;
