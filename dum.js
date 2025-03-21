import mapboxgl from "mapbox-gl";
import {IFCLoader} from "web-ifc-three";
import * as THREE from "three";

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
    // setupIFCRendering();
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



// function setupIFCRendering() {
//   const scene = new THREE.Scene();

//   // Set up a camera that matches Mapbox's perspective
//   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
//   // WebGL Renderer with alpha for transparency
//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.domElement.style.position = "absolute";
//   renderer.domElement.style.top = "0px";
//   renderer.domElement.style.pointerEvents = "none"; // Allow interactions with Mapbox

//   document.body.appendChild(renderer.domElement);

//   // IFC Loader
//   const ifcLoader = new IFCLoader();
//   ifcLoader.ifcManager.setWasmPath("/");

//   let ifcModel;

//   function loadIFCModel() {
//     ifcLoader.load("/Users/jumanahmaheen/Desktop/Everything/Augrade/map-model-rendering/20201126GEN_DOE_GSE_ARC_Exploit (1).ifc", (model) => {
//       console.log("IFC Model Loaded:", ifcModel);

//       model.scale.set(0.1, 0.1, 0.1); // Adjust scale
//       ifcModel = model;
//       scene.add(model);
//     },        
//     (xhr) => {
//       console.log(`IFC Load Progress: ${(xhr.loaded / xhr.total) * 100}%`);
//     },
//     (error) => {
//         console.error("Error loading IFC model:", error);
//     });
//   }

//   // Convert Mapbox Coordinates to Three.js
//   function lngLatToThreeJS(lng, lat, elevation = 0) {
//     const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, elevation);
//     return new THREE.Vector3(mercator.x, mercator.y, mercator.z);
//   }

//   // Move IFC model when user clicks on the map
//   map.on("click", (event) => {
//     const { lng, lat } = event.lngLat;
//     console.log("Pinned Location:", lng, lat);

//     if (ifcModel) {
//       const newPosition = lngLatToThreeJS(lng, lat);
//       ifcModel.position.copy(newPosition);
//     }
//   });

//   // Mapbox Custom Layer for Three.js
//   const customLayer = {
//     id: "threejs-layer",
//     type: "custom",
//     renderingMode: "3d",
//     onAdd: function () {
//       loadIFCModel();
//     },
//     render: function (gl, matrix) {
//       renderer.render(scene, camera);
//       map.triggerRepaint();
//     },
//   };

//   // Add the custom Three.js layer to the map
//   map.on("style.load", () => {
//     map.addLayer(customLayer);
//   });
// }















// // IFC File rendering
// const scene=new THREE.scene()
// scene.background=new THREE.Color(0x000)
// const camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight, 0.1,1000)
// camera.position.set(10,10,10)

// const renderer=new THREE.WebGLRenderer({antialias:true, alpha:true});
// renderer.setSize(window.innerWidth,window.innerHeight);
// renderer.setPixelRatio(window.devicePixelRatio);
// const canvasContainer = document.getElementById("ifc-cont");
// canvasContainer.appendChild(renderer.domElement);

// const controls=new OrbitControls(camera,renderer.domElement);
// controls.enableDamping=true;

// //lights
// const ambientLight =new THREE.AmbientLight(0xffffff,1);
// scene.add(ambientLight);
// const directionalLight =new THREE.DirectionalLight(0xffffff,2);
// directionalLight.position.set(10,20,10);
// scene.add(directionalLight);

// map.on("click",()=>{
  
// })
// const loader =new IFCLoader();
// loader.ifcManager.setWasmPath('/ifc-viewer/');
// document.getElementById("file-input").addEventListener("change",async (event)=>{
//   const file =event.target.files[0];
//   if (file){
//     const url=URL.createObjectURL(file);
//     loadIFCModel(url);
//   }
// });


// async function loadIFCModel(url){
//   loader.load(url, async (model)=>{
//     scene.add(model);
//     aligning(model);
//     if(pin){
//       const{lng,lat}=pin.getLngLat()
//       positionIFCAtCoordinates(model,lng,lat)
//     }
//     const components = await listIFCComponents(model);
//     listComponents(model, components);
//   });
// }

