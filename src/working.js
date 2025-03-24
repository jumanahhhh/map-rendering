// import {IFCLoader} from "web-ifc-three"
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import * as THREE from "three"
// import mapboxgl from 'mapbox-gl'

// // Check WebGL support
// function checkWebGLSupport() {
//   try {
//     const canvas = document.createElement('canvas');
//     return !!(window.WebGLRenderingContext && 
//              (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
//   } catch(e) {
//     return false;
//   }
// }

// if (!checkWebGLSupport()) {
//   alert('WebGL is not supported or enabled in your browser. Please enable WebGL or try a different browser.');
// }

// // Check specifically for Chrome WebGL issues
// function checkChromeWebGLIssues() {
//   const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  
//   if (isChrome) {
//     console.log("Running in Chrome, checking for WebGL issues...");
    
//     // Check if hardware acceleration is potentially disabled
//     const canvas = document.createElement('canvas');
//     const gl = canvas.getContext('webgl');
    
//     if (gl) {
//       const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
//       if (debugInfo) {
//         const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
//         console.log("WebGL renderer:", renderer);
        
//         // Check for software rendering indicators
//         if (renderer.includes('SwiftShader') || 
//             renderer.includes('Software') || 
//             renderer.includes('ANGLE') ||
//             renderer.includes('llvmpipe')) {
//           console.warn("Chrome appears to be using software rendering, which may cause performance issues");
//           // Consider showing a warning to the user
//         }
//       }
//     }
//   }
// }

// // Run the Chrome-specific check
// checkChromeWebGLIssues();

// // Global error handler for debugging
// window.addEventListener('error', function(event) {
//   console.error('Global error caught:', event.error || event.message);
//   // If error appears to be WebGL related
//   if ((event.error && event.error.toString().includes('WebGL')) || 
//       (event.message && event.message.includes('WebGL'))) {
//     alert('A WebGL error occurred. This might be browser-specific. Please try a different browser or check your graphics drivers.');
//   }
// }, false);

// // Make sure the token is always available even if env variable isn't set
// // NOTE: You need to replace this with your own valid Mapbox token
// // The token shown below is invalid/unauthorized
// console.log("Environment variables available:", import.meta.env);
// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
// console.log("Mapbox token from env:", MAPBOX_TOKEN);

// // If token is not available from env, use a hardcoded one (for development only)
// // In production, always use environment variables
// const DEFAULT_TOKEN = 'pk.eyJ1Ijoia2VzaGF2MDAyIiwiYSI6ImNtOGpzMThiajBteHYyaXNmc3l2OG85cGUifQ.CBmSz1ftagFV57kQpRF0mg';
// const finalToken = MAPBOX_TOKEN || DEFAULT_TOKEN;

// if (!finalToken) {
//   console.error("Mapbox token not found. Please add a valid token to your .env file.");
//   alert("Map cannot be loaded: Missing access token. Please check the console for details.");
// } else {
//   console.log("Using Mapbox token: ", finalToken.substring(0, 10) + '...');
// }

// // After setting mapboxgl.accessToken but before using it
// mapboxgl.accessToken = finalToken;

// // Show initial loading message
// document.getElementById("map").innerHTML = `
//   <div style="color: white; padding: 20px; text-align: center;">
//     <div class="spinner" style="margin: 0 auto;"></div>
//     <h3>Initializing map...</h3>
//     <p>Loading resources</p>
//   </div>
// `;

// // Skip validation and start directly with geolocation
// console.log("Starting geolocation to initialize map...");
// navigator.geolocation.getCurrentPosition(successLocation, errLoc, { enableHighAccuracy: true });

// // Check if we're in a development environment
// const isDevelopment = window.location.hostname === 'localhost' || 
//                    window.location.hostname === '127.0.0.1';

// // Log environment info for debugging
// console.log(`Running in ${isDevelopment ? 'development' : 'production'} environment`);
// console.log(`Current URL: ${window.location.href}`);

// const ifcLoader = new IFCLoader();
// // Try different potential paths for the WASM file based on environment
// if (isDevelopment) {
//   // In development, try a direct path to the WASM file
//   console.log("Setting development WASM path");
//   ifcLoader.ifcManager.setWasmPath("./");
// } else {
//   // In production, use the base URL
//   console.log("Setting production WASM path");
//   ifcLoader.ifcManager.setWasmPath("/map-rendering/");
// }

