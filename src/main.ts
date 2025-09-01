import * as THREE from "three";
import { initScene } from "./scene/initScene";
import { makePlanes } from "./scene/planes";
import { makeNodes } from "./scene/nodes";
import { makeNodeLabels } from "./scene/labels";
import { makeMoonSystem } from "./scene/moon";
import { makeSunSystem } from "./scene/sun";
import { makeEarth } from "./scene/earth";
import { initDomControls } from "./ui/domControls";
import { actions, getState, subscribe } from "./ui/state";
import { SIDEREAL_MONTH_DAYS, SIDEREAL_YEAR_DAYS, NODAL_REGRESSION_DAYS, TWO_PI } from "./utils/constants";

const canvasWrap = document.getElementById("canvas-wrap");
if (!canvasWrap) throw new Error("Missing #canvas-wrap container");

const { scene, renderer, camera, controls, onResize, starfield } = initScene(canvasWrap);

// Planes and nodes
const planes = makePlanes();
scene.add(planes.group);

const nodes = makeNodes();
scene.add(nodes.group);
nodes.setInclinationRad(THREE.MathUtils.degToRad(getState().inclinationDeg));
// Ensure lunar/ecliptic plane inclination is applied on first load
planes.setInclinationDeg(getState().inclinationDeg);

// Labels and overlay
const labels = makeNodeLabels(nodes.northMarker, nodes.southMarker);
canvasWrap.appendChild(labels.renderer.domElement);
labels.renderer.domElement.style.width = "100%";
labels.renderer.domElement.style.height = "100%";

// Set initial size for labels renderer to match the main renderer
labels.renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);

// Earth system
const earthSys = makeEarth();
scene.add(earthSys.earth);

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
    setShadows: (_enabled: boolean) => {
      // no-op; shadows always on
    },
  },
  {
    ecliptic: { setVisible: (v: boolean) => (planes.ecliptic.visible = v) },
    lunar: { setVisible: (v: boolean) => (planes.lunar.visible = v) },
    labels: { setVisible: (v: boolean) => labels.setEnabled(v) },
    sun: { setVisible: (v: boolean) => sunSys.setVisible(v) },
  },
);

const clock = new THREE.Clock();
let elapsedDays = 0; // simulation clock in days
let elapsedSecondsTotal = 0;

// Track renderer dimensions to avoid unnecessary resize calls
let lastRendererWidth = renderer.domElement.clientWidth;
let lastRendererHeight = renderer.domElement.clientHeight;

// Register resize callback for labels renderer
onResize(() => {
  const currentWidth = renderer.domElement.clientWidth;
  const currentHeight = renderer.domElement.clientHeight;
  labels.renderer.setSize(currentWidth, currentHeight);
  lastRendererWidth = currentWidth;
  lastRendererHeight = currentHeight;
});

const eclipseIndicator = document.getElementById("eclipse-indicator") as HTMLDivElement | null;
const zoomValueEl = document.getElementById("zoomValue") as HTMLSpanElement | null;
const zoomOverlay = document.getElementById("zoom-overlay") as HTMLDivElement | null;
const normalNodeColor = new THREE.Color(0x8a3331);
const highlightNodeColor = new THREE.Color(0xf8b933);