// function positionIFCAtCoordinates(model,lng,lat){
//   const elevation=map.queryTerrainElevation([lng,lat]);
//   const mercator=mapboxgl.MercatorCoordinates.fromLngLat({lng,lat},elevation);
//   model.position.set(mercator.x, mercator.y, mercator.z || 0);
// }

// function aligning(model) {
//   const box =new THREE.Box3().setFromObject(model);
//   model.position.sub(box.getCenter(new THREE.Vector3()));
//   cameraPersp(camera,model);
// }
// function cameraPersp(camera,object,offset = 1.9){
//   const boundingBox =new THREE.Box3().setFromObject(object);
//   const center =boundingBox.getCenter(new THREE.Vector3());
//   const size =boundingBox.getSize(new THREE.Vector3());
//   const maxDim =Math.max(size.x, size.y, size.z);
//   const fov =camera.fov * (Math.PI / 180);
//   let cameraZ =Math.abs(maxDim /2*Math.tan(fov * 2)) * offset;

//   camera.position.set(center.x, center.y, cameraZ);
//   camera.lookAt(center);
//   controls.target.copy(center);
//   controls.update();
// }



















// import mapboxgl from "mapbox-gl";
// import { IFCLoader } from "web-ifc-three";
// import * as THREE from "three";

// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
// mapboxgl.accessToken = MAPBOX_TOKEN;

// navigator.geolocation.getCurrentPosition(successLocation, errorLocation, { enableHighAccuracy: true });

// function successLocation(position) {
//   setupMap([position.coords.longitude, position.coords.latitude]);
//   addMarker(position.coords.longitude, position.coords.latitude);
// }

// function errorLocation() {
//   setupMap([-2.24, 53.48]);
// }

// let map, pin = null, ifcModel = null, scene, camera, renderer;
// const loader = new IFCLoader();
// loader.ifcManager.setWasmPath("/");
// // map.getCanvas().style.zIndex = 1; // Mapbox Canvas
// // threeCanvas.style.zIndex = 2; // Three.js Canvas

// // 🔹 Initialize Mapbox Map
// function setupMap(center) {
//   map = new mapboxgl.Map({
//     container: "map",
//     style: "mapbox://styles/mapbox/satellite-streets-v12",
//     center: center,
//     zoom: 15,
//     pitch: 60,
//     antialias: true
//   });

//   const nav = new mapboxgl.NavigationControl();
//   const geolocate = new mapboxgl.GeolocateControl();
//   map.addControl(nav, "top-right");
//   map.addControl(geolocate, "top-right");

//   map.dragRotate.enable();
//   map.touchZoomRotate.enableRotation();

//   // 🔹 Load 3D Terrain
//   map.on("load", () => {
//     map.addSource("mapbox-dem", {
//       type: "raster-dem",
//       url: "mapbox://mapbox.terrain-rgb",
//       tileSize: 256,
//       maxzoom: 16,
//     });
//     map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

//     // 🔹 Add 3D Buildings
//     map.addLayer({
//       id: "3d-buildings",
//       source: "composite",
//       "source-layer": "building",
//       type: "fill-extrusion",
//       minzoom: 10,
//       paint: {
//         "fill-extrusion-color": "#aaa",
//         "fill-extrusion-height": ["get", "height"],
//         "fill-extrusion-base": ["get", "min_height"],
//         "fill-extrusion-opacity": 0.8,
//       },
//     });

//     setupThreeJS();
//   });

//   // 🔹 Pin a Location on Map Click
//   map.on("click", (event) => {
//     const { lng, lat } = event.lngLat;
//     if (pin) pin.remove();
//     pin = new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);
//     console.log("📍 Pinned Location: ", lng, lat);
//   });
// }

// // 🔹 Convert (lng, lat) to Three.js coordinates
// function lngLatToThreeJS(lng, lat) {
//   const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat });
//   return new THREE.Vector3(mercator.x, mercator.y, mercator.z || 0);
// }


