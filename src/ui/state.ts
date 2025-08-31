export type AppState = {
  time: number; // days
  isPlaying: boolean;
  speedMultiplier: number; // days per second multiplier
  inclinationDeg: number;
  showEcliptic: boolean;
  showLunarPlane: boolean;
  showLabels: boolean;
  showTrails: boolean;
  showSun: boolean;
  showShadows: boolean;
  showEclipse: boolean;
  showFills: boolean;
};

type Listener = () => void;

const state: AppState = {
  time: 0,
  isPlaying: true,
  speedMultiplier: 1,
  inclinationDeg: 5.145,
  showEcliptic: true,
  showLunarPlane: true,
  showLabels: true,
  showTrails: false,
  showSun: true,
  showShadows: true,
  showEclipse: false,
  showFills: false,
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


