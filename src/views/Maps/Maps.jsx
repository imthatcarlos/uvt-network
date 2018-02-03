import React, { Component } from 'react';
import {Map, Marker, GoogleApiWrapper} from 'google-maps-react';


class Maps extends Component{
    render() {
        return (
            <div id="map">
                <Map
                    style={{width: '50%', height: '100%', position: 'relative'}}
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
        );
    }

}

export default GoogleApiWrapper({
    apiKey: "AIzaSyCM3XLIiyNG7QO_SAW_Di8GwfYS30-pS8s"
})(Maps)
