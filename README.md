
## shadertoys

From inside

![image](https://github.com/kkmcgg/globe/assets/36888812/255eb46e-60f6-435c-bdac-1d7e6d3b1dbe)

```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Adjust for oblate spheroid shape
    c.z *= 0.7;

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Grid lines
    float gridIntensity = 0.1;
    float gridSize = 20.0;

    // Draw meridians
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(atan(c.y, c.x) * gridSize / 3.14) - 0.5));

    // Draw parallels
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(asin(c.z) * gridSize / 3.14) - 0.5));

    // Combine spheroid and grid
    vec3 color = vec3(0.5, 0.7, 1.0) * (1.0 - gridIntensity) + vec3(1.0) * gridIntensity;

    fragColor = vec4(color,1.0);
}
```

Maybe ScreenSpace

![image](https://github.com/kkmcgg/globe/assets/36888812/742e2a96-9ce9-49fe-ac7f-1dc973d8101c)
```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Adjust for oblate spheroid shape
    c.z *= 0.7;

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Grid lines
    float gridIntensity = 0.0;
    float gridSize = 20.0;

    // Draw meridians
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(atan(c.y, c.x) * gridSize / 3.14) - 0.5));

    // Draw parallels
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(asin(c.z) * gridSize / 3.14) - 0.5));

    // Combine spheroid and grid
    vec3 color = length(p) < 1.0 ? (vec3(0.2, 0.5, 1.0) * (1.0 - gridIntensity) + vec3(1.0) * gridIntensity) : vec3(0.0);

    fragColor = vec4(color,1.0);
}
```

Maybe Screenspace 2

![image](https://github.com/kkmcgg/globe/assets/36888812/f07bbd3c-0589-4060-ada3-7683af0281ae)
```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Adjust for oblate spheroid shape
    vec3 spheroid = c;
    spheroid.z *= 0.7;

    // Grid lines
    float gridIntensity = 0.0;
    float gridSize = 20.0;

    // Draw meridians
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(atan(spheroid.y, spheroid.x) * gridSize / 3.14) - 0.5));

    // Draw parallels
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(asin(spheroid.z) * gridSize / 3.14) - 0.5));

    // Combine spheroid and grid
    vec3 color = length(p) < 1.0 ? (vec3(0.2, 0.5, 1.0) * (1.0 - gridIntensity) + vec3(1.0) * gridIntensity) : vec3(0.0);

    fragColor = vec4(color,1.0);
}
```

Better

![image](https://github.com/kkmcgg/globe/assets/36888812/d3a0682d-68a6-44da-9a0f-2885ad57afe7)
```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Adjust for oblate spheroid shape
    vec3 spheroid = c;
    spheroid.z *= 0.7;

    // Grid lines
    float gridIntensity = 0.0;
    float gridSize = 20.0;

    // Draw meridians
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(atan(spheroid.x, spheroid.y) * gridSize / 3.14) - 0.5));

    // Draw parallels
    float adjustedZ = asin(spheroid.z / 0.7);
    gridIntensity += 0.2 * smoothstep(0.05, 0.07, abs(fract(adjustedZ * gridSize / 3.14) - 0.5));

    // Combine spheroid and grid
    vec3 color = length(p) < 1.0 ? (vec3(0.2, 0.5, 1.0) * (1.0 - gridIntensity) + vec3(1.0) * gridIntensity) : vec3(0.0);

    fragColor = vec4(color,1.0);
}
```

Slippy Grid

![image](https://github.com/kkmcgg/globe/assets/36888812/f354e7f0-2e50-4049-8fb4-e9b1ef3386ef)
```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Adjust for oblate spheroid shape
    vec3 spheroid = c;
    spheroid.z *= 0.7;

    // Grid lines
    float gridIntensity = 0.0;
    float gridSize = 50.0;

    // Sippy Grid Squared
    float lon = atan(spheroid.x, spheroid.y);
    float lat = asin(spheroid.z / 0.7);
    float gridX = fract(gridSize * (lon + 3.14) / (2.0 * 3.14));
    float gridY = fract(gridSize * (lat + 0.5 * 3.14) / 3.14);

    gridIntensity += 0.2 * (smoothstep(0.05, 0.07, abs(gridX - 0.5)) + smoothstep(0.05, 0.07, abs(gridY - 0.5)));

    // Combine spheroid and grid
    vec3 color = length(p) < 1.0 ? (vec3(0.2, 0.5, 1.0) * (1.0 - gridIntensity) + vec3(1.0) * gridIntensity) : vec3(0.0);

    fragColor = vec4(color,1.0);
}
```

Splippy Grid Index

![image](https://github.com/kkmcgg/globe/assets/36888812/19fa6016-95d5-4a70-9406-46ad98b9cbbf)
```
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates ([0,1] to [-1,1])
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

    // Convert to spherical coordinates
    vec3 c = normalize(vec3(p.x, p.y, 1.0));

    // Rotate around Y axis using mouse
    float angleY = 3.14 * (iMouse.x / iResolution.x - 0.5);
    c = mat3(cos(angleY), 0, sin(angleY), 0, 1, 0, -sin(angleY), 0, cos(angleY)) * c;

    // Rotate around X axis using mouse
    float angleX = 3.14 * (iMouse.y / iResolution.y - 0.5);
    c = mat3(1, 0, 0, 0, cos(angleX), -sin(angleX), 0, sin(angleX), cos(angleX)) * c;

    // Adjust for oblate spheroid shape
    vec3 spheroid = c;
    spheroid.z *= 0.7;

    // Grid lines
    float gridIntensity = 0.0;
    float gridSize = 25.0;

    // Convert to Slippy coordinates
    float lon = atan(spheroid.x, spheroid.y);
    float lat = asin(spheroid.z / 0.7);
    float x = mod(gridSize * (lon + 3.14) / (2.0 * 3.14), 1.0);
    float y = mod(gridSize * (lat + 0.5 * 3.14) / 3.14, 1.0);
    float z = gridSize / 40.0; // Arbitrary scaling for visualization

    // Grid Intensity for lines
    gridIntensity += 0.2 * (smoothstep(0.05, 0.07, abs(x - 0.5)) + smoothstep(0.05, 0.07, abs(y - 0.5)));

    // Combine spheroid and grid
    vec3 color = length(p) < 1.0 ? mix(vec3(x, y, z), vec3(1.0), gridIntensity) : vec3(0.0);

    fragColor = vec4(color,1.0);
}
```

# Cool Things

https://github.com/ebeaufay/UltraGlobe


