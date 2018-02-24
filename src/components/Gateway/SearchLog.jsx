import React, { Component } from 'react';
import { Table } from 'react-bootstrap';
import Card from 'components/Card/Card.jsx';
import Button from 'elements/CustomButton/CustomButton.jsx';
import { ScaleLoader } from 'react-spinners';

const dateFormat = require('dateformat');

const SEARCH_STATES = [
  "Searching",
  "Found",
  "Cancelled",
  "Expired"
]

class SearchLog extends Component {
  constructor(props) {
    super(props);
    this.watchForInvocations = this.watchForInvocations.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.componentWillMount = this.componentWillMount.bind(this);
    this.endpointFound = this.endpointFound.bind(this);
    this.getOwnerSignedData = this.getOwnerSignedData.bind(this);

    this.state = {
      requests: {},
      _isFound: false
    };
  }

  componentWillMount() {
    this.watchForInvocations();
  }

  componentWillUnmount() {
    this.props.uvtCore.InvokeGateway().stopWatching();
  }

 // NOTE: for demo purposes, we won't check the gateway id of the finder,
 // just assume it was us since we are simulating the search process
  watchForInvocations() {
    var _this = this;
    var gasPrice = this.props.web3.toWei('0.000000005', 'ether'); // 5 wGwei
    this.props.uvtCore.InvokeGateway({id: this.props.gatewayId}, {fromBlock: 0, toBlock: "latest"})
    .watch(function(error, event) {
      // get request status
      console.log(event.args.requestId);
      _this.props.uvtCore.getSearchRequestById.call(
        event.args.requestId,
        {from: _this.props.web3.eth.coinbase, gasPrice: gasPrice}
      )
      .then((results) => {
        console.log(results);
        var status = SEARCH_STATES[_this.props.web3.toDecimal(results[4])];
        var expires = _this.props.web3.toDecimal(results[5]) * 1000;

        var payout;
        if (status === "Searching" || status === "Cancelled") {
          payout = 0;
        } else if (status === "Found") {
          payout = 14;
        } else if (status === "Expired") {
          payout = 10;
        }

        var requests = _this.state.requests;
        requests[event.args.requestId] = {
          endpointId: event.args.endpointId,
          result: status.toUpperCase(),
          payout: payout,
          date: dateFormat(new Date(expires), "ddd, mmmm dS h:MMtt")
        };

        _this.setState({requests: requests});
      });
    })
  }

  getOwnerSignedData(endpointId) {
    // var account = this.props.web3.eth.coinbase;
    // var endpointSecret = 'secret'; // stored locally on the item
    //
    // var messageHash = this.props.web3.sha3(endpointId, endpointSecret);
    // this.props.web3.eth.sign(account, messageHash, function(error, result) {
    //   var sig = result.slice(2);
    //   var r = '0x' + sig.slice(0, 64);
    //   var s = '0x' + sig.slice(64, 128);
    //   var v = this.props.web3.toDecimal('0x' + sig.slice(128, 130)) + 27;
    //
    //   var sigData = [messageHash, r, s, v];
    // });
  }

  endpointFound(requestId, endpointId) {
    var foundLat = this.props.gatewayLat;
    var foundLong = this.props.gatewayLong;
    var gasPrice = this.props.web3.toWei('0.000000005', 'ether'); // 5 wGwei
    var _this = this;

    var account = this.props.web3.eth.coinbase;
    var endpointSecret = 'secret'; // stored locally on the item

    this.setState({_isFound: true});

    this.props.addNotification("Signing endpoint data on behalf of item owner", "info");
    var messageHash = this.props.web3.sha3(endpointId, endpointSecret);
    this.props.web3.eth.sign(account, messageHash, function(error, result) {
      var sig = result.slice(2);
      var r = '0x' + sig.slice(0, 64);
      var s = '0x' + sig.slice(64, 128);
      var v = _this.props.web3.toDecimal('0x' + sig.slice(128, 130)) + 27;
      var sigData = [messageHash, r, s, v];

      _this.props.addNotification("Data signed", "success");
      _this.props.addNotification("Submitting transaction...", "warning");
      _this.props.uvtCore.endpointFound(
        requestId,
        [sigData[0], sigData[1], sigData[2]],
        sigData[3],
        foundLat.toString(),
        foundLong.toString(),
        {from: _this.props.web3.eth.coinbase, gas: 300000, gasPrice: gasPrice}
      )
      .then(() => {
        // so we can have for getPreviousRequest()
        _this.props.storeSearchRequestId(requestId);
        _this.props.addNotification("Simulated endpoint found - see UVT Client tab");
        _this.props.addNotification("Gateway received payment");
      })
      .catch((err) => {
        console.log(err);
        _this.props.addNotification("Error with endpointFound() - see console", "error");
      });
    });
  }

  render() {
    var searches = [];
    for (var key in this.state.requests) {
      var action;
      if (this.state.requests[key].result === "SEARCHING") {
        action = (

            <Button style={{ marginLeft: "15px"}}
                bsStyle="success"
                onClick={() => this.endpointFound(key, this.state.requests[key].endpointId)}
                disabled={this.state._isFound}
            > { this.state._isFound? <ScaleLoader
                color={"#049F0C"}
                loading={this.state._isFound}
                height={16}
                width={1}
            /> : "Found Item" }
            </Button>
        )
      } else {
        action = null;
      }

      searches.push(
        <tr key={key}>
            <td>{this.state.requests[key].date}</td>
            <td>{this.state.requests[key].result}</td>
            <td>{this.state.requests[key].payout} UVT { action }</td>
        </tr>
      )
    }

    return (
      <Card
          title="Search Log (this week)"
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
                  </table>
              </div>
            </div>
          }
      />
    )
  }
}

export default SearchLog
