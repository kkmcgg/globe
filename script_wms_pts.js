// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000001, 2000.0);

// Factor by which to increase the canvas size
const scaleFactor = 4;

// Create the renderer at a higher resolution
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth * scaleFactor, window.innerHeight * scaleFactor);

//for material clipping plane
// renderer.localClippingEnabled = true;
// const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, .2), 0);
// renderer.clippingPlanes = [clippingPlane]

// Scale down the canvas element to fit the display size
renderer.domElement.style.width = `${window.innerWidth}px`;
renderer.domElement.style.height = `${window.innerHeight}px`;
document.getElementById('container').appendChild(renderer.domElement);

// Load the WMS texture
const wmsUrl = "https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer?request=GetMap&service=WMS&version=1.1.1&layers=0&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512";

// const ptmode = 0; // vertex
const ptmode = 1; // random

const textureLoader = new THREE.TextureLoader();
let sphereLODs = []; // Array to store different LODs
let pointSphere; // Declare pointSphere here
const lodDistances = [1, 1, 1]; // Distances at which to switch LODs
const lodSegments = [120, 32, 64]; // Different segment values for each LOD


textureLoader.load(wmsUrl, function (texture) {
    // Create different LODs for the sphere
    for (let i = 0; i < lodSegments.length; i++) {
        let pointsGeometry;

        switch (ptmode){
            case 0: {
                console.log('ptmode 0')
                pointsGeometry = new THREE.SphereGeometry(1, lodSegments[i], lodSegments[i]);
                break;
                }
            case 1:{
                console.log('ptmode 1')
                const positions = [];
                const uvs = [];
                const numPoints = lodSegments[i]*1000;

                for (let j = 0; j < numPoints; j++) {
                    const u = Math.random();
                    const v = Math.random();

                    const theta = u * 2.0 * Math.PI;  // longitude
                    const phi = Math.acos(2.0 * v - 1.0);  // latitude

                    const x = Math.sin(phi) * Math.cos(theta);
                    const z = Math.sin(phi) * Math.sin(theta);
                    const y = Math.cos(phi);

                    // Correct sphere UV mapping:
                    // const sphereU = theta / (2.0 * Math.PI);
                    const sphereU = (theta / (2.0 * Math.PI) + 0.5) % 1.0;    // spin
                    const sphereV = phi / Math.PI;

                    positions.push(x, y, z);
                    uvs.push(1.0-sphereU, 1.0- sphereV); // Flip V to match texture orientation
                    // uvs.push(u, v); // Flip V to match texture orientation
                
                }

                pointsGeometry = new THREE.BufferGeometry();
                pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                pointsGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                }
                break;
            }

        // Create shader material
        const pointMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                cameraPosition: { value: camera.position }, // Pass camera position to shader
                cameraDistance: { value: 0.0 }, // Initialize cameraDistance uniform
                mode : {value:1}
            },
            // clipping: true, // Enable clipping on material
            // clippingPlanes: [clippingPlane],
            transparent: true, // Enable transparency in the material
            depthTest: false,    // Enable depth testing
            depthWrite: false,   // Enable depth writing
            blending: THREE.NormalBlending, // Use normal blending
               vertexShader: `
        uniform sampler2D map;
        varying vec2 vUv;

        varying vec3 vPos;

        varying vec3 vWorldPosition;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;

            // Calculate distance to camera using built-in cameraPosition
            float dist = distance(cameraPosition, position); // Use built-in cameraPosition

            // Adjust point size based on distance (inversely proportional)
            gl_PointSize = 500.0 / (dist*dist*dist); // Adjust the constants as needed
            // gl_PointSize = 50.0; // Adjust the constants as needed

            vPos = position; // pass the full position
        }
    `,
            fragmentShader: `
                uniform int mode;
                uniform sampler2D map;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform float cameraDistance; // Add uniform for camera distance
                // uniform vec3 cameraPosition;
                varying vec3 vWorldPosition;

                void main() {

                        vec2 coord = gl_PointCoord - vec2(0.5); // center at (0,0)
                        float radius = 0.5; // radius for a circle
                        // if(length(coord) > radius){
                        //     discard; // discard fragments outside circle radius
                        // }

                    float dist = length(coord);
                    // Opaque center, transparent edges (smooth fade-out)
                    float alpha = .1 - smoothstep(0.1, 1.0, dist);
                    // float alpha = 1.0;

                    vec4 color = texture2D(map, vUv);
                    // vec4 color = texture2D(map, gl_PointCoord);
                    color.b = min(color.b + 0.0, 1.0); // increase blue by 0.2, capped at 1.0

                    switch(mode){ 
                        case 0:
                            color.r = (vPos.x + color.r+color.g+color.b) * 0.5; // remap from [-1,1] to [0,1]
                            color.g = (vPos.y + color.r+color.g+color.b) * 0.5; // remap from [-1,1] to [0,1]
                            color.b = (vPos.z + color.r+color.g+color.b) * 0.5; // remap from [-1,1] to [0,1]
                            break;
                        case 1:
                            vec3 viewDir = normalize(vWorldPosition - cameraPosition);
                            // Globe centered at origin, camera looking toward globe center
                            // if(dot(viewDir, normalize(cameraPosition)) > 0.0){
                            //     discard; // Discards pixels on back half of globe
                            // }
                            if (vWorldPosition.z < 0.7){
                                discard;
                            }
                            // color.r = (vWorldPosition.x) * 0.5; // remap from [-1,1] to [0,1]
                            // color.g = (vWorldPosition.y) * 0.5; // remap from [-1,1] to [0,1]
                            // color.b = (vWorldPosition.z) * 0.5; // remap from [-1,1] to [0,1]
                            break;
                        }



                    // Calculate transparency based on camera distance
                    float transparency = clamp(cameraDistance / 100.0, 0.0, 1.0); // Adjust the divisor (10.0) as needed

										//float hardval = 0.01;

                    // Apply transparency to the color
                    gl_FragColor = vec4(color.rgb, alpha);
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


    coordDiv.innerHTML = `point mode: ${ptmode}`;

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

    // Event listener for 'x' key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'z') {
            const uniforms = sphereLODs[0].material.uniforms;
            uniforms.mode.value = 1 - uniforms.mode.value;
            uniforms.mode.needsUpdate = true; // Optional but recommended
            console.log(`Shader mode now: ${uniforms.mode.value}`);
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        // clippingPlane.normal.copy(camera.position).normalize();
        // clippingPlane.constant = 0; // assuming globe at origin; adjust if globe moved

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