// // After the WASM path setting but before the successLocation function
// // Add explicit check for WASM file availability
// fetch(isDevelopment ? './web-ifc.wasm' : '/map-rendering/web-ifc.wasm')
//   .then(response => {
//     if (response.ok) {
//       console.log('✅ WASM file is accessible at the configured path');
//     } else {
//       console.error('❌ WASM file not found at the configured path. Status:', response.status);
//     }
//   })
//   .catch(error => {
//     console.error('Error checking WASM file:', error);
//   });

// function successLocation(position){
//     console.log("Got location:", position.coords);
//     setupMap([position.coords.longitude, position.coords.latitude])
//     addMarker(position.coords.longitude, position.coords.latitude)
// }
// function errLoc(error) {
//     console.warn("Error getting location:", error.message);
//     // Provide a default location and set up the map
//     setupMap([-2.24, 53.38]);
//     addMarker(-2.24, 53.38, "Default Location");
// }

// function isCoordinates(input) {
//     return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(input);
// }

// let pin=null
// let map;
// let ifcModel=null

// function getModelDimensions(model) {
//   const box = new THREE.Box3().setFromObject(model);
//   const size = new THREE.Vector3();
//   box.getSize(size);

//   console.log("📏 Model Dimensions:");
//   console.log(`Width: ${size.x.toFixed(2)} meters`);
//   console.log(`Height: ${size.y.toFixed(2)} meters`);
//   console.log(`Depth: ${size.z.toFixed(2)} meters`);

//   return size;
// }

// // handling IFC model loading and rendering
// document.getElementById("file-input").addEventListener("change", async (event)=>{
//     const file = event.target.files[0];
//     if(file){
//       console.log("File selected:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2) + "MB", "Type:", file.type);
//       showLoader();
//       const url = URL.createObjectURL(file);
//       try {
//         console.log("Attempting to load IFC model from blob URL:", url);
//         await loadIFCModel(url);
//       } catch (error) {
//         console.error("Error loading IFC model:", error);
//         alert("Error loading IFC model: " + error.message);
//       } finally {
//         hideLoader();
//       }
//     }
//   });
  
//   async function loadIFCModel(url) {
//       return new Promise((resolve, reject) => {
//         ifcLoader.load(url, (model) => {
//           ifcModel = model;
//           console.log("IFC Model Loaded:", model);
//           getModelDimensions(ifcModel);
//           if(pin){
//             const {lng,lat} = pin.getLngLat();
//             placeModelAtLocation([lng,lat]);
//           }
//           resolve(model);
//         }, 
//         // onProgress callback
//         (progress) => {
//           console.log("Loading progress:", progress);
//         },
//         // onError callback
//         (error) => {
//           console.error("Error loading IFC:", error);
//           let errorMessage = error.message || "Unknown error";
          
//           // Check for Chrome-specific wasm issues
//           if (errorMessage.includes('wasm') || errorMessage.includes('WebAssembly')) {
//             const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
//             if (isChrome) {
//               errorMessage += "\n\nChrome-specific troubleshooting:\n" +
//                 "1. Try enabling all insecure content for this site\n" +
//                 "2. Try using a different browser like Firefox or Edge\n" +
//                 "3. Check chrome://settings/content/siteDetails?site=YOUR_SITE to allow file access";
//             }
//           }
          
//           reject(new Error(errorMessage));
//         });
//       });
//   }

// function setupMap(center){
//     try {
//         map = new mapboxgl.Map({
//             container:"map",
//             style:"mapbox://styles/mapbox/streets-v12",
//             zoom:17,
//             center:center,
//             pitch:60,
//             antialias:true,
//             maxBounds: getBoundsFromCenter(center, 50)
//         });

//         map.on("error", (e) => {
//             console.error("Mapbox map error:", e.error);
//             document.getElementById("map").innerHTML = `
//                 <div style="color: white; padding: 20px; text-align: center;">
//                     <h3>Map loading error</h3>
//                     <p>There was a problem loading the map. Please check your Mapbox access token.</p>
//                     <p>Error: ${e.error.message || 'Unknown error'}</p>
//                 </div>
//             `;
//         });

//         // map.on("load", () => {
//         //     console.log("Map fully loaded");
//         //     map.addSource("mapbox-dem",{
//         //         type:"raster-dem",
//         //         url:"mapbox://mapbox.terrain-rgb",
//         //         tileSize:256,
//         //     });

