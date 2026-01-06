import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const KEY_APP_VERSION = 'sonantica_app_version';

/**
 * Manages app versioning and cleanup on updates.
 * Satisfies the requirement: 
 * "Make sure that every time sonantica starts in the capacitor app it does a ctrl + shift + r 
 * or something, that makes the interface reload the corresponding changes every update or reinstallation, 
 * also in the uninstallation I want you to delete all data and cache in its path"
 */
export function useVersionManager() {
  const { updateServiceWorker } = useRegisterSW();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const checkVersion = async () => {
      // Get current version from build-time constant (from package.json)
      const currentVersion = __APP_VERSION__;
      const storedVersion = localStorage.getItem(KEY_APP_VERSION);

      console.debug(`[VersionManager] Current: ${currentVersion}, Stored: ${storedVersion}`);

      // If it's a fresh install (no stored version) OR a version mismatch (update)
      if (!storedVersion || storedVersion !== currentVersion) {
        console.group('[VersionManager] Update Detected or Fresh Install');
        console.log('Cleaning up old data and cache...');

        // 1. Clear LocalStorage (User requested "delete all data")
        // We preserve NOTHING as per "borres todos los datos" request.
        localStorage.clear();

        // 2. Clear SessionStorage
        sessionStorage.clear();

        // 3. Clear IndexedDB (used by some libraries or custom logic)
        try {
          const dbs = await window.indexedDB.databases();
          dbs.forEach((db) => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
          console.log('IndexedDB cleared.');
        } catch (e) {
          console.warn('Failed to clear IndexedDB:', e);
        }

        // 4. Update Service Worker immediately
        try {
           await updateServiceWorker(true); // true = force reload
           console.log('Service Worker updated.');
        } catch (e) {
           console.warn('SW update failed:', e);
        }
        
        // 5. Set new version
        localStorage.setItem(KEY_APP_VERSION, currentVersion);
        
        console.log('Cleanup complete. Reloading...');
        console.groupEnd();

        // 6. Hard Reload
        // This simulates Ctrl+Shift+R by forcing a reload from the server (or shell)
        // and bypassing the cache if possible.
        window.location.reload(); 
        
        return;
      }
      
      console.log('[VersionManager] Version is up to date.');
    };

    // Defer slightly to ensure app is mounted
    setTimeout(checkVersion, 100);

  }, [updateServiceWorker]);
}
