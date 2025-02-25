formatters = Formatters;
var iconsMapping = {
    '0': 'danger',
    '1': 'accident',
    '2': 'fog',
    '3': 'danger',
    '4': 'rain',
    '5': 'ice',
    '6': 'incident',
    '7': 'laneclosed',
    '8': 'roadclosed',
    '9': 'roadworks',
    '10': 'wind',
    '11': 'flooding',
    '14': 'brokendownvehicle'
};

var incidentSeverity = {
    '0': 'unknown',
    '1': 'minor',
    '2': 'moderate',
    '3': 'major',
    '4': 'undefined'
};

var incidentsData = {};

var incidentsMarkers = {},
    results = document.querySelector('.js-results'),
    selectedClass = '-selected',
    selectedIncidentId = '',
    sortDirection,
    sortedByValue;

    var  detailsIncident= null;
    
  function compareIncidentCategory(a, b) {
    var firstValue = a.properties[sortedByValue],
        secondValue = b.properties[sortedByValue],
        modifier = sortDirection === 'asc' ? 1 : -1;

    if (typeof firstValue === 'string') {
        return modifier * firstValue.localeCompare(secondValue);
    }
    return modifier * (firstValue - secondValue);
}

function convertToGeoJson(data) {
    return data.incidents.reduce(function(result, feature) {
        var current = {};
        feature.geometry.type = 'Point';
        feature.geometry.coordinates = feature.geometry.coordinates[0];
        current[feature.properties.id] = feature;
        return Object.assign(result, current);
    }, {});
}

function createDisplayedIncidentsData() {
  var array = [];

  for (var incidentId in incidentsData) {
      var incident = incidentsData[incidentId],
          properties = incident.properties;

      if (!properties.delay) {
          properties.delay = 0;
      }
      array.push(incident);
  }
  if (sortedByValue && sortDirection) {
      array.sort(compareIncidentCategory);
  }
  return array;
}
function createIncidentDetailsContent(properties) {
  var incidentDetailsElement = DomHelpers.elementFactory('div', '');

  incidentDetailsElement.innerHTML =
      '<div class="tt-incidents-details">' +
          '<div class="tt-traffic-icon -details">' +
              '<div class="tt-icon-circle-' + incidentSeverity[properties.magnitudeOfDelay] + ' -small">' +
                  '<div class="tt-icon-' + iconsMapping[properties.iconCategory] + '"></div>' +
              '</div>' +
          '</div>' +
          '<div>' +
              (properties.roadNumbers ? '<b>' + separateRoadNumbers(properties.roadNumbers) + '</b>' : '') +
              '<div>' + properties.from + '</div>' +
              '<div>' + properties.to + '</div>' +
          '<div>' +
      '</div>';
  return incidentDetailsElement;
}

function separateRoadNumbers(roadNumbers) {
  return roadNumbers.length > 1 ? roadNumbers.join(' - ') : roadNumbers;
}

