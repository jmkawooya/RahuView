import * as THREE from "three";
import { MOON_ORBIT_RADIUS, MOON_RADIUS } from "../utils/constants";

export type MoonSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  tiltGroup: THREE.Group;
  moon: THREE.Mesh;
  setInclinationDeg: (deg: number) => void;
  setAngleRad: (theta: number) => void;
  setRadius: (radius: number) => void;
  setOrbitRadius: (radius: number) => void;
};

export function makeMoonSystem(orbitRadius = MOON_ORBIT_RADIUS): MoonSystem {
  const root = new THREE.Group();
  const tiltGroup = new THREE.Group();
  const orbitGroup = new THREE.Group();
  tiltGroup.add(orbitGroup);
  root.add(tiltGroup);

  const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 48, 36);
  const moonMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1, metalness: 0 });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  // Place on +Z so X-axis tilt creates an inclined orbital plane (nodes along X)
  moon.position.set(0, 0, orbitRadius);
  moon.castShadow = true; // Always cast shadows
  moon.receiveShadow = true; // Always receive shadows
  orbitGroup.add(moon);

  function setInclinationDeg(deg: number) {
    const rad = THREE.MathUtils.degToRad(deg);
    tiltGroup.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
  }

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  function setRadius(radius: number) {
    const scale = radius / MOON_RADIUS;
    moon.scale.setScalar(scale);
  }

  function setOrbitRadius(radius: number) {
    moon.position.set(0, 0, radius);
  }

  return { root, orbitGroup, tiltGroup, moon, setInclinationDeg, setAngleRad, setRadius, setOrbitRadius };
}


