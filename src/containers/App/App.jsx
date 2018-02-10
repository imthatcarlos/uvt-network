import React, { Component } from 'react';
import {
    Route,
    Switch,
    Redirect
} from 'react-router-dom';
import NotificationSystem from 'react-notification-system';

import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import Sidebar from 'components/Sidebar/Sidebar';

import {style} from "variables/Variables.jsx";

import appRoutes from 'routes/app.jsx';

import getContracts from 'utils/getContracts';

import Async from 'react-promise'
import { ScaleLoader } from 'react-spinners';

class App extends Component {
    constructor(props){
        super(props);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleNotificationClick = this.handleNotificationClick.bind(this);
        this.metamaskError = this.metamaskError.bind(this);
        this.state = {
            _notificationSystem: null
        };
    }
    handleNotificationClick(position){
        var color = Math.floor((Math.random() * 4) + 1);
        var level;
        switch (color) {
            case 1:
                level = 'success';
                break;
            case 2:
                level = 'warning';
                break;
            case 3:
                level = 'error';
                break;
            case 4:
                level = 'info';
                break;
            default:
                break;
        }
        this.state._notificationSystem.addNotification({
            title: (<span data-notify="icon" className="pe-7s-gift"></span>),
            message: (
                <div>
                    Welcome to <b>Light Bootstrap Dashboard</b> - a beautiful freebie for every web developer.
                </div>
            ),
            level: level,
            position: position,
            autoDismiss: 15,
        });
    }
    componentDidMount(){
        this.setState({_notificationSystem: this.refs.notificationSystem});
        {/*var _notificationSystem = this.refs.notificationSystem;
        var color = Math.floor((Math.random() * 4) + 1);
        var level;
        switch (color) {
            case 1:
                level = 'success';
                break;
            case 2:
                level = 'warning';
                break;
            case 3:
                level = 'error';
                break;
            case 4:
                level = 'info';
                break;
            default:
                break;
        }
        _notificationSystem.addNotification({
            title: (<span data-notify="icon" className="pe-7s-gift"></span>),
            message: (
                <div>
                    Welcome to <b>Light Bootstrap Dashboard</b> - a beautiful freebie for every web developer.
                </div>
            ),
            level: level,
            position: "tr",
            autoDismiss: 15,
        });*/}
    }
    metamaskError() {
      this.state._notificationSystem.addNotification({
          title: (<span data-notify="icon" className="pe-7s-gift"></span>),
          message: (
              <div>
                  Error connecting to Metamask and Ethereum Smart Contracts
              </div>
          ),
          level: 'error',
          position: "tr",
          autoDismiss: 10,
      });
    }
    componentDidUpdate(e){
        if(window.innerWidth < 993 && e.history.location.pathname !== e.location.pathname && document.documentElement.className.indexOf('nav-open') !== -1){
            document.documentElement.classList.toggle('nav-open');
        }
    }
    render() {
        return (

                <div className="wrapper">
                    <NotificationSystem ref="notificationSystem" style={style}/>
                    <Sidebar {...this.props} />
                    <div id="main-panel" className="main-panel">
                        <Header {...this.props}/>
                            <Async
                                promise={getContracts}
                                catch={(error) => {
                                  this.metamaskError();
                                  return<div>Error getting Metamask and contracts</div>
                                }}
                                pending={
                                    <div style={style}>
                                      <ScaleLoader
                                          color={'#000'}
                                          loading={true}
                                      />  Getting Metamask and contracts
                                    </div>}
                                then={(results) => {
                                return <Switch>
                                    {
                                        appRoutes.map((prop,key) => {
                                            if(prop.name === "Notifications")
                                                return (
                                                    <Route
                                                        path={prop.path}
                                                        key={key}
                                                        render={routeProps =>
                                                           <prop.component
                                                               {...routeProps}
                                                               handleClick={this.handleNotificationClick}
                                                           />}
                                                    />
                                                );
                                            if(prop.redirect)
                                                return (
                                                    <Redirect from={prop.path} to={prop.to} key={key}/>
                                                );
                                            return (

                                                <Route path={prop.path} key={key} render={(routeProps) => (
                                                    <prop.component {...routeProps}
                                                        web3={results.web3}
                                                        uvtToken={results.uvtToken}
                                                        uvtCore={results.uvtCore}
                                                        notifications={this.refs.notificationSystem}
                                                    />
                                                )}/>
                                            );
                                        })
                                    }
                                </Switch>
                            }}
                            />
                        <Footer />
                    </div>
                </div>
        );
    }
}

export default App;
