import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

navigator.geolocation.getCurrentPosition(successLocation, errorLocation,{enableHighAccuracy:true})

function successLocation(position){
  console.log(position)

  setupMap([position.coords.longitude, position.coords.latitude])
  addMarker(position.coords.longitude, position.coords.latitude);

}

function errorLocation(){
  setupMap([-2.24,53.48])
}

function isCoordinates(input) {
  return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(input);
}

// const toggle = document.getElementById("toggle")
// toggle.addEventListener("click", ()=>{
//   const theme = map.getStyle().sprite.includes("dark") ? "mapbox://styles/mapbox/light-v10" : "mapbox://styles/mapbox/dark-v11"
//   map.setStyle(theme)
// })
let pin=null;
let map;
function setupMap(center){
  map = new mapboxgl.Map({
    container:"map",
    style:"mapbox://styles/mapbox/satellite-streets-v12",
    center:center,
    zoom:15,
    pitch:60,
    antialias:true
  });

  const nav= new mapboxgl.NavigationControl();
  const geolocate= new mapboxgl.GeolocateControl();
  map.addControl(nav, "top-right")
  map.addControl(geolocate,"top-right")

  map.dragRotate.enable()
  map.touchZoomRotate.enableRotation()

  map.on("load",()=>{
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 256,
      maxzoom: 16,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    

    // Add 3D Buildings
    map.addLayer({
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 10,
      paint: {
        "fill-extrusion-color": "#aaa",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.8,
      },
    });
  })

  //pin a location
  map.on("click", (hua)=>{
    const{lng,lat}=hua.lngLat
    if(pin){pin.remove()}
    pin= new mapboxgl.Marker({color:"red"})
    .setLngLat([lng,lat])
    .addTo(map)
    console.log("Pinned Location: ",lng,lat);
  })

  //fly to searched location
  document.getElementById("search").addEventListener("click", () => {
    const input = document.getElementById("locationInput").value.trim();
    if(!input) return alert("Please enter a location");

    if(isCoordinates(input)){
      const [lat,lng] = input.split(",").map(Number);
      map.flyTo({ center: [lng,lat], zoom:15 });
    }
    else{
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          input
        )}.json?access_token=${MAPBOX_TOKEN}`
      )
        .then((response) => response.json())
        .then((data) =>{
          if (data.features.length === 0) {
            alert("Location not found");
            return;
          }
          const [lng,lat]=data.features[0].center;
          map.flyTo({ center:[lng,lat], zoom:15});
        })
        .catch(() => alert("Error fetching location"));
      }
    });
    
}

// suggestions while searching
const suggestionsList = document.getElementById("suggestions")
const locationInput = document.getElementById("locationInput");
locationInput.addEventListener("input", async ()=>{
  const ip = locationInput.value
  if(ip.length <3){
    suggestionsList.innerHTML=""
    return;
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${ip}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;
  const response = await fetch(url);
  const data = await response.json();

  suggestionsList.innerHTML = "";

  data.features.forEach((place) => {
      const li = document.createElement("li");
      li.textContent = place.place_name;
      li.addEventListener("click", () => selectLocation(place));
      suggestionsList.appendChild(li);
  });
})
function selectLocation(place) {
  const [lng,lat] =place.center;
  map.flyTo({center:[lng,lat], zoom:15});
  locationInput.value = place.place_name;
  suggestionsList.innerHTML = "";
  addMarker(lng, lat);
}

function addMarker(lng, lat, name) {
  if(pin){pin.remove()}
  pin=new mapboxgl.Marker({ color: "red" })
    .setLngLat([lng, lat])
    .setPopup(new mapboxgl.Popup().setText(name)) // Show name on click
    .addTo(map);
}
