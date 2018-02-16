import React, { Component } from 'react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';
import Async from 'react-promise'

class MyGateway extends Component {
  constructor(props) {
    super(props);
    var data = props.data.addressAndPhone.split("/");
    var streetAddress = data[0].split("+").join(" ");
    var addressLine2 = data[1].split("+").join(" ");

    this.state = {
      address: props.address,
      ip: props.data.ip,
      lat: props.data.lat,
      long: props.data.long,
      city: props.data.city,
      area: props.data.area,
      streetAddress: streetAddress,
      addressLine2: addressLine2,
      phoneNumber: data[2]
    };
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
                                   defaultValue : this.state.address,
                                   disabled : true
                                 },
                                 {
                                  label : "IP Address",
                                  type : "text",
                                  bsClass : "form-control",
                                  placeholder : "IP Address",
                                  defaultValue : this.state.ip,
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
                                     defaultValue: this.state.lat,
                                     disabled: true
                                  },
                                  {
                                     label : "Longitude",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.long,
                                     disabled: true
                                  },
                                  {
                                     label : "City",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.city,
                                     disabled: true
                                  },
                                  {
                                     label : "Area",
                                     type : "text",
                                     bsClass : "form-control",
                                     defaultValue: this.state.area,
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
                  </div>
              }
          />
      </div>
    )
  }
}

export default MyGateway
