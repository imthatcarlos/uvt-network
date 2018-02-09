import React, { Component } from 'react';
import { Grid, Row, Col, Table } from 'react-bootstrap';
import Card from 'components/Card/Card.jsx';

class Requests extends Component {
  constructor(props) {
    super(props);
    this.getAll = this.getAll.bind(this);
    this.listen = this.listen.bind(this);

    this.state = {
      gatewayId: props.gatewayId,
      uvtCore: props.uvtCore,
      invocations: []
    };
  }

  getAll() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      this.state.uvtCore.InvokeGateway({id: this.state.gatewayId}, {fromBlock: 0, toBlock: "latest"})
      .get(function(error, logs) {
        console.log(logs);
        // this.setState({
        //   invocations: logs
        // });
      });
    });
  }

  listen() {
    this.state.uvtCore.InvokeGateway({id: this.state.gatewayId}, {fromBlock: 0, toBlock: "latest"})
    .watch(function(error, event) {
      this.setState({

      })
    });
  }

  render() {
    return (
      <Card
          title="Searches"
          category="Network participants may invoke your device to initiate a search"
          content={
            <div>Hi</div>
          }
      />
    )
  }
}

export default Requests
