import * as THREE from "three";
import { EARTH_RADIUS } from "../utils/constants";

export type EarthSystem = {
  earth: THREE.Mesh;
  setRadius: (radius: number) => void;
};

export function makeEarth(): EarthSystem {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x4a78a6, roughness: 0.9, metalness: 0 });
  const earth = new THREE.Mesh(geometry, material);
  earth.castShadow = true; // Always cast shadows
  earth.receiveShadow = true; // Always receive shadows

  function setRadius(radius: number) {
    const scale = radius / EARTH_RADIUS;
    earth.scale.setScalar(scale);
  }

  return { earth, setRadius };
}


