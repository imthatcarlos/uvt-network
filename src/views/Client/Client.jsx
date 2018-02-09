import React, { Component } from 'react';
import {
    Grid, Row, Column
} from 'react-cellblock';

import {Map, Marker, GoogleApiWrapper} from 'google-maps-react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import MapCard from 'components/MapCard/MapCard.jsx';
import WalletCard from 'components/WalletCard/WalletCard.jsx';

class Client extends Component{
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

    }

    componentDidMount() {

    }

    render() {
        return (
          <div className="content">
              <Grid fluid>
                  <Row>
                      <Column width="5/12">
                          <WalletCard uvtToken={this.state.uvtToken} />

                          <Card
                              title="Find gateways in your area"
                              category="View gateways within your city and zip code"
                              content={
                                <Row>
                                    <form>
                                        <Column width="2/3">
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
                                        </Column>
                                        <Column width="1/3">
                                            <br/>
                                            <Button style={{ marginTop: "8px"}}
                                                bsStyle="info"
                                                onClick={() => this.getGateways()}
                                            >
                                              Find Gateways
                                            </Button>
                                            <div className="clearfix"></div>
                                        </Column>
                                      </form>
                                  </Row>
                              }
                          />
                      </Column>
                      <Column width="7/12">
                          <MapCard searching={true} />
                      </Column>
                  </Row>
              </Grid>
          </div>
        );
    }

}

export default Client