// // 🔹 Set Up Three.js Scene
// function setupThreeJS() {
//   scene = new THREE.Scene();
//   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//   renderer = new THREE.WebGLRenderer({ alpha: true });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.outputEncoding = THREE.sRGBEncoding;

//   const light = new THREE.AmbientLight(0xffffff, 1);
//   scene.add(light);

//   const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
//   directionalLight.position.set(10, 20, 10);
//   scene.add(directionalLight);

//   // 🔹 Attach Three.js to Mapbox
//   map.on("style.load", () => {
//     map.addLayer({
//       id: "3d-ifc-model",
//       type: "custom",
//       renderingMode: "3d",
//       onAdd: () => {
//         renderer.domElement.style.position = "absolute";
//         renderer.domElement.style.top = "0px";
//         renderer.domElement.style.left = "0px";
//         renderer.autoClear = false;
//       },
//       render: (gl, matrix) => {
//         camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
//         renderer.resetState();
//         renderer.render(scene, camera);
//         map.triggerRepaint();
//       }
//     });
//   });

//   animate();
// }

// // 🔹 Animate Scene
// function animate() {
//   requestAnimationFrame(animate);
//   renderer.render(scene, camera);
// }

// // 🔹 Upload IFC File
// document.getElementById("file-input").addEventListener("change", async (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     const url = URL.createObjectURL(file);
//     loader.load(url, (model) => {
//       ifcModel = model;
//       model.scale.set(500, 500, 500);  // Increase model size
//       model.position.z += 10; // Raise the model
//       model.rotation.x = -Math.PI / 2; // Align with the ground

//       console.log("🔼 Adjusted IFC Model Z Position:", ifcModel.position.z);

//       scene.add(model);
//       console.log("IFC Model Loaded:", model);
//     });
//   }
// });

// // 🔹 Place Model at Pinned Location
// // 🔹 Place Model at Pinned Location
// document.getElementById("placeModelButton").addEventListener("click", () => {
//   if (!pin) {
//     alert("Please pin a location first!");
//     return;
//   }
//   if (!ifcModel) {
//     alert("Upload an IFC file first!");
//     return;
//   }
  
//   const { lng, lat } = pin.getLngLat();
//   const newPosition = lngLatToThreeJS(lng, lat);
//   newPosition.z += 10;  // Raise model above ground

//   ifcModel.position.copy(newPosition);
//   console.log("🏗️ IFC Model Moved To:", ifcModel.position);

//   // ✅ Move the camera here (inside the block)
//   camera.position.set(newPosition.x, newPosition.y, newPosition.z + 50);
//   camera.lookAt(newPosition);
//   console.log("🎥 Camera LookAt:", newPosition);
// });















































import {IFCLoader} from "web-ifc-three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from "three"
import mapboxgl from 'mapbox-gl';


const MAPBOX_TOKEN=import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken=MAPBOX_TOKEN
navigator.geolocation.getCurrentPosition(successLocation, errLoc, { enableHighAccuracy: true });

// const THREE = window.THREE;
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("/map-rendering/");

function successLocation(position){
    setupMap([position.coords.longitude, position.coords.latitude])
    addMarker(position.coords.longitude, position.coords.latitude)
}
function errLoc(error) {
    console.warn("Error getting location:", error.message);
    setupMap([-2.24, 53.38]);
}

function isCoordinates(input) {
    return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(input);
}

let pin=null
let map;
let ifcModel=null

// handling IFC model loading and rendering
document.getElementById("file-input").addEventListener("change", async (event)=>{
    const file = event.target.files[0];
    if(file){
      const url = URL.createObjectURL(file);
      loadIFCModel(url);
    }
  });
  
  async function loadIFCModel(url) {
      ifcLoader.load(url, async (model)=>{
        ifcModel = model;
        console.log("IFC Model Loaded:", model);

        if(pin){
          const {lng,lat} = pin.getLngLat();
          placeModelAtLocation([lng,lat]);
        }
      });
  }