function createIncidentHeader() {
    if (!isIncidentsToggleOn) return; // Prevent updating if toggle is off

    var headerNames = [
        {
            text: 'Incident',
            attribute: 'from'
        },
        {
            text: 'Delay',
            attribute: 'delay'
        },
        {
            text: 'Length',
            attribute: 'length'
        }
    ];
    var incidentHeader = document.querySelector('.incident-side-panel__header');
    incidentHeader.innerHTML = '';
    headerNames.forEach(function(headerName) {
        var headerElement = DomHelpers.elementFactory('div', ''),
            sortIcon = headerName.attribute === sortedByValue ?
                sortDirection === 'asc' ?
                    '<span class="tt-button -sortable">' +
                        '<span class="tt-icon -sort -brown"></span>' +
                    '</span>' :
                    '<span class="tt-button -sortable">' +
                        '<span class="tt-icon -sort -brown -desc"></span>' +
                    '</span>' :
                '<span class="tt-button -sortable">' +
                    '<span class="tt-icon -sort"></span>' +
                '</span>';

        headerElement.innerHTML = headerName.text + sortIcon;
        headerElement.setAttribute('data-sort', headerName.attribute);
        headerElement.addEventListener('click', handleIncidentsSort);
        incidentHeader.appendChild(headerElement);
    });
}

  function createIncidentItemRow(markerData) {
    var properties = markerData.properties,
        delaySeconds = properties.delay,
        lengthMeters = properties.length;

    var incidentDelay = DomHelpers.elementFactory('div', '', formatters.formatToDurationTimeString(delaySeconds)),
        incidentLength = DomHelpers.elementFactory('div', '', formatters.formatAsMetricDistance(lengthMeters)),
        incidentDetailsContent = createIncidentDetailsContent(properties),
        incidentsListItem = DomHelpers.elementFactory('div', 'tt-incidents-list__item');

    incidentsListItem.setAttribute('data-id', properties.id);
    incidentsListItem.appendChild(incidentDetailsContent);
    incidentsListItem.appendChild(incidentDelay);
    incidentsListItem.appendChild(incidentLength);
    return incidentsListItem;
}

function createIncidentsList(isSorted) {
    if (!isIncidentsToggleOn) return; // Prevent updating if toggle is off

    results.innerHTML = '';
    if (!displayedIncidentsData.length) {
        var placeholder = DomHelpers.elementFactory('div', 'tt-overflow__placeholder -small',
            'No data for this view, try to move or zoom...');

        results.appendChild(placeholder);
        return;
    }

    var incidentsList = DomHelpers.elementFactory('div', 'tt-incidents-list');

    displayedIncidentsData.forEach(function(markerData) {
        var incidentsItemRow = createIncidentItemRow(markerData);

        incidentsList.appendChild(incidentsItemRow);
    });
    incidentsList.addEventListener('click', handleResultItemClick);
    results.appendChild(incidentsList);
    var selectedIncidentElement = document.querySelector('div[data-id="' + selectedIncidentId + '"]');

    if (selectedIncidentId && selectedIncidentElement) {
        selectedIncidentElement.classList.add(selectedClass);
    } else {
        selectedIncidentId = '';
    }
    if (isSorted) {
        document.querySelector('.js-results').scrollTop = 0;
    }
}


function findParentNodeId(element, dataId) {
    if (element.getAttribute(dataId)) {
        return element.getAttribute(dataId);
    }
    while (element.parentNode) {
        element = element.parentNode;
        if (element.getAttribute(dataId)) {
            return element.getAttribute(dataId);
        }
    }
    return null;
}
function handleIncidentsSort(event) {
var actualMarkersData = displayedIncidentsData,
    sortProperty = event.currentTarget.getAttribute('data-sort');
    sortDirection = sortedByValue === sortProperty ?
        !sortDirection || sortDirection === 'desc' ?
            'asc' :
            'desc' :
        'asc';
    sortedByValue = sortProperty;
    displayedIncidentsData = actualMarkersData.sort(compareIncidentCategory);
    createIncidentHeader();
    createIncidentsList(true);
}

function handleResultItemClick(event) {
    var target = event.target,
        markerId = findParentNodeId(target, 'data-id'),
        selectedIncidentElementClassList = document.querySelector('div[data-id="' + markerId + '"]').classList;

    if (selectedIncidentElementClassList.contains(selectedClass)) {
        return;
    }
    for (var marker in incidentsMarkers) {
        var currentMarker = incidentsMarkers[marker];

        if (currentMarker.getPopup().isOpen()) {
            currentMarker.togglePopup();
        }
    }
    var selectedMarker = incidentsMarkers[markerId];

    if (!selectedMarker.getPopup().isOpen()) {
        selectedMarker.togglePopup();
    }
    selectedMarker.getPopup().once('close', function() {
        document.querySelector('div[data-id="' + markerId + '"]').classList.remove(selectedClass);
        selectedIncidentId = '';
    });
}

