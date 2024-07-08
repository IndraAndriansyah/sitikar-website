var routeColors = ['#4a90e2', '#fcba03', '#fc0303', '#03fc84', '#7703fc'];
var infoHint = new InfoHint('info', 'bottom-center').addTo(document.getElementById('map'));


var markers = [
  {lat: -6.916781180397956, lng: 107.63403662622008, label: 'Mako'},
  {lat: -6.877620763042989, lng: 107.59109975301531, label: 'utara'},
  {lat: -6.945701237488454, lng: 107.58270447977459, label: 'selatan'},
  {lat: -6.9394, lng: 107.6723, label: 'timur'}, 
  {lat: -6.9082415715777215, lng: 107.57425747663765, label: 'barat'}
];

// Add markers to the map
var markerObjects = markers.map(function(marker) {
  return new tt.Marker().setLngLat([marker.lng, marker.lat]).setPopup(new tt.Popup().setText(marker.label)).addTo(map);
});

var startMarker, endMarker;
var popup_route;

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the Earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
      0.5 - Math.cos(dLat) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon)) / 2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function findNearestMarker(endLat, endLng) {
  var nearestMarker = null;
  var minDistance = Infinity;

  markers.forEach(function(marker) {
      var distance = calculateDistance(endLat, endLng, marker.lat, marker.lng);
      if (distance < minDistance) {
          minDistance = distance;
          nearestMarker = marker;
      }
  });

  return nearestMarker;
}

function createMarkerElement(type) {
  var element = document.createElement('div');
  var innerElement = document.createElement('div');

  element.className = 'route-marker';
  innerElement.className = 'icon tt-icon -white -' + type;
  element.appendChild(innerElement);
  return element;
}

function createPopup(feature, lngLat) {
  if (popup_route) {
      popup_route.remove();
  }
  popup_route = new tt.Popup({ className: 'tt-popup', offset: [0, 18], closeButton: false })
      .setLngLat(lngLat)
      .setHTML(
          '<div class="tt-pop-up-container">' +
          '<div class="pop-up-content -small">' +
          '<div class="pop-up-result-address">' +
          'Distance: ' + Formatters.formatAsMetricDistance(feature.lengthInMeters) + 
          '</div>' + 
          '<div class="pop-up-result-address">' + 
          '. Estimated travel time: ' +
          Formatters.formatToDurationTimeString(feature.travelTimeInSeconds) +
          '</div>' +
          '<div class="pop-up-result-address">' +
          '. Traffic delay: ' + Formatters.formatToDurationTimeString(feature.trafficDelayInSeconds) +
          '</div>' +
          '</div>' +
          '</div>'
      )
      .setMaxWidth('none');
  popup_route.addTo(map);
}

function plotRoute(startLng, startLat, endLng, endLat) {
  tt.services.calculateRoute({
      key: '8dzxZD2SRE74hHUfz5Kg4DdW6KdNL859',
      traffic: true,
      locations: [[startLng, startLat], [endLng, endLat]],
      maxAlternatives: 2,
      computeTravelTimeFor: 'all',
      computeBestOrder: false,
      travelMode: 'car',
      //vehicleWidth:3,
      vehicleLength:7,
      vehicleHeight:3,
      routeType: 'fastest',
      vehicleMaxSpeed:100
  })
  .then(function(response) {
      var features = response.toGeoJson().features;
      features.forEach(function(feature, index) {
          map.addLayer({
              'id': 'route' + index,
              'type': 'line',
              'source': {
                  'type': 'geojson',
                  'data': feature
              },
              'paint': {
                  'line-color': routeColors[index],
                  'line-width': 6
              }
          });

          map.on('mouseenter', 'route' + index, function (e) {
              map.getCanvas().style.cursor = 'pointer';
              createPopup(feature.properties.summary, e.lngLat);
          });

          map.on('mouseleave', 'route' + index, function () {
              map.getCanvas().style.cursor = '';
              if (popup_route) {
                  popup_route.remove();
              }
          });
      });
      
      var bounds = new tt.LngLatBounds();
      features[0].geometry.coordinates.forEach(function(point) {
          bounds.extend(tt.LngLat.convert(point));
      });
      map.fitBounds(bounds, { padding: 50 });
  });
}

function clearRoutes() {
  var layers = map.getStyle().layers;
  layers.forEach(function(layer) {
      if (layer.id.startsWith('route')) {
          map.removeLayer(layer.id);
          map.removeSource(layer.id);
      }
  });
  if (popup_route) {
      popup_route.remove();
  }
}

function createSearchBox() {
  var searchBox = new tt.plugins.SearchBox(tt.services, {
      showSearchButton: false,
      searchOptions: {
          key: '8dzxZD2SRE74hHUfz5Kg4DdW6KdNL859'
      },
      labels: {
          placeholder: 'Enter destination'
      }
  });

  document.getElementById('destinationSearchBox').appendChild(searchBox.getSearchBoxHTML());

  searchBox.on('tomtom.searchbox.resultselected', function(event) {
      if (event.data && event.data.result) {
          var position = event.data.result.position;
          var endLocation = { lat: position.lat, lng: position.lng };

          var nearestMarker = findNearestMarker(endLocation.lat, endLocation.lng);

          if (nearestMarker) {
              if (startMarker) startMarker.remove();
              if (endMarker) endMarker.remove();

              endMarker = new tt.Marker({ element: createMarkerElement('finish') }).setLngLat([endLocation.lng, endLocation.lat]).setPopup(new tt.Popup().setText("End Location")).addTo(map).togglePopup();
              startMarker = new tt.Marker({ element: createMarkerElement('start') }).setLngLat([nearestMarker.lng, nearestMarker.lat]).addTo(map);

              plotRoute(nearestMarker.lng, nearestMarker.lat, endLocation.lng, endLocation.lat);
          }
      }
  });

  searchBox.on('tomtom.searchbox.resultscleared', function() {
      clearRoutes();
      if (startMarker) startMarker.remove(); // coba nanti ganti jadi clear
      if (endMarker) endMarker.remove();
  });
}

createSearchBox();
