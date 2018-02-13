import React, { Component } from 'react';
import { Table } from 'react-bootstrap';
import Card from 'components/Card/Card.jsx';

class SearchLog extends Component {
  constructor(props) {
    super(props);
    this.getAll = this.getAll.bind(this);
    this.listen = this.listen.bind(this);

    this.state = {
      events: [{endpointId: "c81c...", result: 'FOUND', payout: 10, date: "Mon, May 3rd 12:56pm"},{endpointId: "05f9...", result: 'FOUND', payout: 10, date: "Mon, May 3rd 2:14pm"},{endpointId: "e7cc...", result: 'NONE', payout: 0, date: "Mon, May 3rd 9:01pm"}]
    };
  }

  getAll() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      this.props.uvtCore.InvokeGateway({id: this.props.gatewayId}, {fromBlock: 0, toBlock: "latest"})
      .get(function(error, logs) {
        console.log(logs);
        // this.setState({
        //   events: logs
        // });
      });
    });
  }

  listen() {
    // this.props.uvtCore.InvokeGateway({id: this.props.gatewayId}, {fromBlock: 0, toBlock: "latest"})
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
          title="Search Log"
          category="Network participants may invoke your device to initiate a search"
          content={
            <div className="content">
              <div className="table-full-width">
                  <table className="table">
                      <thead>
                          <tr>
                              <th>Date</th>
                              <th>Result</th>
                              <th>Payment Received</th>
                          </tr>
                      </thead>
                      <tbody>
                          { searches }
                      </tbody>
                      {/* <Aysnc /> */}
                  </table>
              </div>
            </div>
          }
      />
    )
  }
}

export default SearchLog