function makeResultItemSelected(markerId) {
    var selectedIncidentElementClassList = document.querySelector('div[data-id="' + markerId + '"]').classList,
      selectedMarker = incidentsMarkers[markerId],
      offsetY = Math.floor(selectedMarker.getPopup().getElement().getBoundingClientRect().height * 0.5);
    selectedIncidentId = markerId;
    map.flyTo({
      center: incidentsMarkers[markerId].getLngLat(),
      offset: [0, offsetY],
      speed: 0.5
    });
    [].slice.call(document.querySelectorAll('.tt-incidents-list__item'))
      .forEach(function(DOMElement) {
          DOMElement.classList.remove(selectedClass);
      });
    selectedIncidentElementClassList.add(selectedClass);
  }

  var incidentsManager = null;
  var hiddenIncidentsMarkers = {};
  var hiddenClass = 'hidden-marker';
  var isIncidentsToggleOn = false; // Add a flag to track the toggle state
  
  // Fungsi untuk menambahkan kelas tersembunyi ke semua marker insiden
  function hideAllIncidentMarkers() {
      for (var markerId in incidentsMarkers) {
          if (incidentsMarkers.hasOwnProperty(markerId)) {
              incidentsMarkers[markerId].getElement().classList.add(hiddenClass);
          }
      }
  }
  
  // Fungsi untuk menghapus kelas tersembunyi dari semua marker insiden
  function showAllIncidentMarkers() {
      for (var markerId in incidentsMarkers) {
          if (incidentsMarkers.hasOwnProperty(markerId)) {
              incidentsMarkers[markerId].getElement().classList.remove(hiddenClass);
          }
      }
  }
  
  // CSS untuk menyembunyikan marker
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `.${hiddenClass} { display: none !important; }`;
  document.getElementsByTagName('head')[0].appendChild(style);
  

  document.querySelector('#incidents-toggle').addEventListener('change', function(event) {
    isIncidentsToggleOn = event.target.checked;

    if (isIncidentsToggleOn) {
        map.showTrafficIncidents();

        // Inisialisasi atau perbarui IncidentsDetailsManager jika belum diinisialisasi
        if (!incidentsManager) {
            incidentsManager = new IncidentsDetailsManager(map, tt.services, {
                key: apiKey,
                incidentMarkerFactory: function() {
                    return new IncidentMarker({
                        iconsMapping: iconsMapping,
                        incidentSeverity: incidentSeverity,
                        onSelected: makeResultItemSelected
                    });
                },
                onDetailsUpdated: function(data) {
                    if (!isIncidentsToggleOn) return; // Stop updating if toggle is off

                    incidentsMarkers = data.markers;
                    incidentsData = convertToGeoJson(data.trafficIncidents);

                    createIncidentHeader();
                    displayedIncidentsData = createDisplayedIncidentsData();
                    createIncidentsList(false);
                }
            });
        }

        // Tampilkan semua marker insiden yang ada
        for (var markerId in hiddenIncidentsMarkers) {
            if (hiddenIncidentsMarkers.hasOwnProperty(markerId)) {
                hiddenIncidentsMarkers[markerId].addTo(map);
            }
        }

        hiddenIncidentsMarkers = {};

    } else {
        map.hideTrafficIncidents();

        // Sembunyikan semua marker insiden
        for (var markerId in incidentsMarkers) {
            if (incidentsMarkers.hasOwnProperty(markerId)) {
                hiddenIncidentsMarkers[markerId] = incidentsMarkers[markerId];
                hiddenIncidentsMarkers[markerId].remove();
            }
        }

        // Hapus detail insiden dari tampilan
        incidentsData = {};
        displayedIncidentsData = [];
        results.innerHTML = '';
    }
});
  
  // Function to remove all markers from the map
  function removeAllMarkers() {
      for (var markerId in incidentsMarkers) {
          if (incidentsMarkers.hasOwnProperty(markerId)) {
              incidentsMarkers[markerId].remove();
          }
      }
      incidentsMarkers = {};
  }
  
