import * as THREE from "three";
import { SHADOW_MAP_SIZE, SUN_ORBIT_RADIUS, SUN_RADIUS } from "../utils/constants";
import { generateSunEmissive } from "../utils/proceduralTextures";

export type SunSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  sunMesh: THREE.Mesh;
  light: THREE.DirectionalLight;
  halo: THREE.Mesh;
  setAngleRad: (theta: number) => void;
  setVisible: (v: boolean) => void;
  setRadius: (radius: number) => void;
  setOrbitRadius: (radius: number) => void;
  update: (elapsedSeconds: number) => void;
};

export function makeSunSystem(orbitRadius = SUN_ORBIT_RADIUS): SunSystem {
  const root = new THREE.Group();
  const orbitGroup = new THREE.Group();
  root.add(orbitGroup);

  let currentSunRadius = SUN_RADIUS;
  let currentOrbitRadius = orbitRadius;

  const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 96, 72);
  // Use unlit material so the Sun is self-illuminated regardless of lights
  const sunTexture = generateSunEmissive({ width: 4096, height: 2048 });
  const sunMat = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: 0xffffff,
    toneMapped: false,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(orbitRadius, 0, 0);
  orbitGroup.add(sunMesh);

  const light = new THREE.DirectionalLight(0xffffff, 1.7);
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.03;
  light.position.set(orbitRadius, 0, 0);
  // Configure shadow camera to cover Earth and Moon throughout the orbit (scaled)
  const shadowCam = new THREE.OrthographicCamera(-80, 80, 80, -80, 0.5, 160);
  light.shadow.camera = shadowCam;
  orbitGroup.add(light);

  // Target at Earth (origin)
  light.target.position.set(0, 0, 0);
  root.add(light.target);

  // Add a shader-based volumetric halo (sphere shell with additive scattering)
  const baseHaloRadius = SUN_RADIUS * 3.0; // geometry base, we will rescale to desired outer radius
  const haloGeo = new THREE.SphereGeometry(baseHaloRadius, 48, 32);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0xffe6a6) },
      uIntensity: { value: 1.15 },
      uRimPower: { value: 3.0 },
      uNoiseAmp: { value: 1.0 / 255.0 },
      uTime: { value: 0.0 },
      uInnerRadius: { value: SUN_RADIUS },
      uOuterRadius: { value: SUN_ORBIT_RADIUS * 0.98 },
      uSunCenter: { value: new THREE.Vector3() },
      uSteps: { value: 24 },
      uDensity: { value: 1.0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vPos;
      varying vec3 vWorldCenter;
      void main(){
        vPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vWorldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uRimPower;
      uniform float uNoiseAmp;
      uniform float uTime;
      uniform float uInnerRadius;
      uniform float uOuterRadius;
      uniform vec3 uSunCenter;
      uniform int uSteps;
      uniform float uDensity;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vPos;
      varying vec3 vWorldCenter;

      // Simple hash-based noise for dithering
      float hash(vec2 p){
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p.x + p.y + uTime * 37.0) * 43758.5453);
      }

      void main(){
        // Ray from camera through this pixel
        vec3 ro = cameraPosition;
        vec3 rd = normalize(vWorldPos - cameraPosition);

        // Sphere center (world)
        vec3 C = vWorldCenter; // equals halo's world origin
        float R = uOuterRadius;
        float r0 = uInnerRadius;

        // Intersect with outer sphere
        vec3 oc = ro - C;
        float b = dot(oc, rd);
        float c = dot(oc, oc) - R * R;
        float h = b*b - c;
        if (h <= 0.0) {
          // When inside the outer sphere, still accumulate outward segment
          float distToCenter = length(oc);
          if (distToCenter < R) {
            float tOutOnly = -b + sqrt(max(0.0, h));
            float tInOnly = 0.0;
            float segmentOnly = max(0.0, tOutOnly - tInOnly);
            if (segmentOnly <= 1e-5) discard;
          } else {
            discard;
          }
        }
        float sqrtH = sqrt(h);
        float tIn = -b - sqrtH;
        float tOut = -b + sqrtH;
        tIn = max(tIn, 0.0);

        // Clip out the solid Sun (inner sphere)
        float c2 = dot(oc, oc) - r0 * r0;
        float h2 = b*b - c2;
        float tInnerExit = -1.0;
        if (h2 > 0.0){
          float sh2 = sqrt(h2);
          float tInnerIn = -b - sh2;
          tInnerExit = -b + sh2;
          tIn = max(tIn, tInnerExit);
        }
        float segmentLen = max(0.0, tOut - tIn);
        if (segmentLen <= 1e-5) discard;

        int steps = max(8, uSteps);
        float dt = segmentLen / float(steps);
        float accum = 0.0;
        float tCur = tIn + dt * 0.5;
        for (int i = 0; i < 128; i++) {
          if (i >= steps) break;
          vec3 p = ro + rd * tCur;
          float dist = length(p - C);
          // Emissive density higher near inner surface and decays outward
          float x = clamp((dist - r0) / max(1e-4, (R - r0)), 0.0, 1.0);
          float density = pow(1.0 - x, 2.5) * (r0*r0) / max(1e-4, dist*dist);
          accum += density * dt;
          tCur += dt;
        }

        // Rim boost gives stronger brightness near tangent views
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float rim = pow(1.0 - max(dot(viewDir, normalize(vNormalW)), 0.0), uRimPower);

        float intensity = uIntensity * accum * (0.4 + 0.6 * rim) * uDensity;
        // Dither to avoid banding
        float dither = (hash(gl_FragCoord.xy) - 0.5) * uNoiseAmp;
        intensity = max(0.0, intensity + dither);
        gl_FragColor = vec4(uColor * intensity, intensity);
      }
    `,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(sunMesh.position);
  halo.renderOrder = 1; // draw after opaque sun
  orbitGroup.add(halo);

  function updateHaloSizing() {
    const desiredOuter = Math.max(currentSunRadius * 3.0, currentOrbitRadius * 0.98);
    const scaleForOuter = desiredOuter / baseHaloRadius;
    halo.scale.setScalar(scaleForOuter);
    const mat = halo.material as THREE.ShaderMaterial;
    mat.uniforms.uInnerRadius.value = currentSunRadius;
    mat.uniforms.uOuterRadius.value = desiredOuter;
    mat.uniforms.uSunCenter.value.copy(halo.position);
    // Slightly boost intensity when halo is large so it remains visible
    mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(1.0, 1.35, THREE.MathUtils.clamp((desiredOuter - currentSunRadius * 3.0) / Math.max(1e-4, currentOrbitRadius), 0, 1));
  }
  updateHaloSizing();

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  function setVisible(v: boolean) {
    root.visible = v;
  }

  function setRadius(radius: number) {
    const scale = radius / SUN_RADIUS;
    sunMesh.scale.setScalar(scale);
    currentSunRadius = radius;
    updateHaloSizing();
  }

  function setOrbitRadius(radius: number) {
    sunMesh.position.set(radius, 0, 0);
    light.position.set(radius, 0, 0);
    halo.position.set(radius, 0, 0);
    currentOrbitRadius = radius;
    updateHaloSizing();
    // Expand shadow camera if needed (simple heuristic)
    const ortho = light.shadow.camera as THREE.OrthographicCamera;
    const half = Math.max(40, radius * 1.2);
    ortho.left = -half; ortho.right = half; ortho.top = half; ortho.bottom = -half;
    ortho.near = 0.5; ortho.far = Math.max(160, radius * 2.0);
    ortho.updateProjectionMatrix();
  }

  function update(elapsedSeconds: number) {
    const pulse = 0.85 + 0.15 * Math.sin(elapsedSeconds * 0.6);
    const brightness = 1.2 + pulse * 0.8;
    (sunMat.color as THREE.Color).setRGB(1.0, 1.0, 1.0).multiplyScalar(brightness);
    sunMesh.rotation.y = elapsedSeconds * 0.03;
    // Drive subtle temporal dithering/noise in halo
    const mat = halo.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = elapsedSeconds;
    // Slight pulsation of density for life-like variation
    mat.uniforms.uDensity.value = 0.9 + 0.2 * Math.sin(elapsedSeconds * 0.3);
  }

  return { root, orbitGroup, sunMesh, light, halo, setAngleRad, setVisible, setRadius, setOrbitRadius, update };
}


