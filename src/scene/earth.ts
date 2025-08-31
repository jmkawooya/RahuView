import * as THREE from "three";
import { EARTH_RADIUS } from "../utils/constants";

export function makeEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x4a78a6, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}


