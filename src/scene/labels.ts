import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export type LabelsBundle = {
  renderer: CSS2DRenderer;
  northLabel: CSS2DObject;
  southLabel: CSS2DObject;
  setEnabled: (enabled: boolean) => void;
};

export function makeNodeLabels(northTarget: THREE.Object3D, southTarget: THREE.Object3D): LabelsBundle {
  const renderer = new CSS2DRenderer();
  renderer.setSize(0, 0); // will be resized by caller
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.pointerEvents = "none";

  const northEl = document.createElement("div");
  northEl.className = "label";
  northEl.textContent = "North Node";
  const northLabel = new CSS2DObject(northEl);
  northTarget.add(northLabel);

  const southEl = document.createElement("div");
  southEl.className = "label";
  southEl.textContent = "South Node";
  const southLabel = new CSS2DObject(southEl);
  southTarget.add(southLabel);

  function setEnabled(enabled: boolean) {
    northEl.style.display = enabled ? "block" : "none";
    southEl.style.display = enabled ? "block" : "none";
  }

  return { renderer, northLabel, southLabel, setEnabled };
}

export function makePlaneNameLabels(
  eclipticObj: THREE.Object3D,
  lunarParent: THREE.Object3D,
  eclipticRadius = 8,
  lunarRadius = 6,
) {
  const eclipticAnchor = new THREE.Object3D();
  eclipticAnchor.position.set(eclipticRadius, 0, 0);
  eclipticObj.add(eclipticAnchor);

  const lunarAnchor = new THREE.Object3D();
  // Place lunar label on opposite side with a small upward offset to avoid overlap
  lunarAnchor.position.set(-lunarRadius, 0.25, 0);
  lunarParent.add(lunarAnchor);

  const eclipticEl = document.createElement("div");
  eclipticEl.className = "label label--accent";
  eclipticEl.textContent = "Ecliptic";
  const eclipticLabel = new CSS2DObject(eclipticEl);
  eclipticAnchor.add(eclipticLabel);

  const lunarEl = document.createElement("div");
  lunarEl.className = "label label--accent";
  lunarEl.textContent = "Lunar Plane";
  const lunarLabel = new CSS2DObject(lunarEl);
  lunarAnchor.add(lunarLabel);

  function setEnabled(enabled: boolean) {
    eclipticEl.style.display = enabled ? "block" : "none";
    lunarEl.style.display = enabled ? "block" : "none";
  }

  return { eclipticLabel, lunarLabel, setEnabled };
}


