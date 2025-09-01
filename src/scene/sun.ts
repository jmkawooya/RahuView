import * as THREE from "three";
import { SHADOW_MAP_SIZE, SUN_ORBIT_RADIUS, SUN_RADIUS } from "../utils/constants";
import { generateSunEmissive } from "../utils/proceduralTextures";

export type SunSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  sunMesh: THREE.Mesh;
  light: THREE.DirectionalLight;
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

  // Add a simple glow sprite (billboard) for halo
  const glowTexture = createRadialGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffe6a6,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMat);
  let glowScale = SUN_RADIUS * 8.0; // halo diameter
  glow.scale.set(glowScale, glowScale, 1);
  glow.position.copy(sunMesh.position);
  orbitGroup.add(glow);

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  function setVisible(v: boolean) {
    root.visible = v;
  }

  function setRadius(radius: number) {
    const scale = radius / SUN_RADIUS;
    sunMesh.scale.setScalar(scale);
    // Scale glow proportionally and modulate opacity for intensity perception
    glowScale = (SUN_RADIUS * 8.0) * scale;
    glow.scale.set(glowScale, glowScale, 1);
    const spriteMat = glow.material as THREE.SpriteMaterial;
    spriteMat.opacity = 0.6 + 0.3 * Math.min(1, scale);
  }

  function setOrbitRadius(radius: number) {
    sunMesh.position.set(radius, 0, 0);
    light.position.set(radius, 0, 0);
    glow.position.set(radius, 0, 0);
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
  }

  function createRadialGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createRadialGradient(size/2, size/2, size*0.15, size/2, size/2, size*0.5);
    grd.addColorStop(0, 'rgba(255, 230, 180, 0.9)');
    grd.addColorStop(0.4, 'rgba(255, 200, 120, 0.35)');
    grd.addColorStop(1, 'rgba(255, 200, 120, 0.0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  return { root, orbitGroup, sunMesh, light, setAngleRad, setVisible, setRadius, setOrbitRadius, update };
}


