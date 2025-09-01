import * as THREE from "three";
import { SHADOW_MAP_SIZE } from "../utils/constants";

export function addBasicLights(scene: THREE.Scene) {
  // No ambient light; Sun will be the only light source
}

export function attachSunLight(sun: THREE.Object3D, scene: THREE.Scene) {
  const dirLight = new THREE.DirectionalLight(0xfff2cc, 1.1);
  dirLight.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  sun.add(dirLight);
  return dirLight;
}


