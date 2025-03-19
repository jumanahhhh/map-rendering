import mapboxgl from "mapbox-gl";
import { IFCLoader } from "web-ifc-three";
import * as THREE from "three";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;
navigator.geolocation.getCurrentPosition(successLocation, errorLocation, { enableHighAccuracy: true });

function successLocation(position) {
  setupMap([position.coords.longitude, position.coords.latitude]);
  addMarker(position.coords.longitude, position.coords.latitude);
}
function errorLocation() {
  setupMap([-2.24, 53.48]);
}

function isCoordinates(input) {
  return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(input);
}
let map, pin = null, ifcModel = null, scene, camera, renderer, customLayer;
const loader = new IFCLoader();
loader.ifcManager.setWasmPath("/map-rendering/");

function setupMap(center) {
  try {
    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v11",
      center: center,
      zoom: 17,
      // pitch: 60,
      antialias: true
    });

    const nav = new mapboxgl.NavigationControl();
    const geolocate = new mapboxgl.GeolocateControl();
    map.addControl(nav,"top-right");
    map.addControl(geolocate,"top-right");

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    map.on("load", () => {
      console.log("Map fully loaded");
      map.addSource("mapbox-dem",{
        type:"raster-dem",
        url:"mapbox://mapbox.terrain-rgb",
        tileSize:256,
        maxzoom:17,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      //3D Buildings
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
      setupThreeJS();
    });

    //Pin a Location on Map Click
    map.on("click",(event)=>{
      const {lng,lat} = event.lngLat;
      if (pin) pin.remove();
      pin =new mapboxgl.Marker({color:"red"})
      .setLngLat([lng, lat])
      .addTo(map);
      console.log("📍 Pinned Location: ",lng,lat);
    });

      //fly to searched location
    document.getElementById("search").addEventListener("click", () => {
      const input = document.getElementById("locationInput").value.trim();
      if(!input) return alert("Please enter a location");

      if(isCoordinates(input)){
        const [lat,lng] = input.split(",").map(Number);
        map.flyTo({ center: [lng,lat], zoom:17 });
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
            map.flyTo({ center:[lng,lat], zoom:17});
          })
          .catch(() => alert("Error fetching location"));
        }
      });
  } catch (error) {
    console.error("Error setting up map:", error);
  }
}

// Search suggestions for searching
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
  map.flyTo({center:[lng,lat], zoom:17});
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


// Set Up Three.js Scene
function setupThreeJS() {
  scene = new THREE.Scene();
  customLayer = {
    id:'3d-ifc-model',
    type:'custom',
    renderingMode:'3d',
    onAdd: function(map,gl){
      renderer =new THREE.WebGLRenderer({
        canvas:map.getCanvas(),
        context:gl,
        antialias:true,
        alpha:true
      });
      renderer.autoClear = false;
      
      camera = new THREE.Camera();
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);
    
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(0, 70, 100);
      scene.add(directionalLight);
    },
    render: function(gl, matrix) {
      if (!renderer) return;
    
      const cameraMatrix = new THREE.Matrix4().fromArray(matrix);
      camera.projectionMatrix = cameraMatrix;
    
      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    }
  };
  map.addLayer(customLayer);
  console.log("ThreeJS setup complete");
}

// handling IFC model loading and rendering
document.getElementById("file-input").addEventListener("change", async (event)=>{
  const file =event.target.files[0];
  if(file){
    const url = URL.createObjectURL(file);
    loadIFCModel(url);
  }
});

async function loadIFCModel(url) {
  try{
    if(ifcModel){
      scene.remove(ifcModel);
      ifcModel=null;
    }

    loader.load(url, async (model)=>{
      ifcModel = model;
      scene.add(model);
      console.log("IFC Model Loaded:", model);

      if(pin){
        const {lng,lat} = pin.getLngLat();
        placeModelAtLocation(lng, lat);
      }
    });
  }catch (error){
    console.error("ifc-model load error",error);
  }
}

// placing the model
function placeModelAtLocation(lng, lat) {
  if (!ifcModel || !map) return;
  
  //mercator coordinate
  const modelOrigin = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  const modelAltitude = 0;
  const modelScale = modelOrigin.meterInMercatorCoordinateUnits();
  
  // modelTransform matrix to position the model
  const modelTransform = {
    translateX: modelOrigin.x,
    translateY: modelOrigin.y,
    translateZ: modelOrigin.z + modelAltitude,
    rotateX: Math.PI / 2,
    rotateY: 0,
    rotateZ: 0,
    scale: modelScale
  };
  
  // applying transformation to the model
  ifcModel.position.set(
    modelTransform.translateX,
    modelTransform.translateY,
    modelTransform.translateZ
  );
  
  //rotation
  ifcModel.rotation.x = modelTransform.rotateX;
  ifcModel.rotation.y = modelTransform.rotateY;
  ifcModel.rotation.z = modelTransform.rotateZ;
  
  // Apply scale - significantly larger than before
  ifcModel.scale.set(modelScale, modelScale, modelScale);
  
  console.log("🏗️ IFC Model Moved To:", {
    position: ifcModel.position,
    rotation: ifcModel.rotation,
    scale: modelScale
  });
  map.triggerRepaint();
}

// place Model at Pinned Location
document.getElementById("placeModelButton").addEventListener("click", () => {
  if(!pin){
    alert("Please pin a location first!");
    return;
  }
  if(!ifcModel){
    alert("Upload an IFC file first!");
    return;
  }
  const {lng,lat} =pin.getLngLat();
  placeModelAtLocation(lng,lat);
});

window.addEventListener('resize', () => {
  if (map && renderer) {
    map.triggerRepaint();
  }
});



const timeLoader = document.getElementById("loader");
const fileInput = document.getElementById("file-input");
function showLoader(){
  timeLoader.style.display ="flex";
}

function hideLoader(){
  timeLoader.style.display ="none";
}

fileInput.addEventListener("change", async (event)=>{
    if (event.target.files.length > 0) {
        showLoader();
        await loadModel(event.target.files[0]);
        hideLoader();
    }
});

async function loadModel(file){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            console.log("loaded: ",file.name);
            resolve();
        }, 3000); 
    });
}
