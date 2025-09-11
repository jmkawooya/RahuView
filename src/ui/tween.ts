import { actions, getState } from "./state";

type AngleKey = "sunAngle" | "moonAngle" | "nodalRegression";

type Tween = {
  key: AngleKey;
  from: number;
  to: number;
  duration: number;
  elapsed: number;
};

const activeTweens: Map<AngleKey, Tween> = new Map();

function wrap01(v: number): number {
  return ((v % 1) + 1) % 1;
}

function shortestDelta01(from: number, to: number): number {
  let d = to - from;
  d = ((d + 0.5) % 1 + 1) % 1 - 0.5; // map to [-0.5, 0.5)
  return d;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function startAngleTweens(targets: Partial<Record<AngleKey, number>>, durationSeconds = 1.5) {
  const s = getState();
  (Object.keys(targets) as AngleKey[]).forEach((key) => {
    const target = wrap01(targets[key]!);
    const existing = activeTweens.get(key);
    const current = existing
      ? wrap01(existing.from + shortestDelta01(existing.from, existing.to) * Math.min(existing.elapsed / existing.duration, 1))
      : (s as any)[key] as number;
    const tween: Tween = { key, from: current, to: target, duration: Math.max(0.0001, durationSeconds), elapsed: 0 };
    activeTweens.set(key, tween);
  });
}

export function updateTweens(deltaSeconds: number) {
  if (activeTweens.size === 0) return;
  const toDelete: AngleKey[] = [];
  activeTweens.forEach((tween, key) => {
    tween.elapsed = Math.min(tween.elapsed + deltaSeconds, tween.duration);
    const p = tween.elapsed / tween.duration;
    const e = easeInOut(p);
    const value = wrap01(tween.from + shortestDelta01(tween.from, tween.to) * e);
    actions.set(key as any, value as any);
    if (p >= 1) {
      toDelete.push(key);
    }
  });
  toDelete.forEach((key) => activeTweens.delete(key));
}


