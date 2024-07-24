let sidebar = document.querySelector(".sidebar");
let closeBtn = document.querySelector("#btn");
let searchbtn = document.querySelector("#searchbtn");
let directbtn = document.querySelector("#directbtn");
let trafficbtn = document.querySelector("#trafficbtn");
let searchsidebar = document.querySelector(".search-sidebar");
let trafficsidebar = document.querySelector(".traffic-sidebar");
let directsidebar = document.querySelector(".direct-sidebar");
let logo = document.querySelector(".custom-icon");


closeBtn.addEventListener("click", ()=>{
  sidebar.classList.toggle("open");
  menuBtnChange();//calling the function(optional)
});

function menuBtnChange() {
 if(sidebar.classList.contains("open")){
   closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");//replacing the iocns class
   
 }else {
   closeBtn.classList.replace("bx-menu-alt-right","bx-menu");//replacing the iocns class
   logo.classList.remove();
   
 }
}



trafficbtn.addEventListener("click", ()=>{
  if (directsidebar.classList.contains('open')) {
    directsidebar.classList.remove('open');
    trafficsidebar.classList.toggle("open");
    menuBtnChange();//calling the function(optional)
  }
  else {
    trafficsidebar.classList.toggle("open");
    menuBtnChange();//calling the function(optional)
  }
  
});


directbtn.addEventListener("click", ()=>{
  if (trafficsidebar.classList.contains('open')) {
    trafficsidebar.classList.remove('open');
    directsidebar.classList.toggle("open");
    menuBtnChange();//calling the function(optional)
  }
  else {
    directsidebar.classList.toggle("open");
    menuBtnChange();//calling the function(optional)
  }
  
});

document.getElementById('about-button').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('popupabout').style.display = 'flex';
});

document.querySelector('.close-popup-btn').addEventListener('click', function() {
  document.getElementById('popupabout').style.display = 'none';
});

window.addEventListener('click', function(event) {
  if (event.target == document.getElementById('popupabout')) {
      document.getElementById('popupabout').style.display = 'none';
  }
});



//title animation
document.addEventListener('DOMContentLoaded', function() {
  let title = document.title;
  let index = 0;
  let scrollInterval;

  function scrollTitle() {
    document.title = title.substring(index) + ' ' + title.substring(0, index);
    index = (index + 1) % title.length;
  }

  function startAnimation() {
    scrollInterval = setInterval(scrollTitle, 200); // Ganti angka 200 sesuai kecepatan yang diinginkan
    setTimeout(() => {
      clearInterval(scrollInterval);
      document.title = title; // Reset title to the original after the animation
      index = 0; // Reset index to 0
    }, 200 * title.length); // Stop after one full cycle
  }

  startAnimation(); // Start immediately
  setInterval(startAnimation, 60000); // Start every 1 minute
});
