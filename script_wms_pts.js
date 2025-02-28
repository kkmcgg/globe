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
let sphereLODs = []; // Array to store different LODs
let pointSphere; // Declare pointSphere here
const lodDistances = [10, 5, 2]; // Distances at which to switch LODs
const lodSegments = [16, 32, 64]; // Different segment values for each LOD

textureLoader.load(wmsUrl, function (texture) {
    // Create different LODs for the sphere
    for (let i = 0; i < lodSegments.length; i++) {
        const pointsGeometry = new THREE.SphereGeometry(1, lodSegments[i], lodSegments[i]);

        // Create shader material
        const pointMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                cameraPosition: { value: camera.position }, // Pass camera position to shader
                cameraDistance: { value: 0.0 }, // Initialize cameraDistance uniform
            },
            transparent: true, // Enable transparency in the material
            depthTest: true,    // Enable depth testing
            depthWrite: true,   // Enable depth writing
            blending: THREE.NormalBlending, // Use normal blending
               vertexShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            // Calculate distance to camera using built-in cameraPosition
            float dist = distance(cameraPosition, position); // Use built-in cameraPosition

            // Adjust point size based on distance (inversely proportional)
            gl_PointSize = 100.0 / dist; // Adjust the constants as needed
        }
    `,
            fragmentShader: `
                uniform sampler2D map;
                varying vec2 vUv;
                uniform float cameraDistance; // Add uniform for camera distance

                void main() {
                    vec4 color = texture2D(map, vUv);

                    // Calculate transparency based on camera distance
                    float transparency = clamp(cameraDistance / 10.0, 0.0, 1.0); // Adjust the divisor (10.0) as needed

										//float hardval = 0.01;

                    // Apply transparency to the color
                    gl_FragColor = vec4(color.rgb, transparency);
                }
            `,
        });

        const points = new THREE.Points(pointsGeometry, pointMaterial);
        points.visible = false; // Initially hide all LODs except the first one
        sphereLODs.push(points);
        scene.add(points);
    }

    sphereLODs[0].visible = true; // Show the first LOD initially

    // Create sphere mesh (using the highest LOD)
    const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const sphereGeometry = new THREE.SphereGeometry(1, lodSegments[lodSegments.length - 1], lodSegments[lodSegments.length - 1]);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Create a sphere for the point
    const pointSphereGeometry = new THREE.SphereGeometry(0.02, 16, 16); // Smaller sphere for the point
    const pointSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for the point
    pointSphere = new THREE.Mesh(pointSphereGeometry, pointSphereMaterial);
    scene.add(pointSphere);

    // Add sphere mesh to the scene
    scene.add(sphere);

    let usePoints = true; // Flag to track which object is being displayed

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

        // Always intersect with the visible points object
        const intersects = raycaster.intersectObjects(sphereLODs.filter(lod => lod.visible));

        if (intersects.length > 0) {
            const point = intersects[0].point;

            // Calculate the offset point
            const addLength = 0.01;
            const originalLength = point.length();
            const offsetPoint = point.clone().normalize().multiplyScalar(originalLength + addLength);

            // Update the position of the pointSphere using the offsetPoint
            pointSphere.position.copy(offsetPoint);

            // Print coordinates to the screen
            coordDiv.innerHTML = `Coordinates: (${offsetPoint.x.toFixed(2)}, ${offsetPoint.y.toFixed(2)}, ${offsetPoint.z.toFixed(2)})<br>x for ${usePoints ? 'mesh' : 'points'}`;
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    document.addEventListener('mousemove', e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([usePoints ? sphereLODs.find(lod => lod.visible) : sphere]);

        if (intersects.length > 0) {
            const { x, y, z } = intersects[0].point;
            coordDiv.innerHTML = `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})<br>x for ${usePoints ? 'mesh' : 'points'}`;
        }

        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            let panFactor = Math.sqrt(camera.position.z - 1) / 1000;

            // Rotate both points and sphere to keep them synchronized
            sphereLODs.forEach(lod => {
                lod.rotation.y += deltaMove.x * panFactor;
                lod.rotation.x += deltaMove.y * panFactor;
            });
            sphere.rotation.y += deltaMove.x * panFactor;
            sphere.rotation.x += deltaMove.y * panFactor;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Event listener for 'x' key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'x') {
            usePoints = !usePoints;
            sphereLODs.forEach(lod => lod.visible = usePoints);
            sphere.visible = !usePoints;

            // Update the text overlay
            coordDiv.innerHTML = coordDiv.innerHTML.split('<br>')[0] + `<br>x for ${usePoints ? 'mesh' : 'points'}`;
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Update LOD based on camera distance
        const cameraDistance = camera.position.z - 1; // Distance from the surface of the sphere
        for (let i = 0; i < lodDistances.length; i++) {
            if (cameraDistance > lodDistances[i]) {
                sphereLODs.forEach((lod, index) => lod.visible = index === i);
                break;
            }
        }

        // Update uniforms for each LOD
        sphereLODs.forEach(lod => {
            lod.material.uniforms.cameraPosition = { value: camera.position };

            // Calculate and update cameraDistance uniform
            const cameraDistance = camera.position.z - 1; // Distance from the surface of the sphere
            lod.material.uniforms.cameraDistance = { value: cameraDistance };
        });

        renderer.render(scene, camera);
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
        coordDiv.innerHTML = `Z:${camera.position.z.toFixed(2)}<br>x for ${usePoints ? 'mesh' : 'points'}`;
    });

    animate();
}, undefined, function (error) {
    console.error('An error happened.', error);
});