//         //     map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
//         //     //3D Buildings
//         //     map.addLayer({
//         //         id: "3d-buildings",
//         //         source: "composite",
//         //         "source-layer": "building",
//         //         type: "fill-extrusion",
//         //         minzoom: 10,
//         //         paint: {
//         //             "fill-extrusion-color": "#aaa",
//         //             "fill-extrusion-height": ["get", "height"],
//         //             "fill-extrusion-base": ["get", "min_height"],
//         //             "fill-extrusion-opacity": 0.6 ,
//         //         },
//         //     });
//         // });

//         const nav= new mapboxgl.NavigationControl();
//         const geolocate = new mapboxgl.GeolocateControl();
//         map.addControl(nav,"top-right")
//         map.addControl(geolocate,"top-right")
//         map.dragRotate.enable();
//         map.touchZoomRotate.enableRotation()

//         map.on("click",(event)=>{
//             // Get the exact coordinates of the click
//             const {lng, lat} = event.lngLat;
//             console.log("Map clicked at:", lng, lat);
            
//             // Remove existing marker
//             if(pin) pin.remove();
            
//             // Create a simple DOM element for the marker (more control than Mapbox marker)
//             const el = document.createElement('div');
//             el.className = 'custom-marker';
//             el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
//             el.style.width = '32px';
//             el.style.height = '40px';
//             el.style.backgroundSize = '100%';
//             el.style.borderStyle = 'none';
//             el.style.cursor = 'pointer';
//             // Position the pin point (not the center) at the exact coordinates
//             el.style.transform = 'translate(-50%, -100%)';
            
//             // Add the marker at the exact click coordinates
//             pin = new mapboxgl.Marker({
//                 element: el,
//                 anchor: 'bottom', // Bottom of the marker is at the exact coordinates
//                 offset: [0, 0]    // No offset
//             })
//             .setLngLat([lng, lat])
//             .addTo(map);
            
//             // Store the exact coordinates for reference
//             pin.originalCoords = {lng, lat};
//             console.log("📍 Pin created at:", lng, lat);
            
//             // Store a DOM reference to make it easier to update
//             pin.element = el;
            
//             // Set the bounds based on the pin location
//             map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
            
//             // Update model position if model exists
//             if(ifcModel) {
//                 placeModelAtLocation([lng, lat]);
//             }
//         })

//         document.getElementById("search").addEventListener("click",()=>{
//             const ip= document.getElementById("locationInput").value.trim()
//             if(!ip) return alert ("Please Enter a Location!")
            
//             if(isCoordinates(ip)){
//                 const [lat,lng] =ip.split(",").map(Number);
//                 map.flyTo({center:[lng,lat], zoom:20})
//             }else{
//                 fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ip)}.json?access_token=${finalToken}`)
//                   .then((response) => response.json())
//                   .then((data) =>{
//                     if (data.features.length === 0) {
//                       alert("Location not found");
//                       return;
//                     }
//                     const [lng,lat]=data.features[0].center;
//                     map.flyTo({ center:[lng,lat], zoom:20});
//                   })
//                   .catch(() => alert("Error fetching location"));
//                 }
//         })

//         // After map setup, add this to monitor map movements
//         map.on('moveend', () => {
//           // After the map has moved (pan/zoom), ensure the pin is still at the correct location
//           if (pin && pin.originalCoords) {
//             const currentLocation = pin.getLngLat();
//             const originalLocation = pin.originalCoords;
            
//             // If there's significant drift, reposition the pin
//             if (Math.abs(currentLocation.lng - originalLocation.lng) > 0.0000001 ||
//                 Math.abs(currentLocation.lat - originalLocation.lat) > 0.0000001) {
//               console.log("Pin drift detected, recalibrating position");
//               pin.setLngLat([originalLocation.lng, originalLocation.lat]);
//             }
            
//             // If an IFC model is present, ensure it stays with the pin
//             if (ifcModel && map.getLayer('3d-model')) {
//               // Only reposition if there was drift
//               if (Math.abs(currentLocation.lng - originalLocation.lng) > 0.0000001 ||
//                   Math.abs(currentLocation.lat - originalLocation.lat) > 0.0000001) {
//                 placeModelAtLocation([originalLocation.lng, originalLocation.lat]);
//               }
//             }
//           }
//         });
//     } catch (error) {
//         console.error("Error setting up map:", error);
//         document.getElementById("map").innerHTML = `
//             <div style="color: white; padding: 20px; text-align: center;">
//                 <h3>Map setup error</h3>
//                 <p>There was a problem setting up the map. Please check your Mapbox access token.</p>
//                 <p>Error: ${error.message || 'Unknown error'}</p>
//             </div>
//         `;
//     }
// }
// let renderer;
// let modelScale = 1.0;
// let modelRotationY = 0; 
// document.getElementById("scaleSlider").addEventListener("input", (event) => {
//     modelScale = parseFloat(event.target.value);
//     if (map.getLayer("3d-model")) {
//         map.triggerRepaint();
//     }
// });
// document.getElementById("rotateSlider").addEventListener("input", (event) => {
//   modelRotationY = parseFloat(event.target.value) * (Math.PI / 180); // Convert degrees to radians
//   if (map.getLayer("3d-model")) {
//       map.triggerRepaint();
//   }
// });
// document.getElementById("resetButton").addEventListener("click", () => {
//   modelScale = 1.0
//   modelRotationY = 0 
//   document.getElementById("scaleSlider").value = modelScale;
//   document.getElementById("rotateSlider").value = modelRotationY;

