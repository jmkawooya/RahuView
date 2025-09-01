import * as THREE from "three";
import { SHADOW_MAP_SIZE, SUN_ORBIT_RADIUS, SUN_RADIUS } from "../utils/constants";

export type SunSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  sunMesh: THREE.Mesh;
  light: THREE.DirectionalLight;
  setAngleRad: (theta: number) => void;
  setVisible: (v: boolean) => void;
  setRadius: (radius: number) => void;
  setOrbitRadius: (radius: number) => void;
};

export function makeSunSystem(orbitRadius = SUN_ORBIT_RADIUS): SunSystem {
  const root = new THREE.Group();
  const orbitGroup = new THREE.Group();
  root.add(orbitGroup);

  const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 20, 14);
  // Emissive material so the sun appears self-illuminated
  const sunMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffd36b, emissiveIntensity: 2.0, roughness: 0.8, metalness: 0 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(orbitRadius, 0, 0);
  orbitGroup.add(sunMesh);

  const light = new THREE.DirectionalLight(0xffffff, 1.7);
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  light.position.set(orbitRadius, 0, 0);
  // Configure shadow camera to cover Earth and Moon throughout the orbit (scaled)
  const shadowCam = new THREE.OrthographicCamera(-80, 80, 80, -80, 0.5, 160);
  light.shadow.camera = shadowCam;
  orbitGroup.add(light);

  // Target at Earth (origin)
  light.target.position.set(0, 0, 0);
  root.add(light.target);

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  function setVisible(v: boolean) {
    root.visible = v;
  }

  function setRadius(radius: number) {
    const scale = radius / SUN_RADIUS;
    sunMesh.scale.setScalar(scale);
  }

  function setOrbitRadius(radius: number) {
    sunMesh.position.set(radius, 0, 0);
    light.position.set(radius, 0, 0);
    // Expand shadow camera if needed (simple heuristic)
    const ortho = light.shadow.camera as THREE.OrthographicCamera;
    const half = Math.max(40, radius * 1.2);
    ortho.left = -half; ortho.right = half; ortho.top = half; ortho.bottom = -half;
    ortho.near = 0.5; ortho.far = Math.max(160, radius * 2.0);
    ortho.updateProjectionMatrix();
  }

  return { root, orbitGroup, sunMesh, light, setAngleRad, setVisible, setRadius, setOrbitRadius };
}


