import * as THREE from "three";
import { DEFAULT_INCLINATION_DEG, MOON_ORBIT_RADIUS, SUN_ORBIT_RADIUS } from "../utils/constants";

export type PlanesBundle = {
  group: THREE.Group;
  ecliptic: THREE.Mesh;
  eclipticFill: THREE.Mesh;
  lunarParent: THREE.Group;
  lunar: THREE.Mesh;
  lunarFill: THREE.Mesh;
  setInclinationDeg: (deg: number) => void;
  setFillsVisible: (v: boolean) => void;
};

export function makePlanes(): PlanesBundle {
  const group = new THREE.Group();

  const eclipticRingGeo = new THREE.RingGeometry(SUN_ORBIT_RADIUS * 0.98, SUN_ORBIT_RADIUS, 96, 1);
  const lunarRingGeo = new THREE.RingGeometry(MOON_ORBIT_RADIUS * 0.98, MOON_ORBIT_RADIUS, 96, 1);
  const eclipticMat = new THREE.MeshBasicMaterial({ color: 0xfff4d1, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
  const lunarMat = new THREE.MeshBasicMaterial({ color: 0xa1d3d6, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

  // Ecliptic aligned to XZ plane
  const ecliptic = new THREE.Mesh(eclipticRingGeo, eclipticMat);
  ecliptic.rotation.x = -Math.PI / 2; // make plane lie on XZ
  group.add(ecliptic);

  // Ecliptic fill (semi-transparent disc)
  const eclipticFillGeo = new THREE.CircleGeometry(SUN_ORBIT_RADIUS * 0.98, 96);
  const eclipticFillMat = new THREE.MeshBasicMaterial({
    color: 0xfff4d1,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const eclipticFill = new THREE.Mesh(eclipticFillGeo, eclipticFillMat);
  eclipticFill.rotation.x = -Math.PI / 2;
  eclipticFill.visible = false;
  group.add(eclipticFill);

  // Lunar plane in a parent to rotate by inclination around world X
  const lunarParent = new THREE.Group();
  const lunar = new THREE.Mesh(lunarRingGeo, lunarMat);
  lunar.rotation.x = -Math.PI / 2;
  lunarParent.add(lunar);
  group.add(lunarParent);

  const lunarFillGeo = new THREE.CircleGeometry(MOON_ORBIT_RADIUS * 0.98, 96);
  const lunarFillMat = new THREE.MeshBasicMaterial({
    color: 0xa1d3d6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const lunarFill = new THREE.Mesh(lunarFillGeo, lunarFillMat);
  lunarFill.rotation.x = -Math.PI / 2;
  lunarFill.visible = false;
  lunarParent.add(lunarFill);

  function setInclinationDeg(deg: number) {
    const rad = THREE.MathUtils.degToRad(deg);
    lunarParent.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
  }

  function setFillsVisible(v: boolean) {
    eclipticFill.visible = v;
    lunarFill.visible = v;
  }

  setInclinationDeg(DEFAULT_INCLINATION_DEG);

  return { group, ecliptic, eclipticFill, lunarParent, lunar, lunarFill, setInclinationDeg, setFillsVisible };
}