//   if (map.getLayer("3d-model")) {
//       map.triggerRepaint();
//   }
// });

// function placeModelAtLocation([lng, lat]) {
//     console.log("Adding Model", ifcModel);
//     if (!ifcModel || !map) {
//         console.error("Cannot place model: model or map is not loaded");
//         return;
//     }

//     const modelOrigin = [lng, lat];
//     const modelAltitude = 10; // Place model on the surface (was 50)
//     const modelRotate = [Math.PI / 2, 0, 0];

//     const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
//         modelOrigin,
//         modelAltitude
//     );

//     console.log("Model Mercator coordinates:", modelAsMercatorCoordinate);

//     const modelTransform = {
//         translateX: modelAsMercatorCoordinate.x,
//         translateY: modelAsMercatorCoordinate.y,
//         translateZ: modelAsMercatorCoordinate.z,
//         rotateX: modelRotate[0],
//         rotateY: modelRotate[1],
//         rotateZ: modelRotate[2],
//         scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScale
//     };

//     console.log("Model transform:", modelTransform);

//     const customLayer = {
//         id: '3d-model',
//         type: 'custom',
//         renderingMode: '3d',
//         onAdd: function (map, gl) {
          
//             this.map = map;
//             this.camera = new THREE.Camera();
//             this.scene = new THREE.Scene();

//             // Add ambient light to provide base illumination from all directions
//             const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//             this.scene.add(ambientLight);

//             // Keep existing directional lights
//             const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//             directionalLight.position.set(0, -70, 100).normalize();
//             this.scene.add(directionalLight);

//             const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
//             directionalLight2.position.set(0, 70, 100).normalize();
//             this.scene.add(directionalLight2);
            
//             // Add more directional lights from different angles
//             const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.7);
//             directionalLight3.position.set(100, 0, 0).normalize();
//             this.scene.add(directionalLight3);
            
//             const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.7);
//             directionalLight4.position.set(-100, 0, 0).normalize();
//             this.scene.add(directionalLight4);
            
//             const directionalLight5 = new THREE.DirectionalLight(0xffffff, 0.7);
//             directionalLight5.position.set(0, 0, -100).normalize();
//             this.scene.add(directionalLight5);

//             const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
//             this.scene.add(hemisphereLight);

//             if (ifcModel) {
//                 try {
//                     console.log("Adding IFC model to scene:", ifcModel);
//                     const box = new THREE.Box3().setFromObject(ifcModel);
//                     const center = box.getCenter(new THREE.Vector3());
                    
//                     // Log model bounding box info for debugging
//                     console.log("Model bounding box:", {
//                         min: box.min,
//                         max: box.max,
//                         size: box.getSize(new THREE.Vector3()),
//                         center: center
//                     });
                    
//                     // Center the model properly
//                     ifcModel.position.sub(center);
                    
//                     // Position the model to sit on the terrain properly
//                     // Move the model down by half its height to place its bottom at ground level
//                     const size = box.getSize(new THREE.Vector3());
//                     ifcModel.position.y += size.y / 2;
                    
//                     // Make sure model is visible with proper material settings
//                     ifcModel.visible = true;
                    
//                     // If the model uses materials with transparency, ensure they're set up correctly
//                     if (Array.isArray(ifcModel.material)) {
//                         ifcModel.material.forEach(mat => {
//                             if (mat.transparent) {
//                                 mat.opacity = 1.0; // Make sure transparent materials are visible
//                             }
//                         });
//                     }
                    
//                     this.scene.add(ifcModel);
//                     console.log("IFC model added to scene successfully");
                    
