import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function makeCamera(aspect: number = 1) {
  const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 5000);
  // Position camera at a default distance that yields ~21.2 zoom units to target
  camera.position.set(0, 15, 21.2);
  return camera;
}

export function makeControls(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0, 0);
  // Ensure initial distance (zoom) is approximately 21.2 scene units
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  camera.position.copy(controls.target).add(dir.multiplyScalar(21.2));
  return controls;
}


