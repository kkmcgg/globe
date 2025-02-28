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

// Load the WMS texture
const wmsUrl = "https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer?request=GetMap&service=WMS&version=1.1.1&layers=0&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512";

const textureLoader = new THREE.TextureLoader();
textureLoader.load(wmsUrl, function (texture) {
    // Create points forming a sphere
    const pointsGeometry = new THREE.SphereGeometry(1, 64, 64); // Use SphereGeometry for UVs

    // Create shader material
    const pointMaterial = new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
        },
        vertexShader: `
            uniform sampler2D map;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 2.0; // Adjust point size as needed
            }
        `,
        fragmentShader: `
            uniform sampler2D map;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(map, vUv);
            }
        `,
    });

    const points = new THREE.Points(pointsGeometry, pointMaterial);
    scene.add(points);

    // Assuming scene is your THREE.Scene
    scene.fog = new THREE.Fog(0xffffff, 0, 15);

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
        const intersects = raycaster.intersectObjects([points]);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            coordDiv.innerHTML = `Coordinates: <br>Point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`;
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    document.addEventListener('mousemove', e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([points]);

        if (intersects.length > 0) {
            const { x, y, z } = intersects[0].point;
            coordDiv.innerHTML = `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})` + coordDiv.innerHTML.substr(coordDiv.innerHTML.indexOf('<br>'));
        }

        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            let panFactor = Math.sqrt(camera.position.z - 1) / 1000;

            points.rotation.y += deltaMove.x * panFactor;
            points.rotation.x += deltaMove.y * panFactor;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        points.rotation.y += .001;
    }

    // Event listener for mouse wheel or touchpad scroll
    document.addEventListener('wheel', e => {
        let zoomFactor = Math.sign(e.deltaY) > 0 ? 1.1 : 0.9;
        zoomFactor = Math.pow(zoomFactor, camera.position.z / 5);
        let zoomto = camera.position.z;
        zoomto *= zoomFactor;
        if (zoomto >= 1.0 && zoomto <= 10) {
            camera.position.z = zoomto;
        }
        camera.updateProjectionMatrix();
        coordDiv.innerHTML = `Z:${camera.position.z.toFixed(2)}` + coordDiv.innerHTML.substr(coordDiv.innerHTML.indexOf('<br>'));
    });

    animate();
}, undefined, function (error) {
    console.error('An error happened.', error);
});
