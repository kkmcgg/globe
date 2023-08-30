// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Create a sphere
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x0088ff, wireframe: true });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Add coordinates as points
const pointMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 });
const pointsGeometry = new THREE.BufferGeometry();
const positions = [0, 0, 0]; // Initialize with a single point at the origin
pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const points = new THREE.Points(pointsGeometry, pointMaterial);
scene.add(points);

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
});

document.addEventListener('mouseup', () => { isDragging = false; });

document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([sphere]);

  if (intersects.length > 0) {
    const { x, y, z } = intersects[0].point;
    coordDiv.innerHTML = `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
  }

  if (isDragging) {
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };

    sphere.rotation.y += deltaMove.x * 0.005;
    sphere.rotation.x += deltaMove.y * 0.005;
    points.rotation.y += deltaMove.x * 0.005;
    points.rotation.x += deltaMove.y * 0.005;

    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
