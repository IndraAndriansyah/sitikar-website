function IncidentDetailsMarkersManager(map, incidentMarkerFactory) {
  this.incidentMarkers = {};
  this.map = map;
  this.incidentMarkerFactory = incidentMarkerFactory;

  this.addMarkers = this.addMarkers.bind(this);
  this._addMarker = this._addMarker.bind(this);
  this._mapResponseToFeaturesDictionary = this._mapResponseToFeaturesDictionary.bind(this);
  this.getMarkers = this.getMarkers.bind(this);
  this.showAllMarkers = this.showAllMarkers.bind(this);
  this.hideAllMarkers = this.hideAllMarkers.bind(this);
}

var newMarkers  = null;
IncidentDetailsMarkersManager.prototype.addMarkers = function(incidents, newMarkers) {
  newMarkers = this._mapResponseToFeaturesDictionary(incidents);

  Object.keys(this.incidentMarkers).forEach(function(featureId) {
    if (!newMarkers[featureId]) {
      this.incidentMarkers[featureId].getMarker().remove();
      delete this.incidentMarkers[featureId];
    } else {
      this.incidentMarkers[featureId].update(newMarkers[featureId]);
      delete newMarkers[featureId];
    }
  }.bind(this));
  
  Object.values(newMarkers).forEach(function(feature) {
    this._addMarker(feature);
  }.bind(this));
};

IncidentDetailsMarkersManager.prototype._addMarker = function(feature) {
  var featureId = feature.properties.id;
  var incidentMarker = this.incidentMarkerFactory();
  incidentMarker.markerFactory(feature);

  this.incidentMarkers[featureId] = incidentMarker;
  incidentMarker.getMarker().addTo(this.map);
};

IncidentDetailsMarkersManager.prototype._mapResponseToFeaturesDictionary = function(response) {
  return response.incidents.reduce(function(result, feature) {
    var current = {};
    feature.geometry.type = 'Point';
    feature.geometry.coordinates = feature.geometry.coordinates[0];
    current[feature.properties.id] = feature;
    return Object.assign(result, current);
  }, Object.create(null));
};

IncidentDetailsMarkersManager.prototype.getMarkers = function() {
  var markers = {};
  Object.keys(this.incidentMarkers).forEach(function(featureId) {
    markers[featureId] = this.incidentMarkers[featureId].getMarker();
  }.bind(this));

  return markers;
};

IncidentDetailsMarkersManager.prototype.showAllMarkers = function() {
  Object.keys(this.incidentMarkers).forEach(function(featureId) {
    this.incidentMarkers[featureId].getMarker().addTo(this.map);
  }.bind(this));
};

IncidentDetailsMarkersManager.prototype.hideAllMarkers = function() {
  Object.keys(this.incidentMarkers).forEach(function(featureId) {
    this.incidentMarkers[featureId].getMarker().remove();
  }.bind(this));
  if (newMarkers) {
    newMarkers.remove();
  }
};

function IncidentsDetailsManager(map, services, options) {
  this.map = map;
  this.services = services;
  this.options = options;
  this.onDetailsUpdated = this.options.onDetailsUpdated;
  this.incidentsMarkerManager = new IncidentDetailsMarkersManager(map, options.incidentMarkerFactory);

  this._fetchIncidentDetails = this._fetchIncidentDetails.bind(this);
  this._registerEvents = this._registerEvents.bind(this);
  this._updateIncidentMarkers = this._updateIncidentMarkers.bind(this);

  this._registerEvents();
  this._startAutoUpdate();
}

IncidentsDetailsManager.prototype._fetchIncidentDetails = function() {
  var requestOptions = {
    key: this.options.key,
    boundingBox: this.map.getBounds(),
    fields: `{
      incidents {
        type,
        geometry {
          type,
          coordinates
        },
        properties {
          id,
          iconCategory,
          magnitudeOfDelay,
          events {
            description,
            code,
            iconCategory
          },
          startTime,
          endTime,
          from,
          to,
          length,
          delay,
          roadNumbers,
          aci {
            probabilityOfOccurrence,
            numberOfReports,
            lastReportTime
          }
        }
      }
    }`
  };

  return this.services.incidentDetailsV5(requestOptions);
};

IncidentsDetailsManager.prototype._registerEvents = function() {
  var sourceDataHandler = window.debounce(function(event) {
    if (event.sourceId === 'vectorTilesIncidents') {
      this._updateIncidentMarkers();
    }
  }.bind(this), 500);
  this.map.on('sourcedata', sourceDataHandler);
  
  var incidentsToggle = document.getElementById('incidents-toggle');
  incidentsToggle.addEventListener('change', this._updateIncidentMarkers);
};

IncidentsDetailsManager.prototype._updateIncidentMarkers = function() {
  var incidentsToggle = document.getElementById('incidents-toggle');
  if (!incidentsToggle.checked) {
    return;
  }

  this._fetchIncidentDetails()
    .then(function(incidentDetails) {
      this.incidentsMarkerManager.addMarkers(incidentDetails);
      this.onDetailsUpdated({
        trafficIncidents: incidentDetails,
        markers: this.incidentsMarkerManager.getMarkers()
      });
    }.bind(this));
};

IncidentsDetailsManager.prototype._startAutoUpdate = function() {
  setInterval(this._updateIncidentMarkers, 3 * 60 * 1000); // 3 minutes interval
};

window.IncidentsDetailsManager = window.IncidentsDetailsManager || IncidentsDetailsManager;
