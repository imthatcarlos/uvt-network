import React, { Component } from 'react';
import {
    Grid, Row, Col
} from 'react-bootstrap';

import {Map, Marker, GoogleApiWrapper} from 'google-maps-react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';

class Maps extends Component{
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);
      this.state = {
        web3: props.web3,
        uvtToken: props.uvtToken,
        uvtCore: props.uvtCore
      };
    }

    getGateways() {
      console.log("hi");
    }

    componentDidMount() {
      console.log(this.state);
    }

    render() {
        return (
          <div className="content">
              <Grid fluid>
                  <br/>
                  <Row>
                    <Col md={6}>
                      <Card
                          title="Select Gateways For Search"
                          category="Each gateway selected will cost 10 UVT"
                          content={
                            <div>
                              <Grid fluid>
                                <Row>
                                  <form>
                                      <FormInputs
                                          ncols = {["col-md-6", "col-md-6"]}
                                          proprieties = {[
                                              {
                                               label : "City",
                                               type : "text",
                                               bsClass : "form-control",
                                               placeholder : "Enter your city"
                                              },
                                              {
                                                 label : "Zip Code",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "Enter your zip code",
                                              }
                                          ]}
                                      />
                                      <Col md={8}/>
                                      <Col md={4}>
                                        <Button
                                            bsStyle="info"
                                            pullRight
                                            onClick={() => this.getGateways()}
                                        >
                                          Find Gateways
                                        </Button>
                                        <div className="clearfix"></div>
                                      </Col>
                                    </form>
                                  </Row>
                                </Grid>
                                <br/>
                              <div id="map">
                                  <Map
                                      style={{width: '100%', height: '90%', position: 'relative'}}
                                      google={this.props.google}
                                      initialCenter={{
                                        lat: 40.7484405,
                                        lng: -73.9856644
                                      }}
                                      zoom={13}
                                      clickableIcons={false}
                                  >
                                      <Marker onClick={this.onMarkerClick}
                                          name={'Current location'}
                                      />
                                  </Map>
                              </div>
                            </div>
                          }
                      />
                    </Col>
                  </Row>
              </Grid>
          </div>
        );
    }

}

export default GoogleApiWrapper({
    apiKey: "AIzaSyCM3XLIiyNG7QO_SAW_Di8GwfYS30-pS8s"
})(Maps)
