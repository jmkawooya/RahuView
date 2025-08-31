import * as THREE from "three";
import { initScene } from "./scene/initScene";
import { makePlanes } from "./scene/planes";
import { makeNodes } from "./scene/nodes";
import { makeNodeLabels, makePlaneNameLabels } from "./scene/labels";
import { makeMoonSystem } from "./scene/moon";
import { makeSunSystem } from "./scene/sun";
import { initDomControls } from "./ui/domControls";
import { actions, getState, subscribe } from "./ui/state";
import {
  ECLIPSE_NODE_THRESHOLD_DEG,
  ECLIPSE_PHASE_THRESHOLD_DEG,
  MOON_ORBIT_RADIUS,
  SIDEREAL_MONTH_DAYS,
  SIDEREAL_YEAR_DAYS,
  TWO_PI,
} from "./utils/constants";

const canvasWrap = document.getElementById("canvas-wrap");
if (!canvasWrap) throw new Error("Missing #canvas-wrap container");

const { scene, renderer, camera, controls } = initScene(canvasWrap);

// Planes and nodes
const planes = makePlanes();
scene.add(planes.group);

const nodes = makeNodes();
scene.add(nodes.group);
nodes.setInclinationRad(THREE.MathUtils.degToRad(getState().inclinationDeg));

// Labels and overlay
const labels = makeNodeLabels(nodes.northMarker, nodes.southMarker);
canvasWrap.appendChild(labels.renderer.domElement);
labels.renderer.domElement.style.width = "100%";
labels.renderer.domElement.style.height = "100%";

// Plane name labels
const planeLabels = makePlaneNameLabels(planes.ecliptic, planes.lunarParent);

// Moon system
const moonSys = makeMoonSystem();
scene.add(moonSys.root);
moonSys.setInclinationDeg(getState().inclinationDeg);

// Sun system
const sunSys = makeSunSystem();
scene.add(sunSys.root);

// DOM controls wiring
initDomControls(
  {
    setShadows: (enabled: boolean) => {
      renderer.shadowMap.enabled = enabled;
      sunSys.light.castShadow = enabled;
    },
  },
  {
    ecliptic: { setVisible: (v: boolean) => (planes.ecliptic.visible = v) },
    lunar: { setVisible: (v: boolean) => (planes.lunar.visible = v) },
    labels: { setVisible: (v: boolean) => (labels.setEnabled(v), planeLabels.setEnabled(v)) },
    sun: { setVisible: (v: boolean) => sunSys.setVisible(v) },
  },
);

const clock = new THREE.Clock();
let elapsedDays = 0; // simulation clock in days

const eclipseIndicator = document.getElementById("eclipse-indicator") as HTMLDivElement | null;
const normalNodeColor = new THREE.Color(0x8a3331);
const highlightNodeColor = new THREE.Color(0xf8b933);

function computeAndRender() {
  const deltaSeconds = clock.getDelta();
  const s = getState();
  if (s.isPlaying) {
    elapsedDays += deltaSeconds * s.speedMultiplier;
  }

  // Angles
  const thetaMoon = s.isPlaying ? elapsedDays * (TWO_PI / SIDEREAL_MONTH_DAYS) : s.time * TWO_PI;
  const thetaSun = elapsedDays * (TWO_PI / SIDEREAL_YEAR_DAYS);

  moonSys.setAngleRad(thetaMoon);
  sunSys.setAngleRad(thetaSun);

  // Visibilities from state (in case changed via keyboard etc.)
  planes.ecliptic.visible = s.showEcliptic;
  planes.lunar.visible = s.showLunarPlane;
  labels.setEnabled(s.showLabels);
  planeLabels.setEnabled(s.showLabels);
  sunSys.setVisible(s.showSun);
  renderer.shadowMap.enabled = s.showShadows;
  sunSys.light.castShadow = s.showShadows;
  planes.setFillsVisible(s.showFills);

  // Eclipse detection
  const sunPos = new THREE.Vector3();
  const moonPos = new THREE.Vector3();
  sunSys.sunMesh.getWorldPosition(sunPos);
  moonSys.moon.getWorldPosition(moonPos);

  const u = sunPos.clone().normalize(); // Earth->Sun
  const v = moonPos.clone().normalize(); // Earth->Moon
  const sep = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(u.dot(v), -1, 1)));
  const latMoonDeg = THREE.MathUtils.radToDeg(Math.asin(moonPos.y / MOON_ORBIT_RADIUS));
  const eclipse = sep <= ECLIPSE_PHASE_THRESHOLD_DEG && Math.abs(latMoonDeg) <= ECLIPSE_NODE_THRESHOLD_DEG;

  if (eclipseIndicator) {
    eclipseIndicator.style.display = eclipse && s.showEclipse ? "block" : "none";
  }
  const northMat = (nodes.northMarker as THREE.Mesh).material as THREE.MeshBasicMaterial;
  const southMat = (nodes.southMarker as THREE.Mesh).material as THREE.MeshBasicMaterial;
  northMat.color.copy(eclipse ? highlightNodeColor : normalNodeColor);
  southMat.color.copy(eclipse ? highlightNodeColor : normalNodeColor);

  // Render passes
  labels.renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  labels.renderer.render(scene, camera);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(computeAndRender);
}

computeAndRender();

// React to state changes
subscribe(() => {
  const s = getState();
  planes.setInclinationDeg(s.inclinationDeg);
  moonSys.setInclinationDeg(s.inclinationDeg);
  nodes.setInclinationRad(THREE.MathUtils.degToRad(s.inclinationDeg));
});

// Keyboard accessibility: space = play/pause, left/right = scrub
window.addEventListener("keydown", (e) => {
  const s = getState();
  if (e.code === "Space") {
    actions.set("isPlaying", !s.isPlaying);
    e.preventDefault();
  } else if (e.code === "ArrowRight") {
    actions.set("isPlaying", false);
    const next = ((s.time + 0.01) % 1 + 1) % 1;
    actions.set("time", next);
  } else if (e.code === "ArrowLeft") {
    actions.set("isPlaying", false);
    const next = ((s.time - 0.01) % 1 + 1) % 1;
    actions.set("time", next);
  }
});


