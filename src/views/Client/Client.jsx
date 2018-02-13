import React, { Component } from 'react';

import NewSearch from 'components/Client/NewSearch.jsx';
import CurrentSearch from 'components/Client/CurrentSearch.jsx';

import Async from 'react-promise';

class Client extends Component {
    constructor(props) {
      super(props);

      this.getCurrentRequest = this.getCurrentRequest.bind(this);
      this.onNewRequest = this.onNewRequest.bind(this);

      this.state = {
        requestData: []
      }
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
            channelId: _this.props.web3.toDecimal(results[3]),
            state: _this.props.web3.toDecimal(results[4]),
            expires: _this.props.web3.toDecimal(results[5])
          };

          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
      });
    }

    onNewRequest() {
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
          autoDismiss: 5,
      });
    }

    render() {
        var content;
        if (this.state.requestData.length > 0) {
          content = <CurrentSearch {...this.props} data={this.state.requestData} />
        } else {
          content = <Async
              promise={this.getCurrentRequest()}
              then={(results) => {
                return (
                  <CurrentSearch {...this.props} data={results} addNotification={this.addNotification} />
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
