import React, { Component } from 'react';

import NewSearch from 'components/Client/NewSearch.jsx';
import CurrentSearch from 'components/Client/CurrentSearch.jsx';

import Async from 'react-promise';

class Client extends Component {
    constructor(props) {
      super(props);

      this.getCurrentRequest = this.getCurrentRequest.bind(this);
      this.onNewRequest = this.onNewRequest.bind(this);
      this.addNotification = this.addNotification.bind(this);
      this.listenForCancellations = this.listenForCancellations.bind(this);
      this.stopListeningForCancellations = this.stopListeningForCancellations.bind(this);

      this.state = {
        requestData: []
      }

      //this.listenForCancellations();
    }

    componentWillUnmount() {
      //this.stopListeningForCancellations();
    }

    getPreviousRequest() {
      var _this = this;
      var id = this.props.previousSearchRequestId;

      return new Promise(function(resolve, reject) {
        _this.props.uvtCore.getSearchRequestById(id, {from: _this.props.web3.eth.coinbase})
        .then((results) => {
          var ids = results[2].map((id) => { return _this.props.web3.toDecimal(id) });
          var data = {
            endpointId: results[1],
            invokedGatewayIds: ids,
            channelId: results[3],
            state: _this.props.web3.toDecimal(results[4]),
            expires: (_this.props.web3.toDecimal(results[5]) * 1000)
          };

          resolve(data);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
      });
    }

    getCurrentRequest() {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.props.uvtCore.getSearchRequest()
        .then((results) => {
          var ids = results[2].map((id) => { return _this.props.web3.toDecimal(id) });
          var data = {
            endpointId: results[1],
            invokedGatewayIds: ids,
            channelId: results[3],
            state: _this.props.web3.toDecimal(results[4]),
            expires: (_this.props.web3.toDecimal(results[5]) * 1000)
          };

          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
      });
    }

    onNewRequest() {
      // var _this = this;
      // this.props.uvtCore.getSearchRequestId({from: this.props.web3.eth.coinbase})
      // .then((id) => {
      //   _this.props.storeSearchRequestId(id);
      //   _this.setState({requestData:[]});
      // });
       this.setState({requestData:[]});
    }

    addNotification(message, level = "success") {
      this.props.notifications.addNotification({
          title: (<span data-notify="icon" className="pe-7s-bell"></span>),
          message: (
              <div>
                  {message}
              </div>
          ),
          level: level,
          position: "tr",
          autoDismiss: 10,
      });
    }

    listenForCancellations() {
      this.props.uvtCore.SearchCancelled({id: this.props.previousSearchRequestId})
      .watch(function(error, event) {
        console.log(event);
      });
    }

    stopListeningForCancellations() {
      this.props.uvtCore.SearchCancelled().stopWatching();
    }

    render() {
        var content;
        if (this.props.previousSearchRequestId !== null) {
          content = <Async
              promise={this.getPreviousRequest()}
              then={(results) => {
                return (
                  <CurrentSearch
                    {...this.props}
                    isPrevious={true} 
                    previousId={this.props.previousSearchRequestId}
                    data={results} addNotification={this.addNotification}
                  />
                )
              }}
              catch={(err) => {
                <div className="content">Error getting search request</div>
              }}
          />
        } else {
          content = <Async
              promise={this.getCurrentRequest()}
              then={(results) => {
                return (
                  <CurrentSearch {...this.props} isPrevious={false} data={results} addNotification={this.addNotification} />
                )
              }}
              catch={() => {
                return (
                  <NewSearch {...this.props} onNewRequest={this.onNewRequest} addNotification={this.addNotification}/>
                )
              }}
          />
        }


          return (
            <div className="content">
                {content}
            </div>
          );
    }

}

export default Client
