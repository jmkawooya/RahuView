import * as THREE from "three";
import { SHADOW_MAP_SIZE } from "../utils/constants";

export function addBasicLights(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xfff2cc, 0.8);
  dir.position.set(10, 8, 0);
  dir.castShadow = true;
  dir.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  // Generous shadow camera to encompass Earth/Moon space; refined later by Sun setup
  const cam = dir.shadow.camera as THREE.OrthographicCamera;
  cam.left = -20;
  cam.right = 20;
  cam.top = 20;
  cam.bottom = -20;
  cam.near = 0.5;
  cam.far = 80;
  scene.add(dir);
}

export function attachSunLight(sun: THREE.Object3D, scene: THREE.Scene) {
  const dirLight = new THREE.DirectionalLight(0xfff2cc, 1.1);
  dirLight.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  sun.add(dirLight);
  // Provide some subtle rim lighting
  const fill = new THREE.HemisphereLight(0xffffff, 0x222233, 0.2);
  scene.add(fill);
  return dirLight;
}


