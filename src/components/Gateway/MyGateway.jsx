import React, { Component } from 'react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import Async from 'react-promise'
import { ScaleLoader } from 'react-spinners';

class MyGateway extends Component {
  constructor(props) {
    super(props);
    var data = props.data.addressAndPhone.split("/");
    var streetAddress = data[0].split("+").join(" ");
    var addressLine2 = data[1].split("+").join(" ");

    this.state = {
      streetAddress: streetAddress,
      addressLine2: addressLine2,
      phoneNumber: data[2],
      _isDeleting: false
    };
  }

  deleteGateway() {
    var _this = this;
    this.props.addNotification("Submitting transaction...", "warning");
    this.setState({_isDeleting: true});
    this.props.deviceRegistry.removeGateway(
      this.props.data.id,
      {from: this.props.web3.eth.coinbase, gasLimit: 21000}
    )
    .then((result) => {
      _this.props.addNotification("Gateway removed", "success");
      _this.props.onGatewayRemoved();
    })
    .catch((err) => {
      console.log(err);
    });
  }

  render() {
    return (
      <div className="content">
          <Card
              title="Gateway Registration"
              category="Registed on the UVT Network"
              content={
                  <div>
                      <form>
                          <FormInputs
                              ncols = {["col-md-8", "col-md-4"]}
                              proprieties = {[
                                 {
                                   label : "Gateway Wallet Address",
                                   type : "text",
                                   bsClass : "form-control",
                                   defaultValue : this.props.address,
                                   disabled : true
                                 },
                                 {
                                  label : "IP Address",
                                  type : "text",
                                  bsClass : "form-control",
                                  placeholder : "IP Address",
                                  defaultValue : this.props.data.ip,
                                  disabled: true
                                 }
                              ]}
                          />

                          <FormInputs
                              ncols = {["col-md-3","col-md-3","col-md-3","col-md-3"]}
                              proprieties = {[
                                  {
                                     label : "Latitude",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.props.data.lat,
                                     disabled: true
                                  },
                                  {
                                     label : "Longitude",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.props.data.long,
                                     disabled: true
                                  },
                                  {
                                     label : "City",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.props.data.city,
                                     disabled: true
                                  },
                                  {
                                     label : "Area",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.props.data.area,
                                     disabled: true
                                  }
                              ]}
                          />

                          <FormInputs
                              ncols = {["col-md-5" , "col-md-4", "col-md-3"]}
                              proprieties = {[
                                  {
                                     label : "Street Address",
                                     name: "streetAddress",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.streetAddress,
                                     disabled: true
                                  },
                                  {
                                     label : "City, State Zip",
                                     name: "addressLine2",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.addressLine2,
                                     disabled: true
                                  },
                                  {
                                     label : "Phone Number",
                                     name: "phoneNumber",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.phoneNumber,
                                     disabled: true
                                  }
                              ]}
                          />
                      </form>
                      <Button style={{ marginTop: "8px"}}
                          bsStyle="danger"
                          onClick={() => this.deleteGateway()}
                          disabled={this.state._isDeleting}
                      >
                          {
                            this.state._isDeleting? <ScaleLoader
                                color={"#FF4A55"}
                                width={7}
                                height={16}
                                loading={this.state._isDeleting}
                            /> : "Delete My Gateway"
                          }
                      </Button>
                  </div>
              }
          />
      </div>
    )
  }
}

export default MyGateway
