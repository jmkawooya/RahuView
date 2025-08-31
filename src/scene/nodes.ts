import * as THREE from "three";
import { MOON_ORBIT_RADIUS } from "../utils/constants";

export type NodesBundle = {
  group: THREE.Group;
  northMarker: THREE.Object3D;
  southMarker: THREE.Object3D;
  setInclinationRad: (rad: number) => void;
};

export function makeNodes(radius = MOON_ORBIT_RADIUS): NodesBundle {
  const group = new THREE.Group();

  const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);

  const northMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x8a3331 }),
  );
  const southMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x8a3331 }),
  );
  group.add(northMarker, southMarker);

  function updateForInclination(rad: number) {
    const eclipticNormal = new THREE.Vector3(0, 1, 0);
    const lunarNormal = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), rad);
    const cross = new THREE.Vector3().crossVectors(eclipticNormal, lunarNormal);
    const dir = cross.lengthSq() < 1e-8 ? new THREE.Vector3(1, 0, 0) : cross.normalize();

    const pA = dir.clone().multiplyScalar(radius);
    const pB = dir.clone().multiplyScalar(-radius);

    const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, pA.x, pA.y, pA.z);
    pos.setXYZ(1, pB.x, pB.y, pB.z);
    pos.needsUpdate = true;

    northMarker.position.copy(pA);
    southMarker.position.copy(pB);
  }

  return {
    group,
    northMarker,
    southMarker,
    setInclinationRad: updateForInclination,
  };
}


