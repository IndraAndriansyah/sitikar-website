var routeColors = ['#4a90e2', '#fcba03', '#fc0303', '#03fc84', '#7703fc'];
var lightGrayColor = '#D3D3D3'; // Lighter gray color
var outlineColor = '#000000'; // Outline color for the shadow effect
var selectedRouteIndex = 0;
var infoHint = new InfoHint('info', 'bottom-center').addTo(document.getElementById('map'));

var markers = [
  { lat: -6.916781180397956, lng: 107.63403662622008, label: 'Mako' },
  { lat: -6.877620763042989, lng: 107.59109975301531, label: 'Utara' },
  { lat: -6.945701237488454, lng: 107.58270447977459, label: 'Selatan' },
  { lat: -6.9394, lng: 107.6723, label: 'Timur' },
  { lat: -6.9082415715777215, lng: 107.57425747663765, label: 'Barat' }
];

var marker_hidran = [
  { lat: -6.913132706130957, lng: 107.63385438296504, label: 'Titik Hidran Jl. Supratman' },
  { lat: -6.953758724364954, lng: 107.63885827962207, label: 'Titik Hidran Pasar Kordon' },
  { lat: -6.898616354466943, lng: 107.6122359707722, label: 'Titik Hidran Taman Cikapayang Dago' }
];

var hydrantMarkers = []; // Array to store hydrant marker objects

function createMarker(icon, position, color, popupText) {
  var markerElement = document.createElement('div');
  markerElement.className = 'marker';

  var markerContentElement = document.createElement('div');
  markerContentElement.className = 'marker-content';
  markerContentElement.style.backgroundColor = color;
  markerElement.appendChild(markerContentElement);

  var iconElement = document.createElement('div');
  iconElement.className = 'marker-icon';
  iconElement.style.backgroundImage = 'url(' + icon + ')';
  markerContentElement.appendChild(iconElement);

  var popup = new tt.Popup({ offset: 30 }).setText(popupText);
  return new tt.Marker({ element: markerElement, anchor: 'bottom' })
    .setLngLat(position)
    .setPopup(popup);
}

var fireTruckIcon = './static/Images/truck-logo.png';
var hidranIcon = './static/Images/Hydrant.png';

// Create fire truck markers
markers.forEach(function(marker) {
  createMarker(fireTruckIcon, [marker.lng, marker.lat], '#ff0000', marker.label).addTo(map);
});

function addHydrantMarkers() {
  marker_hidran.forEach(function(marker) {
    var hydrantMarker = createMarker(hidranIcon, [marker.lng, marker.lat], '#0099FF', marker.label);
    hydrantMarker.addTo(map);
    hydrantMarkers.push(hydrantMarker);
  });
}

function removeHydrantMarkers() {
  hydrantMarkers.forEach(function(marker) {
    marker.remove();
  });
  hydrantMarkers = [];
}

// Toggle hydrant markers
var hidranToggle = document.getElementById('hidran-toggle');
hidranToggle.addEventListener('change', function(event) {
  if (event.target.checked) {
    addHydrantMarkers();
  } else {
    removeHydrantMarkers();
  }
});

var startMarker, endMarker;
var popup_route;
var list_route = document.querySelector('.directOption-side-panel');

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


