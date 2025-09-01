import * as THREE from "three";
import { MOON_ORBIT_RADIUS } from "../utils/constants";

export type NodesBundle = {
  group: THREE.Group;
  northMarker: THREE.Object3D;
  southMarker: THREE.Object3D;
  setInclinationRad: (rad: number) => void;
  setRadius: (radius: number) => void;
};

export function makeNodes(radius = MOON_ORBIT_RADIUS): NodesBundle {
  const group = new THREE.Group();

  const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);

  const northMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x8a3331 }),
  );
  const southMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x8a3331 }),
  );
  group.add(northMarker, southMarker);

  let currentInclinationRad = 0;
  let currentRadius = radius;

  function updatePositions() {
    const eclipticNormal = new THREE.Vector3(0, 1, 0);
    const lunarNormal = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), currentInclinationRad);
    const cross = new THREE.Vector3().crossVectors(eclipticNormal, lunarNormal);
    const dir = cross.lengthSq() < 1e-8 ? new THREE.Vector3(1, 0, 0) : cross.normalize();

    const pA = dir.clone().multiplyScalar(currentRadius);
    const pB = dir.clone().multiplyScalar(-currentRadius);

    const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, pA.x, pA.y, pA.z);
    pos.setXYZ(1, pB.x, pB.y, pB.z);
    pos.needsUpdate = true;

    northMarker.position.copy(pA);
    southMarker.position.copy(pB);
  }

  function setInclinationRad(rad: number) {
    currentInclinationRad = rad;
    updatePositions();
  }

  function setRadius(newRadius: number) {
    currentRadius = newRadius;
    updatePositions();
  }

  // Initialize positions
  setInclinationRad(0);

  return {
    group,
    northMarker,
    southMarker,
    setInclinationRad,
    setRadius,
  };
}


