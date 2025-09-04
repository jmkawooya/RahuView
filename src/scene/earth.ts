import * as THREE from "three";
import { EARTH_RADIUS } from "../utils/constants";
import { generatePlanetTexture } from "../utils/proceduralTextures";

export type EarthSystem = {
  earth: THREE.Mesh;
  clouds?: THREE.Mesh;
  atmosphere?: THREE.Mesh;
  setRadius: (radius: number) => void;
};

export function makeEarth(): EarthSystem {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 42);

  const { map, bumpMap, roughnessMap } = generatePlanetTexture({
    width: 4096,
    height: 2048,
    includeBump: true,
    includeRoughness: true,
  });
  const material = new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0,
    bumpMap,
    bumpScale: 0.03,
    roughnessMap,
  });
  const earth = new THREE.Mesh(geometry, material);
  earth.castShadow = true; // Always cast shadows
  earth.receiveShadow = true; // Always receive shadows

  // Atmosphere rim (backside only) using additive material
  const atmosphereGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.02, 48, 36);
  const atmosphereMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(0x7ec8ff) },
      uIntensity: { value: 0.25 },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      void main(){
        float viewDot = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0), 3.0);
        gl_FragColor = vec4(uColor, viewDot * uIntensity);
      }
    `,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  earth.add(atmosphere);

  // Clouds layer: slightly above surface, semi-transparent
  const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 42);
  // Procedural soft clouds from noise into alpha channel
  const cloudsTex = makeCloudsTexture(2048, 1024, 2025);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudsTex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
  earth.add(clouds);

  function setRadius(radius: number) {
    const scale = radius / EARTH_RADIUS;
    earth.scale.setScalar(scale);
    // atmosphere and clouds are children of earth, so they inherit the scaling automatically
  }

  return { earth, clouds, atmosphere, setRadius };
}

function makeCloudsTexture(width: number, height: number, seed: number) {
  const rand = (function(){
    let s = seed >>> 0;
    return function(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s>>>0)%10000)/10000; };
  })();
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      // FBM-like noise
      let f = 0.0; let amp = 0.5; let freq = 3.0;
      for (let o = 0; o < 5; o++) {
        const n = valueNoise(u * freq, v * freq, rand);
        f += n * amp; freq *= 2.03; amp *= 0.55;
      }
      f = Math.pow(Math.max(0.0, f - 0.35) * 1.6, 1.4);
      const idx = (y * width + x) * 4;
      data[idx+0] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = Math.round(255 * Math.min(1, f));
    }
  }
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipMapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return tex;
}

function valueNoise(x: number, y: number, rand: () => number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const h = (i: number, j: number) => {
    let s = (i * 374761393) ^ (j * 668265263);
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s>>>0)%10000)/10000;
  };
  const n00 = h(xi, yi), n10 = h(xi+1, yi), n01 = h(xi, yi+1), n11 = h(xi+1, yi+1);
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  return nx0 * (1 - sy) + nx1 * sy;
}


