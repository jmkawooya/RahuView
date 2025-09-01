import * as THREE from "three";

export type Starfield = {
  points: THREE.Points;
  update: (elapsedSeconds: number) => void;
};

export function makeStarfield(count = 4000, radius = 1200): Starfield {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = radius * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Size variation (in pixels before attenuation)
    sizes[i] = 0.8 + Math.pow(Math.random(), 2.0) * 4.0; // favor small

    // Twinkle phase and speed
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.6 + Math.random() * 1.6;

    // Slight color temperature variation (warm/cool whites)
    const warm = Math.random();
    const tint = 0.92 + Math.random() * 0.16; // 0.92..1.08
    const base = 0.85 + Math.random() * 0.15;
    const rCol = THREE.MathUtils.clamp(base * (warm > 0.5 ? tint : 1.0), 0.0, 1.0);
    const bCol = THREE.MathUtils.clamp(base * (warm > 0.5 ? 1.0 : tint), 0.0, 1.0);
    const gCol = base;
    colors[i * 3 + 0] = rCol;
    colors[i * 3 + 1] = gCol;
    colors[i * 3 + 2] = bCol;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSizeBase: { value: 1.0 },
      uSizeAttenuation: { value: 1600.0 },
      uTwinkleAmplitude: { value: 1.3 },
      uTwinkleBase: { value: 0.8 },
      uTimeScale: { value: 0.35 },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uTimeScale;
      uniform float uSizeBase;
      uniform float uSizeAttenuation;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vColor = aColor;
        // Twinkle factor in 0..1
        vTwinkle = 0.5 + 0.5 * sin((uTime * uTimeScale) * aSpeed + aPhase);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float size = (uSizeBase + aSize) * (uSizeAttenuation / -mvPosition.z);
        gl_PointSize = size;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTwinkleAmplitude;
      uniform float uTwinkleBase;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        // Soft circular sprite
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        // Slightly hazier edge
        float alpha = smoothstep(0.65, 0.0, d);
        float brightness = max(0.0, uTwinkleBase + uTwinkleAmplitude * ((vTwinkle - 0.5) * 2.0));
        vec3 color = vColor * brightness;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  function update(elapsedSeconds: number) {
    (points.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedSeconds;
  }

  return { points, update };
}

