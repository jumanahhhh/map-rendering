// import { IFCLoader } from "web-ifc-three";

// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
// mapboxgl.accessToken = MAPBOX_TOKEN;
//     const map = new mapboxgl.Map({
//         container: 'map',
//         // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
//         style: 'mapbox://styles/mapbox/light-v11',
//         zoom: 18,
//         center: [148.9819, -35.3981],
//         pitch: 60,
//         antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
//     });

//     // parameters to ensure the model is georeferenced correctly on the map
//     const modelOrigin = [148.9819, -35.39847];
//     const modelAltitude = 0;
//     const modelRotate = [Math.PI / 2, 0, 0];

//     const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
//         modelOrigin,
//         modelAltitude
//     );

//     // transformation parameters to position, rotate and scale the 3D model onto the map
//     const modelTransform = {
//         translateX: modelAsMercatorCoordinate.x,
//         translateY: modelAsMercatorCoordinate.y,
//         translateZ: modelAsMercatorCoordinate.z,
//         rotateX: modelRotate[0],
//         rotateY: modelRotate[1],
//         rotateZ: modelRotate[2],
//         /* Since the 3D model is in real world meters, a scale transform needs to be
//          * applied since the CustomLayerInterface expects units in MercatorCoordinates.
//          */
//         scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
//     };

//     const THREE = window.THREE;
//     const ifcLoader = new IFCLoader();
//     ifcLoader.ifcManager.setWasmPath("/");
//     // configuration of the custom layer for a 3D model per the CustomLayerInterface
//     const customLayer = {
//         id: '3d-model',
//         type: 'custom',
//         renderingMode: '3d',
//         onAdd: function (map, gl) {
//             this.camera = new THREE.Camera();
//             this.scene = new THREE.Scene();

//             // create two three.js lights to illuminate the model
//             const directionalLight = new THREE.DirectionalLight(0xffffff);
//             directionalLight.position.set(0, -70, 100).normalize();
//             this.scene.add(directionalLight);

//             const directionalLight2 = new THREE.DirectionalLight(0xffffff);
//             directionalLight2.position.set(0, 70, 100).normalize();
//             this.scene.add(directionalLight2);

//             // use the three.js GLTF loader to add the 3D model to the three.js scene
//             // const loader = new THREE.GLTFLoader();
//             // loader.load(
//             //     '/model/result.gltf',
//             //     (gltf) => {
//             //         this.scene.add(gltf.scene);
//             //     }
//             // );

//             ifcLoader.load('/ifc_model.ifc', (ifcModel) => {
//                 this.scene.add(ifcModel);
//             });

//             this.map = map;

//             // use the Mapbox GL JS map canvas for three.js
//             this.renderer = new THREE.WebGLRenderer({
//                 canvas: map.getCanvas(),
//                 context: gl,
//                 antialias: true
//             });

//             this.renderer.autoClear = false;
//         },
//         render: function (gl, matrix) {
//             const rotationX = new THREE.Matrix4().makeRotationAxis(
//                 new THREE.Vector3(1, 0, 0),
//                 modelTransform.rotateX
//             );
//             const rotationY = new THREE.Matrix4().makeRotationAxis(
//                 new THREE.Vector3(0, 1, 0),
//                 modelTransform.rotateY
//             );
//             const rotationZ = new THREE.Matrix4().makeRotationAxis(
//                 new THREE.Vector3(0, 0, 1),
//                 modelTransform.rotateZ
//             );

//             const m = new THREE.Matrix4().fromArray(matrix);
//             const l = new THREE.Matrix4()
//                 .makeTranslation(
//                     modelTransform.translateX,
//                     modelTransform.translateY,
//                     modelTransform.translateZ
//                 )
//                 .scale(
//                     new THREE.Vector3(
//                         modelTransform.scale,
//                         -modelTransform.scale,
//                         modelTransform.scale
//                     )
//                 )
//                 .multiply(rotationX)
//                 .multiply(rotationY)
//                 .multiply(rotationZ);

//             this.camera.projectionMatrix = m.multiply(l);
//             this.renderer.resetState();
//             this.renderer.render(this.scene, this.camera);
//             this.map.triggerRepaint();
//         }
//     };

//     map.on('style.load', () => {
//         map.addLayer(customLayer, 'waterway-label');
//     });



import {IFCLoader} from "web-ifc-three"

const MAPBOX_TOKEN=import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken=MAPBOX_TOKEN
navigator.geolocation.getCurrentPosition(successLocation, errLoc, { enableHighAccuracy: true });

const THREE = window.THREE;
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
let currentRotationY = 0;
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

      // Reset rotation when new model is loaded
      currentRotationY = 0;
      rotationSlider.value = "0";
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
        rotateX: 0,
        rotateY: THREE.MathUtils.degToRad(currentRotationY),
        rotateZ: 0,
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
    };

    const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            // create two three.js lights to illuminate the model
            const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
            directionalLight.position.set(0, -70, 100).normalize();
            this.scene.add(directionalLight);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff,1);
            directionalLight2.position.set(0, 70, 100).normalize();
            this.scene.add(directionalLight2);

            // Store the rotation value in the layer
            this.modelRotationY = currentRotationY;

            if (ifcModel) {
                const box = new THREE.Box3().setFromObject(ifcModel);
                const center = box.getCenter(new THREE.Vector3());
                ifcModel.position.sub(center);
                
                // Apply initial rotation
                ifcModel.rotation.x = THREE.MathUtils.degToRad(this.modelRotationY);
                
                this.scene.add(ifcModel);
            }

            // use the Mapbox GL JS map canvas for three.js
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
          // Update model rotation dynamically
          if (ifcModel) {
              ifcModel.rotation.x = THREE.MathUtils.degToRad(currentRotationY);
          }
      
          const rotationX = new THREE.Matrix4().makeRotationAxis(
              new THREE.Vector3(1, 0, 0),
              modelTransform.rotateX
          );
          const rotationY = new THREE.Matrix4().makeRotationAxis(
              new THREE.Vector3(0, 1, 0),
              THREE.MathUtils.degToRad(currentRotationY)
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
  if (map && renderer) {
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

