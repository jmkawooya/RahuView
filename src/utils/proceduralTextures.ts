import * as THREE from "three";

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return function rand() {
    // Xorshift32
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function mix(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hash2(i: number, j: number, seed: number): number {
  let h = (i * 374761393) ^ (j * 668265263) ^ (seed * 1442699);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function valueNoisePeriodic(u: number, v: number, freqX: number, freqY: number, seed: number): number {
  const periodX = 256;
  const periodY = 256;
  const x = u * freqX;
  const y = v * freqY;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % periodX) + periodX) % periodX;
  const x1 = (x0 + 1) % periodX;
  const y0 = ((yi % periodY) + periodY) % periodY;
  const y1 = (y0 + 1) % periodY;
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  return nx0 * (1 - sy) + nx1 * sy;
}

function fbm(u: number, v: number, octaves: number, baseFreq: number, lacunarity: number, gain: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = baseFreq;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoisePeriodic(u, v, freq, freq, seed + i * 31);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

function ridgedFbm(u: number, v: number, octaves: number, baseFreq: number, lacunarity: number, gain: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = baseFreq;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoisePeriodic(u, v, freq, freq, seed + 131 * i);
    const r = 1 - Math.abs(n * 2 - 1);
    sum += (r * r) * amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

// Cheap pseudo-"noise": sum of sines in lat/lon space produces organic shapes
type NoiseParams = { f1: number; f2: number; f3: number; p1: number; p2: number; p3: number };

function makeNoiseParams(rand: () => number, fBase: number[]) {
  return {
    f1: fBase[0] + rand() * fBase[1],
    f2: fBase[2] + rand() * fBase[3],
    f3: fBase[4] + rand() * fBase[5],
    p1: rand() * Math.PI * 2,
    p2: rand() * Math.PI * 2,
    p3: rand() * Math.PI * 2,
  } as NoiseParams;
}

function multiSine(lat: number, lon: number, p: NoiseParams) {
  const v = Math.sin(lon * p.f1 + p.p1) * Math.sin(lat * p.f2 + p.p2) + 0.35 * Math.sin(lon * p.f3 + p.p3);
  return 0.5 + 0.5 * v;
}

export type PlanetTextureOptions = {
  seed?: number;
  width?: number;
  height?: number;
  landThreshold?: number; // 0..1
  oceanColor?: THREE.ColorRepresentation;
  shallowOceanColor?: THREE.ColorRepresentation;
  landLowColor?: THREE.ColorRepresentation;
  landHighColor?: THREE.ColorRepresentation;
  iceColor?: THREE.ColorRepresentation;
  includeBump?: boolean;
  includeRoughness?: boolean;
};

export function generatePlanetTexture(options: PlanetTextureOptions = {}) {
  const width = options.width ?? 512;
  const height = options.height ?? 256;
  const landThreshold = options.landThreshold ?? 0.52;
  const ocean = new THREE.Color(options.oceanColor ?? 0x1b3b6f);
  const shallow = new THREE.Color(options.shallowOceanColor ?? 0x2f6fa6);
  const landLow = new THREE.Color(options.landLowColor ?? 0x275b2b);
  const landHigh = new THREE.Color(options.landHighColor ?? 0x8a8b5e);
  const ice = new THREE.Color(options.iceColor ?? 0xe3eef8);

  const rand = seededRandom(options.seed ?? 1337);

  const data = new Uint8Array(width * height * 4);
  const bump = new Uint8Array(width * height);
  const rough = new Uint8Array(width * height);

  // Precompute noise parameter sets (stable across the texture)
  const params1 = makeNoiseParams(rand, [2.0, 4.0, 3.0, 5.0, 5.0, 6.0]);
  const params2 = makeNoiseParams(rand, [2.2, 3.8, 2.6, 4.4, 4.8, 5.5]);
  const params3 = makeNoiseParams(rand, [1.5, 2.2, 1.8, 2.4, 2.1, 2.9]);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const lat = (v - 0.5) * Math.PI; // -pi/2..pi/2
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const lon = (u - 0.5) * Math.PI * 2.0; // -pi..pi

      // Base macro shapes
      const base = multiSine(lat, lon, params1);
      const base2 = multiSine(lat * 1.8 + 0.3, lon * 1.6 - 0.7, params2);
      const base3 = multiSine(lat * 3.1 - 0.2, lon * 2.9 + 1.1, params3);
      const macro = clamp01(base * 0.65 + base2 * 0.25 + base3 * 0.10);

      // Tileable detail for realistic coastlines
      const uu = (u + 1.0) % 1.0;
      const vv = (v + 1.0) % 1.0;
      const detail = fbm(uu, vv, 5, 4.0, 2.1, 0.55, 97);
      const detail2 = fbm(uu + 0.37, vv * 1.17, 4, 8.0, 2.3, 0.55, 211);
      const ridges = ridgedFbm(uu * 1.33, vv * 1.33, 4, 6.0, 2.1, 0.52, 419);
      let heightVal = clamp01(macro * 0.65 + detail * 0.25 + detail2 * 0.15 + ridges * 0.10);

      // Sharper coastlines around threshold
      const edgeT = 0.03;
      heightVal = mix(heightVal, smoothstep(landThreshold - edgeT, landThreshold + edgeT, heightVal), 0.6);

      // Ice caps near poles
      const iceMask = clamp01((Math.abs(v - 0.5) - 0.36) * 6.0); // increases towards poles

      let color = new THREE.Color();
      if (heightVal > landThreshold) {
        // Land
        const t = (heightVal - landThreshold) / (1.0 - landThreshold);
        color.copy(landLow).lerp(landHigh, Math.pow(t, 1.2));
      } else {
        // Ocean with shallows near coasts
        const t = clamp01((landThreshold - heightVal) / landThreshold);
        color.copy(ocean).lerp(shallow, Math.pow(1.0 - t, 2.0));
      }

      if (iceMask > 0.0) {
        color.lerp(ice, clamp01(iceMask * 0.9));
      }

      const idx = (y * width + x) * 4;
      data[idx + 0] = Math.round(clamp01(color.r) * 255);
      data[idx + 1] = Math.round(clamp01(color.g) * 255);
      data[idx + 2] = Math.round(clamp01(color.b) * 255);
      data[idx + 3] = 255;

      const mountainMask = smoothstep(landThreshold + 0.06, landThreshold + 0.25, heightVal);
      const mountainDetail = ridgedFbm(uu * 3.5, vv * 3.5, 5, 5.0, 2.1, 0.6, 733);
      const bumpVal = clamp01(heightVal * 0.5 + mountainMask * mountainDetail * 0.7);
      bump[y * width + x] = Math.round(bumpVal * 255);

      // Roughness: oceans smoother (lower roughness), land rougher
      const isLand = heightVal > landThreshold ? 1.0 : 0.0;
      const coast = smoothstep(landThreshold - 0.02, landThreshold + 0.02, heightVal);
      let roughnessVal = mix(0.25, 0.9, isLand);
      // Make coasts slightly glossier to hint at wet shorelines
      roughnessVal = mix(roughnessVal, 0.35, (1.0 - isLand) * coast);
      rough[y * width + x] = Math.round(clamp01(roughnessVal) * 255);
    }
  }

  const map = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  map.needsUpdate = true;
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipMapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 8;

  const bumpMap = new THREE.DataTexture(bump, width, height, THREE.RedFormat);
  bumpMap.needsUpdate = true;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.generateMipmaps = true;
  bumpMap.minFilter = THREE.LinearMipMapLinearFilter;
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.anisotropy = 8;

  const roughnessMap = new THREE.DataTexture(rough, width, height, THREE.RedFormat);
  roughnessMap.needsUpdate = true;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.generateMipmaps = true;
  roughnessMap.minFilter = THREE.LinearMipMapLinearFilter;
  roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.anisotropy = 8;

  return { map, bumpMap, roughnessMap };
}

export function generateSunEmissive(options: { width?: number; height?: number; seed?: number } = {}) {
  const width = options.width ?? 256;
  const height = options.height ?? 128;
  const rand = seededRandom(options.seed ?? 4242);
  const data = new Uint8Array(width * height * 4);

  // Stable wave parameters for consistent texture
  const p1 = makeNoiseParams(rand, [1.8, 2.2, 1.5, 2.0, 2.0, 2.5]);
  const p2 = makeNoiseParams(rand, [2.5, 3.0, 2.2, 2.8, 2.4, 3.1]);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const lat = (v - 0.5) * Math.PI;
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const lon = (u - 0.5) * Math.PI * 2.0;
      let val = multiSine(lat * 2.3, lon * 2.7, p1) * 0.6 + multiSine(lat * 3.7, lon * 3.1, p2) * 0.4;
      val = clamp01(Math.pow(val, 1.6));
      const color = new THREE.Color(1.0, 0.78 + 0.22 * val, 0.2 + 0.7 * val);
      const idx = (y * width + x) * 4;
      data[idx + 0] = Math.round(clamp01(color.r) * 255);
      data[idx + 1] = Math.round(clamp01(color.g) * 255);
      data[idx + 2] = Math.round(clamp01(color.b) * 255);
      data[idx + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  map.needsUpdate = true;
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipMapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 4;
  return map;
}


