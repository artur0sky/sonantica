import { useEffect, useRef } from 'react';

const KEY_APP_VERSION = 'sonantica_app_version';

/**
 * Manages app versioning and cleanup on updates.
 * Adapted for Desktop (Tauri).
 */
export function useVersionManager() {
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const checkVersion = async () => {
      // @ts-ignore - defined in vite.config.ts
      const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';
      const storedVersion = localStorage.getItem(KEY_APP_VERSION);

      console.debug(`[VersionManager] Desktop Current: ${currentVersion}, Stored: ${storedVersion}`);

      if (!storedVersion || storedVersion !== currentVersion) {
        console.group('[VersionManager] Desktop Update Detected');
        
        // Cleanup logic if needed
        // For now just update the version
        localStorage.setItem(KEY_APP_VERSION, currentVersion);
        
        console.groupEnd();
      }
    };

    setTimeout(checkVersion, 100);
  }, []);
}
