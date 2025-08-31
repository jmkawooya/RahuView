import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function makeCamera() {
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
  camera.position.set(0, 3.2, 6.5);
  return camera;
}

export function makeControls(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0, 0);
  return controls;
}


