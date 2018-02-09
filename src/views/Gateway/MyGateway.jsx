import React, { Component } from 'react';
import {Card} from 'components/Card/Card.jsx';
import {FormInputs} from 'components/FormInputs/FormInputs.jsx';

class MyGateway extends Component {
  constructor(props) {
    super(props);

    this.state = {
      address: props.address,
      ip: props.data.ip,
      lat: props.data.lat,
      long: props.data.long,
      city: props.data.city,
      area: props.data.area,
      wirelessData: props.data.wirelessData
    };
  }

  render() {
    return <Card
        title="My Gateway"
        category="Registed on the UVT Network"
        content={
            <form>
                <FormInputs
                    ncols = {["col-md-12"]}
                    proprieties = {[
                        {
                         label : "Owner Address",
                         type : "text",
                         bsClass : "form-control",
                         placeholder : "-- UNLOCK YOUR METAMASK ACCOUNT --",
                         defaultValue : this.state.address,
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
                         defaultValue : this.state.ip,
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
            </form>
        }
    />
  }
}

export default MyGateway
