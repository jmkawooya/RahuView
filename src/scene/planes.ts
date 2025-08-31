import * as THREE from "three";
import { DEFAULT_INCLINATION_DEG, MOON_ORBIT_RADIUS, SUN_ORBIT_RADIUS } from "../utils/constants";

export type PlanesBundle = {
  group: THREE.Group;
  ecliptic: THREE.Mesh;
  lunarParent: THREE.Group;
  lunar: THREE.Mesh;
  setInclinationDeg: (deg: number) => void;
};

export function makePlanes(radius = MOON_ORBIT_RADIUS): PlanesBundle {
  const group = new THREE.Group();

  const ringGeo = new THREE.RingGeometry(radius * 0.98, radius, 64, 1);
  const eclipticMat = new THREE.MeshBasicMaterial({ color: 0xfff4d1, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
  const lunarMat = new THREE.MeshBasicMaterial({ color: 0xa1d3d6, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });

  // Ecliptic aligned to XZ plane
  const ecliptic = new THREE.Mesh(ringGeo, eclipticMat);
  ecliptic.rotation.x = -Math.PI / 2; // make plane lie on XZ
  group.add(ecliptic);

  // Lunar plane in a parent to rotate by inclination around world X
  const lunarParent = new THREE.Group();
  // Use the same radius as the Moon orbit for clarity
  const lunarRing = new THREE.RingGeometry(radius * 0.98, radius, 64, 1);
  const lunar = new THREE.Mesh(lunarRing, lunarMat);
  lunar.rotation.x = -Math.PI / 2;
  lunarParent.add(lunar);
  group.add(lunarParent);

  function setInclinationDeg(deg: number) {
    const rad = THREE.MathUtils.degToRad(deg);
    lunarParent.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
  }

  setInclinationDeg(DEFAULT_INCLINATION_DEG);

  return { group, ecliptic, lunarParent, lunar, setInclinationDeg };
}


