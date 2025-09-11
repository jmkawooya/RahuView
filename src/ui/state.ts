import {
  EARTH_RADIUS,
  MOON_RADIUS,
  MOON_ORBIT_RADIUS,
  SUN_ORBIT_RADIUS,
  SUN_RADIUS,
} from "../utils/constants";
import { getDeviceDefaults } from "../utils/device";

export type AppState = {
  time: number; // days
  isPlaying: boolean;
  speedMultiplier: number; // days per second multiplier
  inclinationDeg: number;
  
  // Independent position controls
  sunAngle: number; // 0-1 around ecliptic
  moonAngle: number; // 0-1 around lunar orbit
  nodalRegression: number; // 0-1 nodal axis rotation
  
  // Adjustable scale/distances and thresholds
  earthRadius: number;
  moonRadius: number;
  moonOrbitRadius: number;
  sunOrbitRadius: number;
  sunRadius: number;
  // nodeThresholdDeg removed (deprecated)
  
  showEcliptic: boolean;
  showLunarPlane: boolean;
  showLabels: boolean;
  showEclipse: boolean;
  showFills: boolean;
  showDebug: boolean;
  showControlsPanel: boolean;
  showPointer: boolean;
};

type Listener = () => void;

// Get device-specific defaults
const deviceDefaults = getDeviceDefaults();

const state: AppState = {
  time: 0,
  isPlaying: false, // Start paused for manual control
  speedMultiplier: 0.5, // Slower default speed
  inclinationDeg: 15, // Reduced inclination as requested
  
  // Independent position controls - start with an interesting eclipse setup
  sunAngle: 0, // Sun at 0° (north node position)
  moonAngle: 0, // Start Moon at 0°
  nodalRegression: 0, // Nodes aligned with sun-moon line
  
  // Adjustable defaults (from constants)
  earthRadius: EARTH_RADIUS,
  moonRadius: MOON_RADIUS,
  moonOrbitRadius: MOON_ORBIT_RADIUS,
  sunOrbitRadius: SUN_ORBIT_RADIUS,
  sunRadius: SUN_RADIUS,
  
  showEcliptic: true,
  showLunarPlane: true,
  showLabels: true,
  showEclipse: true,
  showFills: true,
  showDebug: false,
  showControlsPanel: true,
  showPointer: deviceDefaults.showPointer, // Device-specific default (desktop: true, mobile: false)
};

const listeners: Set<Listener> = new Set();

export function getState(): AppState {
  return state;
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn();
}

export const actions = {
  set<K extends keyof AppState>(key: K, value: AppState[K]) {
    (state as AppState)[key] = value;
    emit();
  },
};

type BooleanKeys = {
  [K in keyof AppState]: AppState[K] extends boolean ? K : never;
}[keyof AppState];

export const boolActions = {
  toggle(key: BooleanKeys) {
    state[key] = !state[key];
    emit();
  },
  advance(deltaDays: number) {
    state.time += deltaDays;
    emit();
  },
};