function computeAndRender() {
  const deltaSeconds = clock.getDelta();
  elapsedSecondsTotal += deltaSeconds;
  const s = getState();
  
  // Update elapsed time if playing
  if (s.isPlaying) {
    elapsedDays += deltaSeconds * s.speedMultiplier;
    
    // Update position controls based on automatic motion
    const newSunAngle = (elapsedDays * (TWO_PI / SIDEREAL_YEAR_DAYS)) / TWO_PI % 1;
    const newMoonAngle = (elapsedDays * (TWO_PI / SIDEREAL_MONTH_DAYS)) / TWO_PI % 1;
    const newNodalRegression = (elapsedDays * (TWO_PI / NODAL_REGRESSION_DAYS)) / TWO_PI % 1;
    
    actions.set("sunAngle", newSunAngle);
    actions.set("moonAngle", newMoonAngle);
    actions.set("nodalRegression", newNodalRegression);
  }

  // Calculate positions from independent controls
  const sunAngleRad = s.sunAngle * TWO_PI;
  const moonAngleRad = s.moonAngle * TWO_PI;
  const nodalRegressionRad = s.nodalRegression * TWO_PI;

  // Apply positions
  sunSys.setAngleRad(sunAngleRad);
  moonSys.setAngleRad(moonAngleRad);
  
  // Apply nodal regression (rotate the entire lunar orbital plane)
  nodes.group.rotation.y = nodalRegressionRad;
  planes.group.rotation.y = nodalRegressionRad;
  moonSys.root.rotation.y = nodalRegressionRad;

  // Get sun position for eclipse calculations
  const sunPos = new THREE.Vector3();
  sunSys.sunMesh.getWorldPosition(sunPos);
  // Camera world position for visibility/overlap checks
  const cameraPos = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);

  // Visibilities from state
  planes.ecliptic.visible = s.showEcliptic;
  planes.lunar.visible = s.showLunarPlane;
  labels.setEnabled(s.showLabels);
  sunSys.setVisible(true);
  renderer.shadowMap.enabled = true;
  sunSys.light.castShadow = true;
  planes.setFillsVisible(s.showFills);

  // Geometry-based eclipse detection using multi-point sampling on body surfaces
  const moonPos = new THREE.Vector3();
  moonSys.moon.getWorldPosition(moonPos);
  const earthPos = new THREE.Vector3();
  earthSys.earth.getWorldPosition(earthPos);

  function disksOverlapAtObserver(observer: THREE.Vector3, aPos: THREE.Vector3, aRadius: number, bPos: THREE.Vector3, bRadius: number): boolean {
    const toA = aPos.clone().sub(observer);
    const toB = bPos.clone().sub(observer);
    const dA = toA.length();
    const dB = toB.length();
    if (dA < 1e-6 || dB < 1e-6) return false;
    const dirA = toA.clone().normalize();
    const dirB = toB.clone().normalize();
    const sep = Math.acos(THREE.MathUtils.clamp(dirA.dot(dirB), -1, 1));
    const appA = Math.atan(aRadius / dA);
    const appB = Math.atan(bRadius / dB);
    return sep <= (appA + appB);
  }

  function makeTangentBasis(dir: THREE.Vector3) {
    const up = new THREE.Vector3(0, 1, 0);
    const fallback = Math.abs(dir.dot(up)) < 0.99 ? up : new THREE.Vector3(1, 0, 0);
    const x = new THREE.Vector3().crossVectors(dir, fallback).normalize();
    const y = new THREE.Vector3().crossVectors(x, dir).normalize();
    return { x, y };
  }

  function sampleSurfacePoints(center: THREE.Vector3, faceDir: THREE.Vector3, radius: number): THREE.Vector3[] {
    const dir = faceDir.clone().normalize();
    const { x, y } = makeTangentBasis(dir);
    const r = radius;
    const diag = 1 / Math.SQRT2;
    return [
      center.clone(),
      center.clone().add(x.clone().multiplyScalar(r)),
      center.clone().add(x.clone().multiplyScalar(-r)),
      center.clone().add(y.clone().multiplyScalar(r)),
      center.clone().add(y.clone().multiplyScalar(-r)),
      center.clone().add(x.clone().add(y).multiplyScalar(r * diag)),
      center.clone().add(x.clone().sub(y).multiplyScalar(r * diag)),
      center.clone().add(x.clone().multiplyScalar(-1).add(y).multiplyScalar(r * diag)),
      center.clone().add(x.clone().multiplyScalar(-1).sub(y).multiplyScalar(r * diag)),
    ];
  }

  // Solar eclipse: any point on Earth's sunward hemisphere sees Moon overlap Sun
  const earthToSunDir = sunPos.clone().sub(earthPos).normalize();
  const earthSamples = sampleSurfacePoints(earthPos, earthToSunDir, getState().earthRadius);
  const solarEclipse = earthSamples.some((p) => {
    // Must be on sunward side (allow limb):
    const onSunward = p.clone().sub(earthPos).dot(earthToSunDir) >= -1e-6;
    if (!onSunward) return false;
    // Moon must be closer than Sun from this point
    const dSun = sunPos.clone().sub(p).length();
    const dMoon = moonPos.clone().sub(p).length();
    if (dMoon >= dSun) return false;
    return disksOverlapAtObserver(p, sunPos, getState().sunRadius, moonPos, getState().moonRadius);
  });

  // Lunar eclipse: any point on Moon's sunward hemisphere sees Earth overlap Sun
  const moonToSunDir = sunPos.clone().sub(moonPos).normalize();
  const moonSamples = sampleSurfacePoints(moonPos, moonToSunDir, getState().moonRadius);
  const lunarEclipse = moonSamples.some((p) => {
    const onSunward = p.clone().sub(moonPos).dot(moonToSunDir) >= -1e-6;
    if (!onSunward) return false;
    const dSun = sunPos.clone().sub(p).length();
    const dEarth = earthPos.clone().sub(p).length();
    if (dEarth >= dSun) return false;
    return disksOverlapAtObserver(p, sunPos, getState().sunRadius, earthPos, getState().earthRadius);
  });

  const anyEclipse = solarEclipse || lunarEclipse;

  // Hide node markers when they visually overlap the Sun from the camera's viewpoint
  (function updateNodeMarkerVisibility(){
    const north = nodes.northMarker as THREE.Object3D;
    const south = nodes.southMarker as THREE.Object3D;

    const northPos = new THREE.Vector3();
    const southPos = new THREE.Vector3();
    north.getWorldPosition(northPos);
    south.getWorldPosition(southPos);

    const toSun = new THREE.Vector3().subVectors(sunPos, cameraPos);
    const sunDistance = toSun.length();
    if (sunDistance < 1e-6) {
      north.visible = true;
      south.visible = true;
      return;
    }
    toSun.normalize();

    const sunApparentRadius = Math.atan(getState().sunRadius / sunDistance);
    const markerRadius = 0.12; // geometry radius defined in nodes.ts

    function overlapsSun(markerPos: THREE.Vector3): boolean {
      const toMarker = new THREE.Vector3().subVectors(markerPos, cameraPos);
      const markerDistance = toMarker.length();
      if (markerDistance < 1e-6) return false;
      const markerApparentRadius = Math.atan(markerRadius / markerDistance);
      toMarker.normalize();
      const separation = Math.acos(THREE.MathUtils.clamp(toSun.dot(toMarker), -1, 1));
      // Slight padding to avoid flicker at the edge
      return separation <= (sunApparentRadius + markerApparentRadius * 1.1);
    }

    north.visible = !overlapsSun(northPos);
    south.visible = !overlapsSun(southPos);
  })();

  // Let Three.js handle shadows naturally based on Sun's light position
  // Both Earth and Moon always cast and receive shadows as configured

  // Update eclipse indicator
  if (eclipseIndicator) {
    if (anyEclipse && s.showEclipse) {
      eclipseIndicator.style.display = "block";
      eclipseIndicator.textContent = solarEclipse ? "Solar Eclipse!" : "Lunar Eclipse!";
      eclipseIndicator.style.color = solarEclipse ? "#f8b933" : "#8a3331";
    } else {
      eclipseIndicator.style.display = "none";
    }
  }
  
  // Update node colors
  const northMat = (nodes.northMarker as THREE.Mesh).material as THREE.MeshBasicMaterial;
  const southMat = (nodes.southMarker as THREE.Mesh).material as THREE.MeshBasicMaterial;
  northMat.color.copy(anyEclipse ? highlightNodeColor : normalNodeColor);
  southMat.color.copy(anyEclipse ? highlightNodeColor : normalNodeColor);

  // Render passes
  // Only resize labels renderer when dimensions actually change
  const currentWidth = renderer.domElement.clientWidth;
  const currentHeight = renderer.domElement.clientHeight;
  if (currentWidth !== lastRendererWidth || currentHeight !== lastRendererHeight) {
    labels.renderer.setSize(currentWidth, currentHeight);
    lastRendererWidth = currentWidth;
    lastRendererHeight = currentHeight;
  }
  
  // Animate background starfield twinkling
  starfield.update(elapsedSecondsTotal);

  // Subtle Sun emissive pulsing
  sunSys.update(elapsedSecondsTotal);

  // Gently rotate clouds layer if present
  if ((earthSys as any).clouds) {
    (earthSys as any).clouds.rotation.y += deltaSeconds * 0.02;
  }

  labels.renderer.render(scene, camera);
  // Update zoom debug readout (camera distance to target) only when Debug is enabled
  if (zoomOverlay) {
    if (getState().showDebug) {
      zoomOverlay.style.display = 'block';
      if (zoomValueEl) {
        const camDistance = camera.position.distanceTo(controls.target);
        zoomValueEl.textContent = `(${camDistance.toFixed(1)})`;
      }
    } else {
      zoomOverlay.style.display = 'none';
    }
  }
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
  
  // Live updates for scale and distances
  earthSys.earth.scale.setScalar(s.earthRadius / 1); // base scaling relative to initial
  earthSys.setRadius?.(s.earthRadius);
  moonSys.setRadius(s.moonRadius);
  moonSys.setOrbitRadius(s.moonOrbitRadius);
  sunSys.setRadius(s.sunRadius);
  sunSys.setOrbitRadius(s.sunOrbitRadius);
  planes.setRadii(s.sunOrbitRadius, s.moonOrbitRadius);
  nodes.setRadius(s.moonOrbitRadius);
});

// Keyboard accessibility: space = play/pause, arrow keys = position controls
window.addEventListener("keydown", (e) => {
  const s = getState();
  if (e.code === "Space") {
    actions.set("isPlaying", !s.isPlaying);
    e.preventDefault();
  } else if (e.code === "ArrowRight") {
    // Advance moon position
    actions.set("isPlaying", false);
    const next = (s.moonAngle + 0.01) % 1;
    actions.set("moonAngle", next);
    e.preventDefault();
  } else if (e.code === "ArrowLeft") {
    // Reverse moon position
    actions.set("isPlaying", false);
    const next = (s.moonAngle - 0.01 + 1) % 1;
    actions.set("moonAngle", next);
    e.preventDefault();
  } else if (e.code === "ArrowUp") {
    // Advance sun position
    actions.set("isPlaying", false);
    const next = (s.sunAngle + 0.005) % 1;
    actions.set("sunAngle", next);
    e.preventDefault();
  } else if (e.code === "ArrowDown") {
    // Reverse sun position
    actions.set("isPlaying", false);
    const next = (s.sunAngle - 0.005 + 1) % 1;
    actions.set("sunAngle", next);
    e.preventDefault();
  }
});


