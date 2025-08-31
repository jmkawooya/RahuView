import * as THREE from "three";
import { PCFSoftShadowMap } from "three";
import { makeCamera, makeControls } from "./camera";
import { makeEarth } from "./earth";
import { makeStarfield } from "./starfield";

export type SceneBundle = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
};

export function initScene(container: HTMLElement): SceneBundle {
  const canvas = document.createElement("canvas");
  canvas.className = "three-canvas";

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile() });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = makeCamera();
  const controls = makeControls(camera, renderer.domElement);

  // Resize handler
  function onResize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener("resize", onResize);

  // Scene content
  scene.add(makeStarfield());
  scene.add(makeEarth());

  return { scene, renderer, camera, controls };
}

function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent);
}


