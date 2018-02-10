import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
    Grid, Row, Column
} from 'react-cellblock';

import {Map, Marker, GoogleApiWrapper} from 'google-maps-react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import MapCard from 'components/MapCard/MapCard.jsx';
import WalletCard from 'components/WalletCard/WalletCard.jsx';
import { ScaleLoader } from 'react-spinners';
import moize from 'moize'

class Client extends Component{
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);
      this.getGateways = this.getGateways.bind(this);

      this.state = {
        _isFetchingGateways: false,
        inputCity: "",
        inputZip: ""
      };
    }

    getGateways() {

    }

    componentDidMount() {

    }

    handleChange(event) {
      this.setState({
        [event.target.name]: event.target.value
      })
    }

    render() {
        return (
          <div className="content">
              <Grid fluid>
                  <Row>
                      <Column width="5/12">
                          <WalletCard
                            uvtToken={this.props.uvtToken}
                            uvtCore={this.props.uvtCore}
                            web3={this.props.web3}
                            notifications={this.props.notifications}
                          />

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
                                                      name: "inputCity",
                                                      label : "City",
                                                      type : "text",
                                                      bsClass : "form-control",
                                                      onChange: this.handleChange.bind(this),
                                                      placeholder : "Enter your city"
                                                    },
                                                    {
                                                      name: "inputZip",
                                                      label : "Zip Code",
                                                      type : "number",
                                                      bsClass : "form-control",
                                                      onChange: this.handleChange.bind(this),
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
                                                disabled={this.state.inputCity == "" || this.state.inputZip == ""}
                                            >
                                                { this.state._isFetchingGateways? <ScaleLoader
                                                    color={"#1DC7EA"}
                                                    loading={this.state._isFetchingGateways}
                                                    height={16}
                                                    width={1}
                                                /> : "Find Gateways" }
                                            </Button>
                                            <div className="clearfix"></div>
                                        </Column>
                                      </form>
                                  </Row>
                              }
                          />
                      </Column>
                      <Column width="7/12">
                          <MapCard searching={false} />
                      </Column>
                  </Row>
              </Grid>
          </div>
        );
    }

}

export default Client
