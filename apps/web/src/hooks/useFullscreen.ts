import { useEffect } from 'react';

// Check for Tauri
const isTauri =
  typeof window !== "undefined" &&
  ((window as any).__TAURI__ !== undefined ||
    (window as any).__TAURI_INTERNALS__ !== undefined);

export function useFullscreen() {
  useEffect(() => {
    if (!isTauri) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          const isFullscreen = await win.isFullscreen();
          await win.setFullscreen(!isFullscreen);
        } catch (err) {
          console.error('Failed to toggle fullscreen:', err);
        }
      } else if (e.key === 'Escape') {
         try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          const isFullscreen = await win.isFullscreen();
          if (isFullscreen) {
             e.preventDefault();
             await win.setFullscreen(false);
          }
        } catch (err) {
          // Ignore
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
