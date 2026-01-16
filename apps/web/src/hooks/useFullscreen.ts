import { useEffect } from 'react';
import { useUIStore } from '@sonantica/ui';

// Check for Tauri
const isTauri =
  typeof window !== "undefined" &&
  ((window as any).__TAURI__ !== undefined ||
    (window as any).__TAURI_INTERNALS__ !== undefined);

export function useFullscreen() {
  useEffect(() => {
    if (!isTauri) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // F11: Toggle fullscreen
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
      } 
      // ESC: Exit fullscreen OR close expanded player (priority to expanded player)
      else if (e.key === 'Escape') {
        const isPlayerExpanded = useUIStore.getState().isPlayerExpanded;
        
        // If expanded player is open, close it (handled by ExpandedPlayer component)
        if (isPlayerExpanded) {
          // Let the ExpandedPlayer component handle this
          return;
        }
        
        // Otherwise, exit fullscreen if active
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