//                     // Add a helper box to visualize the model's bounds
//                     const helper = new THREE.Box3Helper(box, 0xff0000);
//                     this.scene.add(helper);
                    
//                 } catch (error) {
//                     console.error("Error adding IFC model to scene:", error);
//                 }
//             } else {
//                 console.error("No IFC model available to add to scene");
//             }

//             this.renderer = new THREE.WebGLRenderer({
//                 canvas: map.getCanvas(),
//                 context: gl,
//                 antialias: true
//             });
//             this.renderer.autoClear = false;
//             this.controls = new OrbitControls(this.camera, this.renderer.domElement);
//             this.controls.enableDamping = true;
//         },
//         render: function (gl, matrix) {
//           // Correct scaling for real-world size
//           modelTransform.scale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScale;
//           modelTransform.rotateY = modelRotationY; // Update Y-axis rotation
          
//           // Log rendering information once (for debugging)
//           if (!this.hasLoggedRenderInfo) {
//             console.log("Rendering model with transform:", {
//               scale: modelTransform.scale,
//               translateX: modelTransform.translateX,
//               translateY: modelTransform.translateY,
//               translateZ: modelTransform.translateZ,
//               rotateX: modelTransform.rotateX,
//               rotateY: modelTransform.rotateY,
//               rotateZ: modelTransform.rotateZ
//             });
            
//             // Calculate approx size in pixels for debugging
//             const pixelSize = modelTransform.scale * 100; // Rough estimate
//             console.log(`Estimated model pixel size at current zoom: ~${pixelSize.toFixed(2)}px`);
            
//             this.hasLoggedRenderInfo = true;
//           }

//           const rotationX = new THREE.Matrix4().makeRotationAxis(
//             new THREE.Vector3(1, 0, 0), 
//             modelTransform.rotateX
//           );
//           const rotationY = new THREE.Matrix4().makeRotationAxis(
//             new THREE.Vector3(0, 1, 0), 
//             modelTransform.rotateY
//           );
//           const rotationZ = new THREE.Matrix4().makeRotationAxis(
//             new THREE.Vector3(0, 0, 1), 
//             modelTransform.rotateZ
//           );

//           const m = new THREE.Matrix4().fromArray(matrix);
//           const l = new THREE.Matrix4()
//               .makeTranslation(
//                 modelTransform.translateX, 
//                 modelTransform.translateY, 
//                 modelTransform.translateZ
//               )
//               .scale(
//                 new THREE.Vector3(
//                   modelTransform.scale, 
//                   -modelTransform.scale,  // Note the negative scale for Y to match Mapbox orientation 
//                   modelTransform.scale
//                 )
//               )
//               .multiply(rotationX)
//               .multiply(rotationY)
//               .multiply(rotationZ);

//           this.camera.projectionMatrix = m.multiply(l);
          
//           // Ensure THREE.js scene renders properly with the map
//           this.renderer.resetState();
//           this.renderer.render(this.scene, this.camera);
          
//           this.controls.update();
//           this.map.triggerRepaint();
//       }
//     };

//     if (map.getLayer("3d-model")) {
//         map.removeLayer("3d-model");
//     }
    
//     // Add the layer at the top of the layer stack to ensure it appears above all other map elements
//     // Note that previously it was added above 'waterway-label'
//     map.addLayer(customLayer);

//     console.log("📍 Placing Model at:", lng, lat);
// }

// // place Model at Pinned Location
// document.getElementById("placeModelButton").addEventListener("click", () => {
//   if(!pin){
//     alert("Please pin a location first!");
//     return;
//   }
//   if(!ifcModel){
//     alert("Upload an IFC file first!");
//     return;
//   }
//   const {lng,lat} =pin.getLngLat();
//   placeModelAtLocation([lng,lat]);
// });

// window.addEventListener('resize', () => {
//   if (map && map.getLayer("3d-model")) {
//     map.triggerRepaint();
//   }
// });

// // Search suggestions for searching
// const suggestionsList = document.getElementById("suggestions")
// const locationInput = document.getElementById("locationInput");

// locationInput.addEventListener("input", async ()=>{
//   const ip = locationInput.value
//   if(ip.length <3){
//     suggestionsList.innerHTML=""
//     return;
//   }
//   const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${ip}.json?access_token=${finalToken}&autocomplete=true&limit=5`;
//   const response = await fetch(url);
//   const data = await response.json();

//   suggestionsList.innerHTML = "";
//   data.features.forEach((place) => {
//       const li = document.createElement("li");
//       li.textContent = place.place_name;
//       li.addEventListener("click", () => selectLocation(place));
//       suggestionsList.appendChild(li);
//   });
// })

