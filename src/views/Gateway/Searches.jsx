import React, { Component } from 'react';
import { Table } from 'react-bootstrap';
import Card from 'components/Card/Card.jsx';

class Searches extends Component {
  constructor(props) {
    super(props);
    this.getAll = this.getAll.bind(this);
    this.listen = this.listen.bind(this);

    this.state = {
      gatewayId: props.gatewayId,
      uvtCore: props.uvtCore,
      events: [{endpointId: 123, result: 'FOUND', payout: 10, date: "Mon, May 3rd 12:56pm"},{endpointId: 123, result: 'FOUND', payout: 10, date: "Mon, May 3rd 12:56pm"},{endpointId: 123, result: 'FOUND', payout: 10, date: "Mon, May 3rd 12:56pm"}]
    };
  }

  getAll() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      this.state.uvtCore.InvokeGateway({id: this.state.gatewayId}, {fromBlock: 0, toBlock: "latest"})
      .get(function(error, logs) {
        console.log(logs);
        // this.setState({
        //   events: logs
        // });
      });
    });
  }

  listen() {
    // this.state.uvtCore.InvokeGateway({id: this.state.gatewayId}, {fromBlock: 0, toBlock: "latest"})
    // .watch(function(error, event) {
    //   this.setState({
    //
    //   })
    // });
  }

  render() {
    var searches = [];
    for (var i = 0; i < this.state.events.length; i++) {
      searches.push(
        <tr key={i}>
            <td>{this.state.events[i].date}</td>
            <td>{this.state.events[i].result}</td>
            <td>{this.state.events[i].payout} UVT</td>
        </tr>
      )
    }

    return (
      <Card
          title="Searches"
          category="Network participants may invoke your device to initiate a search"
          content={
            <div className="table-full-width">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Result</th>
                            <th>Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        { searches }
                    </tbody>
                    {/* <Aysnc /> */}
                </table>
            </div>
          }
      />
    )
  }
}

export default Searches
