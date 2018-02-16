import React, { Component } from 'react';
import {Map, Marker, InfoWindow, GoogleApiWrapper} from 'google-maps-react';
import {Card} from 'components/Card/Card.jsx';

class MapCard extends Component {
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);
      this.clickedMap = this.clickedMap.bind(this);
      this.clickedMarker = this.clickedMarker.bind(this);
      this.closedWindow = this.closedWindow.bind(this);
      this.hasSearchExpired = this.hasSearchExpired.bind(this);

      this.state = {
        _isShowingWindow: false,
        activeMarkerPosition: null,
        activeMarkerTitle: null
      }
    }

    componentDidMount() {

    }

    hasSearchExpired() {
      return this.props.expires < Date.now();
    }

    shouldComponentUpdate(nextProps, nextState) {
      return (
        this.props.gateways.length == 0 ||
        this.props.gateways !== nextProps.gateways ||
        this.props.status == "Searching" ||
        nextProps.foundLat != undefined ||
        this.props.zip != nextProps.zip ||
        nextState._isShowingWindow != this.state._isShowingWindow ||
        nextState.activeMarkerPosition != this.state.activeMarkerPosition
      )
    }

    clickedMarker(marker) {
      this.setState({
        _isShowingWindow: true,
        activeMarkerPosition: marker.position,
        activeMarkerTitle: marker.title
      });
    }

    clickedMap(event) {
      this.setState({
        _isShowingWindow: false,
        activeMarkerPosition: null,
        activeMarkerTitle: null
      });
    }

    closedWindow() {
      if(this.state._isShowingWindow) {
        this.setState({
          _isShowingWindow: false,
          activeMarkerPosition: null,
          activeMarkerTitle: null
        });
      }
    }

    render() {
        var title, subtitle;
        if (this.hasSearchExpired()) {
          title = "Search has expired - your item was not found";
          subtitle = "";
        } else if (this.props.status === "Searching") {
          title = "Search in progress...";
          subtitle = "You will be notified when your item is found";
        } else if (this.props.status === "Cancelled") {
          title = "Search was cancelled - your item was not found";
          subtitle = "";
        } else if (this.props.status === "Found") {
          title = "Item found! See marker location";
          subtitle = ""
        } else {
          title = "Select gateways for search";
          subtitle = "";
        }

        // Use the first gateway as the center of map
        var lat, long;
        if (this.props.gateways.length > 0) {
          lat = parseFloat(this.props.gateways[0][1]);
          long = parseFloat(this.props.gateways[0][2]);
        } else if (this.props.status === "Found" ) {
          lat = parseFloat(this.props.foundLat);
          long = parseFloat(this.props.foundLong);
        } else {
          lat = 37.5630556; // San Mateo, CA
          long = -122.3244444;
        }

        var map;
        if (this.props.status === "Found") {
          map = (
            <Map
                style={{width: '100%', height: '100%', position: 'relative'}}
                google={this.props.google}
                center={{
                  lat: lat,
                  lng: long
                }}
                zoom={15}
                clickableIcons={false}
                onClick={(event) => this.clickedMap(event)}
            >
                <Marker
                    key={Date.now() + "_" + 1}
                    position={{lat: lat, lng: long}}
                    title={"Item Location"}
                    name={"Item Location"}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    }}
                    onClick={(marker) => this.clickedMarker(marker)}
                />
                <InfoWindow
                    position={this.state.activeMarkerPosition}
                    onClose={(event) => this.closedWindow()}
                    visible={this.state._isShowingWindow}>
                    <div><h5>{this.state.activeMarkerTitle}</h5></div>
                </InfoWindow>
            </Map>
          )
        } else {
          map = (
            <Map
                style={{width: '100%', height: '100%', position: 'relative'}}
                google={this.props.google}
                center={{
                  lat: lat,
                  lng: long
                }}
                zoom={11}
                clickableIcons={false}
                onClick={(event) => this.clickedMap(event)}
            >
                {
                  this.props.gateways.map((gateway, idx) => {
                    return (
                      <Marker
                          key={Date.now() + "_" + idx}
                          position={{lat: gateway[1], lng: gateway[2]}}
                          title={"ID: " + gateway[0]}
                          name={gateway[0]}
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
                          }}
                          onClick={(marker) => this.clickedMarker(marker)}
                      />
                    )
                  })
                }
                <InfoWindow
                    position={this.state.activeMarkerPosition}
                    onClose={(event) => this.closedWindow()}
                    visible={this.state._isShowingWindow}>
                    <div><h5>{this.state.activeMarkerTitle}</h5></div>
                </InfoWindow>
            </Map>
          )
        }

        return (
              <Card
                  title={title}
                  category={subtitle}
                  content={
                    <div id="map">
                        { map }
                    </div>
                  }
              />
        );
    }

}

export default GoogleApiWrapper({
    apiKey: "AIzaSyCM3XLIiyNG7QO_SAW_Di8GwfYS30-pS8s"
})(MapCard)