function setupMap(center){
    map = new mapboxgl.Map({
        container:"map",
        style:"mapbox://styles/mapbox/streets-v12",
        zoom:17,
        center:center,
        pitch:60,
        antialias:true,
        maxBounds: getBoundsFromCenter(center, 50)
    })

    map.on("load", () => {
      console.log("Map fully loaded");
      map.addSource("mapbox-dem",{
        type:"raster-dem",
        url:"mapbox://mapbox.terrain-rgb",
        tileSize:256,
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
          "fill-extrusion-opacity": 0.6 ,
        },
        
      });
    });

    const nav= new mapboxgl.NavigationControl();
    const geolocate = new mapboxgl.GeolocateControl();
    map.addControl(nav,"top-right")
    map.addControl(geolocate,"top-right")
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation()

    map.on("click",(event)=>{
        const {lng, lat} = event.lngLat
        if(pin) pin.remove();
        pin = new mapboxgl.Marker({color:"red"})
        .setLngLat([lng,lat])
        .addTo(map)
        map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
        console.log("📍 Pinned Location: ",lng,lat);
    })



    document.getElementById("search").addEventListener("click",()=>{
        const ip= document.getElementById("locationInput").value.trim()
        if(!ip) return alert ("Please Enter a Location!")
        
        if(isCoordinates(ip)){
            const [lat,lng] =ip.split(",").map(Number);
            map.flyTo({center:[lng,lat], zoom:20})
        }else{
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ip)}.json?access_token=${MAPBOX_TOKEN}`)
              .then((response) => response.json())
              .then((data) =>{
                if (data.features.length === 0) {
                  alert("Location not found");
                  return;
                }
                const [lng,lat]=data.features[0].center;
                map.flyTo({ center:[lng,lat], zoom:20});
              })
              .catch(() => alert("Error fetching location"));
            }
    })
}
let renderer;
function placeModelAtLocation([lng,lat]){
    console.log("Adding Model", ifcModel);
    if (!ifcModel || !map) return;

    const modelOrigin = [lng,lat]
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
    );

    const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()*0.1
    };

    const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            this.map=map
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            // create two three.js lights to illuminate the model
            const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
            directionalLight.position.set(0, -70, 100).normalize();
            this.scene.add(directionalLight);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff,1);
            directionalLight2.position.set(0, 70, 100).normalize();
            this.scene.add(directionalLight2);

            if (ifcModel) {
                const box = new THREE.Box3().setFromObject(ifcModel);
                const center = box.getCenter(new THREE.Vector3());
                ifcModel.position.sub(center);
                this.scene.add(ifcModel);
            }

            // use the Mapbox GL JS map canvas for three.js
            this.renderer = new THREE.WebGLRenderer({
              // crossOrigin: 'anonymous',
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 1;
            this.controls.maxDistance = 100;
            this.controls.minPolarAngle = Math.PI / 2; 
            this.controls.maxPolarAngle = Math.PI / 2; 
    
        },
        render: function (gl, matrix) {
            const rotationX = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(1, 0, 0),
                modelTransform.rotateX
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                modelTransform.rotateY
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 0, 1),
                modelTransform.rotateZ
            );

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    modelTransform.translateX,
                    modelTransform.translateY,
                    modelTransform.translateZ
                )
                .scale(
                    new THREE.Vector3(
                        modelTransform.scale,
                        -modelTransform.scale,
                        modelTransform.scale
                    )
                )
                .multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.controls.update();

            this.map.triggerRepaint();
        }
    };

    if (map.getLayer("3d-model")) {
      map.removeLayer("3d-model");
    }
    map.addLayer(customLayer, "waterway-label");
    console.log("📍 Placing Model at:", lng, lat);
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
  placeModelAtLocation([lng,lat]);
});

window.addEventListener('resize', () => {
  if (map && map.getLayer("3d-model")) {
    map.triggerRepaint();
  }
});

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
  map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
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
  map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
}

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

function getBoundsFromCenter(center, radiusKm) {
    const latRadius = radiusKm / 111.2;
    const lngRadius = radiusKm / (111.2 * Math.cos(center[1] * Math.PI / 180));

    return [
        [center[0] - lngRadius, center[1] - latRadius],
        [center[0] + lngRadius, center[1] + latRadius]
    ];
}


