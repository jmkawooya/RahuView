import * as THREE from "three";
import { SHADOW_MAP_SIZE, SUN_ORBIT_RADIUS, SUN_RADIUS } from "../utils/constants";

export type SunSystem = {
  root: THREE.Group;
  orbitGroup: THREE.Group;
  sunMesh: THREE.Mesh;
  light: THREE.DirectionalLight;
  setAngleRad: (theta: number) => void;
  setVisible: (v: boolean) => void;
};

export function makeSunSystem(orbitRadius = SUN_ORBIT_RADIUS): SunSystem {
  const root = new THREE.Group();
  const orbitGroup = new THREE.Group();
  root.add(orbitGroup);

  const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 20, 14);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(orbitRadius, 0, 0);
  orbitGroup.add(sunMesh);

  const light = new THREE.DirectionalLight(0xffffff, 1.15);
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  light.position.set(orbitRadius, 0, 0);
  // Configure shadow camera to cover Earth and Moon throughout the orbit
  const shadowCam = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.5, 60);
  light.shadow.camera = shadowCam;
  orbitGroup.add(light);

  // Target at Earth (origin)
  light.target.position.set(0, 0, 0);
  root.add(light.target);

  function setAngleRad(theta: number) {
    orbitGroup.rotation.y = theta;
  }

  function setVisible(v: boolean) {
    root.visible = v;
  }

  return { root, orbitGroup, sunMesh, light, setAngleRad, setVisible };
}


