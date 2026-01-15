/**
 * Platform Detection Utilities
 */

/**
 * Checks if the application is running in a Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && 
    ((window as any).__TAURI__ !== undefined || (window as any).__TAURI_INTERNALS__ !== undefined);
}


/**
 * Checks if the application is running in a browser environment (not Tauri/Mobile)
 */
export function isWeb(): boolean {
  return !isTauri();
}

/**
 * Checks if the application is running in a mobile environment
 * (This is a basic check, could be improved)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
