/**
 * Device detection utilities
 */

export function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function isDesktop(): boolean {
  return !isMobile();
}

/**
 * Get device-specific default values for app state
 */
export function getDeviceDefaults() {
  const mobile = isMobile();
  
  return {
    // Presenter pointer is useful for desktop presentations but not mobile touch
    showPointer: !mobile,
  };
}
