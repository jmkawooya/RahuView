import * as THREE from "three";
import { PCFSoftShadowMap } from "three";
import { makeCamera, makeControls } from "./camera";
import { makeStarfield, type Starfield } from "./starfield";
import { isMobile } from "../utils/device";

export type SceneBundle = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  onResize: (callback: () => void) => void;
  starfield: Starfield;
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
  
  // Initialize camera with proper aspect ratio
  const initialAspect = container.clientWidth / container.clientHeight || 1;
  const camera = makeCamera(initialAspect);
  const controls = makeControls(camera, renderer.domElement);

  // Store resize callbacks
  const resizeCallbacks: (() => void)[] = [];

  // Resize handler
  function onResize() {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Call external resize callbacks
    resizeCallbacks.forEach(callback => callback());
  }
  window.addEventListener("resize", onResize);
  
  // Also listen for mobile-specific events
  window.addEventListener("orientationchange", () => {
    setTimeout(onResize, 100); // Delay for orientation change to complete
  });
  
  // Visual viewport API support for mobile browsers
  if (typeof window.visualViewport !== 'undefined') {
    window.visualViewport.addEventListener('resize', onResize);
  }
  
  // Call resize immediately to ensure proper initial sizing
  onResize();

  // Scene content
  const starfield = makeStarfield();
  scene.add(starfield.points);
  // Earth will be added separately in main.ts as part of EarthSystem

  return { 
    scene, 
    renderer, 
    camera, 
    controls,
    starfield,
    onResize: (callback: () => void) => {
      resizeCallbacks.push(callback);
    }
  };
}



