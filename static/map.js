const apiKey = 'aG5BK10VOmyInEIhXhG3UpmV2aveplaO';
let center = [107.6110212, -6.9215529];
const stylemap ='https://api.tomtom.com/style/2/custom/style/dG9tdG9tQEBAWGU2WWFHQ2k0R2ExVndVRzs1NDdmMzU1OS01NzI2LTQxYTctYTYwZC0zNDUyYmI2MjFjZTY=.json?key='+apiKey

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