// function selectLocation(place) {
//   const [lng,lat] =place.center;
//   map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
//   map.flyTo({center:[lng,lat], zoom:17});
//   locationInput.value = place.place_name;
//   suggestionsList.innerHTML = "";
//   addMarker(lng, lat);
// }

// function addMarker(lng, lat, name) {
//   if(pin){pin.remove()}
  
//   // Create a custom marker element
//   const el = document.createElement('div');
//   el.className = 'custom-marker';
//   el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
//   el.style.width = '32px';
//   el.style.height = '40px';
//   el.style.backgroundSize = '100%';
//   el.style.borderStyle = 'none';
//   el.style.cursor = 'pointer';
//   el.style.transform = 'translate(-50%, -100%)';
  
//   pin = new mapboxgl.Marker({
//     element: el,
//     anchor: 'bottom',
//     offset: [0, 0]
//   }).setLngLat([lng, lat]);
  
//   // Add popup if name is provided
//   if (name) {
//     pin.setPopup(new mapboxgl.Popup().setText(name));
//   }
  
//   pin.addTo(map);
//   pin.element = el;
//   pin.originalCoords = {lng, lat};
  
//   map.setMaxBounds(getBoundsFromCenter([lng, lat], 50));
//   console.log("Marker added at:", lng, lat);
// }

// const timeLoader = document.getElementById("loader");
// const fileInput = document.getElementById("file-input");
// function showLoader(){
//   timeLoader.style.display ="flex";
// }

// function hideLoader(){
//   timeLoader.style.display ="none";
// }

// function getBoundsFromCenter(center, radiusKm) {
//     const latRadius = radiusKm / 111.2;
//     const lngRadius = radiusKm / (111.2 * Math.cos(center[1] * Math.PI / 180));

//     return [
//         [center[0] - lngRadius, center[1] - latRadius],
//         [center[0] + lngRadius, center[1] + latRadius]
//     ];
// }




import {IFCLoader} from "web-ifc-three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from "three"
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN=import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken=MAPBOX_TOKEN
navigator.geolocation.getCurrentPosition(successLocation, errLoc, { enableHighAccuracy: true });

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

function getModelDimensions(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  console.log("📏 Model Dimensions:");
  console.log(`Width: ${size.x.toFixed(2)} meters`);
  console.log(`Height: ${size.y.toFixed(2)} meters`);
  console.log(`Depth: ${size.z.toFixed(2)} meters`);

  return size;
}

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
        getModelDimensions(ifcModel)
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
let modelScale = 0.1; // Default scale
let modelRotationY = 0; 
document.getElementById("scaleSlider").addEventListener("input", (event) => {
    modelScale = parseFloat(event.target.value);
    if (map.getLayer("3d-model")) {
        map.triggerRepaint(); // Redraw the model with new scale
    }
});
document.getElementById("rotateSlider").addEventListener("input", (event) => {
  modelRotationY = parseFloat(event.target.value) * (Math.PI / 180); // Convert degrees to radians
  if (map.getLayer("3d-model")) {
      map.triggerRepaint(); // Redraw the model with new rotation
  }
});
document.getElementById("resetButton").addEventListener("click", () => {
  modelScale = 0.1; // Reset scale
  modelRotationY = 0; // Reset rotation

  // Reset UI elements if needed
  document.getElementById("scaleSlider").value = modelScale;
  document.getElementById("rotateSlider").value = modelRotationY;

  if (map.getLayer("3d-model")) {
      map.triggerRepaint(); // Redraw model with original values
  }
});

function placeModelAtLocation([lng, lat]) {
    console.log("Adding Model", ifcModel);
    if (!ifcModel || !map) return;

    const modelOrigin = [lng, lat];
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
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScale
    };

    const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            this.map = map;
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, -70, 100).normalize();
            this.scene.add(directionalLight);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight2.position.set(0, 70, 100).normalize();
            this.scene.add(directionalLight2);

            if (ifcModel) {
                const box = new THREE.Box3().setFromObject(ifcModel);
                const center = box.getCenter(new THREE.Vector3());
                ifcModel.position.sub(center);
                this.scene.add(ifcModel);
            }

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
        },
        render: function (gl, matrix) {
          modelTransform.scale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScale;
          modelTransform.rotateY = modelRotationY; // Update Y-axis rotation

          const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
          const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
          const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);

          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
              .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
              .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
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


