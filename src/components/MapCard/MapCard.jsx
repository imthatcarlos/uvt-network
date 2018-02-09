import React, { Component } from 'react';
import {Map, Marker, GoogleApiWrapper} from 'google-maps-react';
import {Card} from 'components/Card/Card.jsx';

class MapCard extends Component {
    constructor(props) {
      super(props);
      this.componentDidMount = this.componentDidMount.bind(this);

      this.state = {
        _searching: props.searching
      }

    }

    componentDidMount() {

    }

    render() {
        var title, subtitle;
        if (this.state._searching) {
          title = "Search in progress...";
          subtitle = "You will be notified when your item is found";
        } else {
          title = "Select gateways for search";
          subtitle = "Each gateway selected will cost 10 UVT to invoke";
        }

        return (
              <Card
                  title={title}
                  category={subtitle}
                  content={
                    <div id="map">
                        <Map
                            style={{width: '100%', height: '100%', position: 'relative'}}
                            google={this.props.google}
                            initialCenter={{
                              lat: 40.7484405,
                              lng: -73.9856644
                            }}
                            zoom={13}
                            clickableIcons={false}
                        >
                            <Marker onClick={this.onMarkerClick}
                                name={'Current location'}
                            />
                        </Map>
                    </div>
                  }
              />
        );
    }

}

export default GoogleApiWrapper({
    apiKey: "AIzaSyCM3XLIiyNG7QO_SAW_Di8GwfYS30-pS8s"
})(MapCard)
