const apiKey = '8dzxZD2SRE74hHUfz5Kg4DdW6KdNL859';
let center = [107.6110212, -6.9215529];
const stylemap ='https://api.tomtom.com/style/2/custom/style/dG9tdG9tQEBAZU9zd2VGcGoxR3l5d0xPczs0NTFmZmQ3NC03MDY0LTQ4NWYtOTA4ZS05NWViNGIyMDFkZjY=.json?key='+apiKey

var map = tt.map ({
  key: apiKey,
  container:"map",
  style: stylemap,
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