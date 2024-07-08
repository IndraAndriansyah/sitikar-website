const apiKey = 'eGjlzc0IQpU2t2qqyICGA0aQ764NWIFE';
let center = [107.6110212, -6.9215529];

var map = tt.map ({
  key: apiKey,
  container:"map",
  style:"https://api.tomtom.com/style/2/custom/style/dG9tdG9tQEBAZU9zd2VGcGoxR3l5d0xPczs2YTg4NDZmNS0zNTgwLTQ3ZjktYTE0My05MDFmMTgwOWVkOWE=.json?key=8dzxZD2SRE74hHUfz5Kg4DdW6KdNL859",
  center: center,
  zoom:14,
  fadeDuration:50,
  attributionControlPosition: 'bottom-left',
  styleVisibility:{
    trafficIncidents: true,
    trafficFlow: true 
  },
});



map.addControl(new tt.FullscreenControl());
map.addControl(new tt.NavigationControl(), 'top-right');




document.querySelector('#flow-toggle').addEventListener('change', function(event) {
  if (event.target.checked) {
    map.showTrafficFlow();
  } else {
    map.hideTrafficFlow();
  }
});