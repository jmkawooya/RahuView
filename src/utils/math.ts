import * as THREE from "three";

export function degToRad(deg: number): number {
  return THREE.MathUtils.degToRad(deg);
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}