function plotRoute(startLng, startLat, endLng, endLat, callback) {
  tt.services.calculateRoute({
    key: apiKey,
    traffic: true,
    locations: [[startLng, startLat], [endLng, endLat]],
    maxAlternatives: 2,
    computeTravelTimeFor: 'all',
    computeBestOrder: false,
    travelMode: 'bus',
    vehicleWidth: 3,
    vehicleLength: 7,
    vehicleHeight: 3,
    routeType: 'fastest',
    vehicleMaxSpeed: 200
  })
  .then(function(response) {
    var features = response.toGeoJson().features;

    features.forEach(function(feature, index) {
      var color = index === 0 ? routeColors[index] : lightGrayColor; // Only main route has the original color
      var width = 6;
      var opacity = index === 0 ? 1 : 0.5; // Set main route opacity to 1

      // Add the white outline layer
      map.addLayer({
        'id': 'route-outline' + index,
        'type': 'line',
        'source': {
          'type': 'geojson',
          'data': feature
        },
        'paint': {
          'line-color': '#000000',
          'line-width': width + 2,
          'line-opacity': 1,
          'line-blur': 2 // Reduced blur for shadow effect
        },
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      // Add the route layer
      map.addLayer({
        'id': 'route' + index,
        'type': 'line',
        'source': {
          'type': 'geojson',
          'data': feature
        },
        'paint': {
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
          'line-blur': 0 // Reduced blur for shadow effect
        },
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      map.on('mouseenter', 'route' + index, function(e) {
        map.getCanvas().style.cursor = 'pointer';
        createPopup(feature.properties.summary, e.lngLat);
      });

      map.on('mouseleave', 'route' + index, function() {
        map.getCanvas().style.cursor = '';
        if (popup_route) {
          popup_route.remove();
        }
      });

      map.on('click', 'route' + index, function() {
        highlightRoute(index, features);
      });
    });

    var bounds = new tt.LngLatBounds();
    features[0].geometry.coordinates.forEach(function(point) {
      bounds.extend(tt.LngLat.convert(point));
    });
    map.fitBounds(bounds, { padding: 50 });

    var routeInformationList = createRouteInformationList(features);
    list_route.appendChild(routeInformationList);

    // Automatically highlight the main route
    highlightRoute(0, features);

    if (callback) {
      callback();
    }
  });
}

function highlightRoute(index, features) {
  features.forEach(function(feature, idx) {
    var color = routeColors[idx];
    var fadedColor = lightGrayColor;
    var opacity = idx === index ? 1 : 0.5;

    // Update route layer properties
    map.setPaintProperty('route' + idx, 'line-color', idx === index ? color : fadedColor);
    map.setPaintProperty('route' + idx, 'line-opacity', opacity);
    map.setPaintProperty('route-outline' + idx, 'line-opacity', idx === index ? 1 : 0.5);

    // Move the selected route layers to the top
    if (idx === index) {
      map.moveLayer('route-outline' + idx);
      map.moveLayer('route' + idx);
    }
  });
  selectedRouteIndex = index;
}

function createRouteInformationItem(summary, index) {
  return (
    '<div class="route-wrapper" id="route-info-' + index + '">' +
    '<div class="route-icon" style="background:' + routeColors[index] + '"></div>' +
    '<div class="route-information">' +
    '<div>' + (index ? 'Rute Alternatif ' + index : 'Rute Utama') + '</div>' +
    '<div><span class="route-option-text">Jarak Tempuh:</span> ' +
    Formatters.formatAsMetricDistance(summary.lengthInMeters) +
    '</div>' +
    '<div><span class="route-option-text">Waktu Tempuh:</span> ' +
    Formatters.formatToDurationTimeString(summary.travelTimeInSeconds) +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function createRouteInformationList(features) {
  var routesListWrapper = document.createElement('div');
  features.forEach(function(feature, index) {
    var summary = feature.properties.summary;
    var resultListElementWrapper = document.createElement('div');
    resultListElementWrapper.innerHTML = createRouteInformationItem(summary, index);
    resultListElementWrapper.onmouseover = function() {
      map.setPaintProperty('route' + index, 'line-width', 8);
    };
    resultListElementWrapper.onmouseout = function() {
      map.setPaintProperty('route' + index, 'line-width', 6);
    };
    resultListElementWrapper.onclick = function() {
      highlightRoute(index, features);
    };
    routesListWrapper.appendChild(resultListElementWrapper);
  });
  return routesListWrapper;
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
      key: apiKey
    },
    labels: {
      placeholder: 'Masukkan titik lokasi TKP'
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
        clearRoutes();
        clearRouteList();

        endMarker = new tt.Marker({ element: createMarkerElement('finish') }).setLngLat([endLocation.lng, endLocation.lat]).setPopup(new tt.Popup().setText("End Location")).addTo(map).togglePopup();
        startMarker = new tt.Marker({ element: createMarkerElement('start') }).setLngLat([nearestMarker.lng, nearestMarker.lat]).addTo(map);

        plotRoute(nearestMarker.lng, nearestMarker.lat, endLocation.lng, endLocation.lat);
      }
    }
  });

  searchBox.on('tomtom.searchbox.resultscleared', function() {
    clearRoutes();
    clearRouteList();
    if (startMarker) startMarker.remove();
    if (endMarker) endMarker.remove();
  });
}

createSearchBox();

var currentPopup = null;

function showContextMenu(e) {
  var coordinates = e.lngLat;
  var popupContent = document.createElement('div');
  var navigateOption = document.createElement('button');

  navigateOption.textContent = 'Rute ke sini';
  navigateOption.onclick = function(event) {
    var searchBoxInput = document.querySelector('.tt-search-box-input');
    searchBoxInput.value = coordinates.lat + ', ' + coordinates.lng;

    var inputEvent = new Event('input', {
      bubbles: true,
    });

    searchBoxInput.dispatchEvent(inputEvent);
    contextPopup.remove();

    if (!directsidebar.classList.contains('open')) {
      directsidebar.classList.add('open');
    }
  };

  popupContent.appendChild(navigateOption);

  // Remove the previous popup if it exists
  if (currentPopup) {
    currentPopup.remove();
  }

  var contextPopup = new tt.Popup()
    .setLngLat(coordinates)
    .setDOMContent(popupContent)
    .addTo(map);

  // Store the current popup reference
  currentPopup = contextPopup;
}

map.on('contextmenu', showContextMenu);

function clearRouteList() {
  list_route.innerHTML = '';
}
