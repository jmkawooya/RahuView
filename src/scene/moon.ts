import * as THREE from "three";
import { MOON_ORBIT_RADIUS, MOON_RADIUS } from "../utils/constants";

export type MoonSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  tiltGroup: THREE.Group;
  moon: THREE.Mesh;
  setInclinationDeg: (deg: number) => void;
  setAngleRad: (theta: number) => void;
};

export function makeMoonSystem(orbitRadius = MOON_ORBIT_RADIUS): MoonSystem {
  const root = new THREE.Group();
  const orbitGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();
  orbitGroup.add(tiltGroup);
  root.add(orbitGroup);

  const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 16, 12);
  const moonMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1, metalness: 0 });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.set(orbitRadius, 0, 0);
  moon.castShadow = true;
  tiltGroup.add(moon);

  function setInclinationDeg(deg: number) {
    const rad = THREE.MathUtils.degToRad(deg);
    tiltGroup.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
  }

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  return { root, orbitGroup, tiltGroup, moon, setInclinationDeg, setAngleRad };
}


