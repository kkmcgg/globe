
// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000001, 1000);

// Factor by which to increase the canvas size
const scaleFactor = 2;

// Create the renderer at a higher resolution
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth * scaleFactor, window.innerHeight * scaleFactor);

// Scale down the canvas element to fit the display size
renderer.domElement.style.width = `${window.innerWidth}px`;
renderer.domElement.style.height = `${window.innerHeight}px`;
document.getElementById('container').appendChild(renderer.domElement);

// Load the WMS texture and create a sphere
const wmsUrl = "https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer?request=GetMap&service=WMS&version=1.1.1&layers=0&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512"; 


const wmsUrl2 = "https://sedac.ciesin.columbia.edu/geoserver/wms?request=GetMap&service=WMS&version=1.1.1&layers=gpw-v3:gpw-v3-population-density_2000&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512";
// const wmsUrl2 = "https://data.ventusky.com/2024/04/26/stofs/whole_world/hour_22/stofs_tide_20240426_22.jpg?";

// Load the two textures
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load(wmsUrl);
const texture2 = textureLoader.load(wmsUrl2);

// Create a ShaderMaterial
const material = new THREE.ShaderMaterial({
  uniforms: {
    texture1: { value: texture1 },
    texture2: { value: texture2 }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    varying vec2 vUv;

    void main() {
      vec4 color1 = texture2D(texture1, vUv);
      vec4 color2 = texture2D(texture2, vUv);
      // gl_FragColor = (color1 * color2) * 4.0;
      gl_FragColor = (color1 + color2) * 0.5;
    }
  `
});

// Create a sphere with the ShaderMaterial
const geometry = new THREE.SphereGeometry(1, 32, 32);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

/// Create a circular texture
const canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 64;
const context = canvas.getContext('2d');
context.fillStyle = 'red';
context.beginPath();
context.arc(32, 32, 32, 0, 2 * Math.PI, false);
context.fill();

// Create a texture from the canvas
const dotTexture = new THREE.Texture(canvas);
dotTexture.needsUpdate = true;

// Add coordinates as points
const pointMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05, map: dotTexture, transparent: true, alphaTest: 0.5 });
const pointsGeometry = new THREE.BufferGeometry();
const positions = [0, 0, 0]; 
pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const points = new THREE.Points(pointsGeometry, pointMaterial);
scene.add(points);

// Assuming scene is your THREE.Scene
scene.fog = new THREE.Fog(0xffffff, 0, 15); // Set the far distance to 500

// Position the camera
camera.position.z = 3;

// Text overlay for coordinates
const coordDiv = document.createElement('div');
coordDiv.style.position = 'absolute';
coordDiv.style.top = '10px';
coordDiv.style.left = '10px';
coordDiv.style.color = 'white';
document.body.appendChild(coordDiv);

// Initialize a raycaster and a vector to hold the mouse position
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listeners for rotation and clicking
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener('mousedown', e => { 
  isDragging = true; 
  previousMousePosition = { x: e.clientX, y: e.clientY };

  // Handle the click to place a point
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([sphere]);
  if(intersects.length > 0) {
    const point = intersects[0].point;

    // Assuming addLength is the amount you want to add to the length of the point
    const addLength = .01;
    const originalLength = point.length();
    point.normalize().multiplyScalar(originalLength + addLength);


    const matrixInv = new THREE.Matrix4().copy(sphere.matrixWorld).invert();
		point.applyMatrix4(matrixInv);
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute([point.x, point.y, point.z], 3));
    pointsGeometry.attributes.position.needsUpdate = true;  
    coordDiv.innerHTML = `Coordinates: <br>Point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`;
  }
});

document.addEventListener('mouseup', () => { isDragging = false; });

document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([sphere]);

  if (intersects.length > 0) {
    const { x, y, z } = intersects[0].point;
    coordDiv.innerHTML = `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})` + coordDiv.innerHTML.substr(coordDiv.innerHTML.indexOf('<br>'));
  }

  if (isDragging) {
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };

    // const panFactor = 0.005; 
    // let panFactor = camera.position.z / 1000
    let panFactor  = Math.sqrt(camera.position.z-1)/1000;



    sphere.rotation.y += deltaMove.x * panFactor;
    sphere.rotation.x += deltaMove.y * panFactor;
    points.rotation.y += deltaMove.x * panFactor;
    points.rotation.x += deltaMove.y * panFactor;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
// Event listener for mouse wheel or touchpad scroll
document.addEventListener('wheel', e => {
  // Calculate the zoom factor based on the scroll delta
  let zoomFactor = Math.sign(e.deltaY) > 0 ? 1.1 : 0.9;

  // smooth zoom factor by camera position z
  zoomFactor = Math.pow(zoomFactor, camera.position.z/5);

  //log camera position
  console.log(`Z:${camera.position.z.toFixed(2)}, zoomFactor:${zoomFactor}`);

  // Adjust the camera position and update the zoom level
  let zoomto = camera.position.z;
  zoomto *= zoomFactor;
  if (zoomto >=1.0 && zoomto <= 10) {
    camera.position.z = zoomto;
  }
  // camera.position.z *= zoomFactor;
  camera.updateProjectionMatrix();
  coordDiv.innerHTML = `Z:${camera.position.z.toFixed(2)}` + coordDiv.innerHTML.substr(coordDiv.innerHTML.indexOf('<br>'));
});



animate();
