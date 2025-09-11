export const SIDEREAL_YEAR_DAYS = 365.25;
export const SIDEREAL_MONTH_DAYS = 27.321661;
export const DEFAULT_INCLINATION_DEG = 5.145;
export const TWO_PI = Math.PI * 2;
export const MOON_TO_SUN_RATE = SIDEREAL_YEAR_DAYS / SIDEREAL_MONTH_DAYS;

// Scene scale - optimized for eclipse demonstration
export const EARTH_RADIUS = 1.2; // Default Earth size
export const MOON_ORBIT_RADIUS = 7.0; // Default Moon orbit radius
export const MOON_RADIUS = 0.4; // Default Moon size
export const SUN_ORBIT_RADIUS = 20.0; // Default Sun orbit radius
export const SUN_RADIUS = 2.5; // Default Sun size

// Nodal regression - 18.6 year cycle
export const NODAL_REGRESSION_DAYS = 6798.4; // 18.6 years

// Shadows and thresholds - more generous for demonstration
export const SHADOW_MAP_SIZE = 2048;
// Deprecated thresholds (kept for historical context; no longer used)
export const ECLIPSE_NODE_THRESHOLD_DEG = 10.0;
export const ECLIPSE_PHASE_THRESHOLD_DEG = 8.0;

