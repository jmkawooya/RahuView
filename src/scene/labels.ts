import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export type LabelsBundle = {
  renderer: CSS2DRenderer;
  northLabel: CSS2DObject;
  southLabel: CSS2DObject;
  setEnabled: (enabled: boolean) => void;
  updateOcclusion: (camera: THREE.Camera, scene: THREE.Scene) => void;
};

export function makeNodeLabels(northTarget: THREE.Object3D, southTarget: THREE.Object3D): LabelsBundle {
  const renderer = new CSS2DRenderer();
  renderer.setSize(0, 0); // will be resized by caller
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.pointerEvents = "none";
  renderer.domElement.style.zIndex = "5"; // Between scene (1) and overlays (10)

  // Create offset anchors for node labels positioned off to the side
  const northAnchor = new THREE.Object3D();
  northAnchor.position.set(1.2, 0.8, 0); // Offset to the side and up from the node
  northTarget.add(northAnchor);

  const southAnchor = new THREE.Object3D();
  southAnchor.position.set(-1.2, -0.8, 0); // Offset to the opposite side and down from the node
  southTarget.add(southAnchor);

  const northEl = document.createElement("div");
  northEl.className = "label";
  northEl.textContent = "☊"; // North Node (Rahu) symbol only
  const northLabel = new CSS2DObject(northEl);
  northAnchor.add(northLabel);

  const southEl = document.createElement("div");
  southEl.className = "label";
  southEl.textContent = "☋"; // South Node (Ketu) symbol only
  const southLabel = new CSS2DObject(southEl);
  southAnchor.add(southLabel);

  // Raycaster for occlusion testing
  const raycaster = new THREE.Raycaster();
  let labelsEnabled = true;

  function setEnabled(enabled: boolean) {
    labelsEnabled = enabled;
    // Hide/show the entire labels overlay and the label objects for reliability
    renderer.domElement.style.display = enabled ? "block" : "none";
    northLabel.visible = enabled;
    southLabel.visible = enabled;
    updateLabelVisibility();
  }

  function updateLabelVisibility() {
    const display = labelsEnabled ? "block" : "none";
    northEl.style.display = display;
    southEl.style.display = display;
  }

  function updateOcclusion(camera: THREE.Camera, scene: THREE.Scene) {
    if (!labelsEnabled) return;

    // Get world positions of label anchors
    const northWorldPos = new THREE.Vector3();
    const southWorldPos = new THREE.Vector3();
    northAnchor.getWorldPosition(northWorldPos);
    southAnchor.getWorldPosition(southWorldPos);

    // Get camera position
    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);

    // Check occlusion for north label
    const northDirection = northWorldPos.clone().sub(cameraPos).normalize();
    const northDistance = cameraPos.distanceTo(northWorldPos);
    raycaster.set(cameraPos, northDirection);
    raycaster.far = northDistance - 0.1; // Stop just before the label
    
    const northIntersects = raycaster.intersectObjects(scene.children, true);
    const northOccluded = northIntersects.some(intersect => 
      intersect.object.type === 'Mesh' && 
      intersect.object !== northAnchor && 
      intersect.object !== northLabel &&
      intersect.distance < northDistance - 0.1
    );

    // Check occlusion for south label  
    const southDirection = southWorldPos.clone().sub(cameraPos).normalize();
    const southDistance = cameraPos.distanceTo(southWorldPos);
    raycaster.set(cameraPos, southDirection);
    raycaster.far = southDistance - 0.1; // Stop just before the label
    
    const southIntersects = raycaster.intersectObjects(scene.children, true);
    const southOccluded = southIntersects.some(intersect => 
      intersect.object.type === 'Mesh' && 
      intersect.object !== southAnchor && 
      intersect.object !== southLabel &&
      intersect.distance < southDistance - 0.1
    );

    // Update label visibility based on occlusion
    northEl.style.display = labelsEnabled && !northOccluded ? "block" : "none";
    southEl.style.display = labelsEnabled && !southOccluded ? "block" : "none";
  }

  return { renderer, northLabel, southLabel, setEnabled, updateOcclusion };
}
