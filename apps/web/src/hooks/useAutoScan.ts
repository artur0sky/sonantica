import { useEffect } from "react";
import { getServersConfig, createLibraryAdapter } from "../services/LibraryService";
import { useLibraryStore } from "@sonantica/media-library";
import { useMultiServerLibrary } from "./useMultiServerLibrary";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Hook to handle auto-scanning on app startup
 */
export function useAutoScan() {
  const { tracks, scanAllServers, triggerRescanAll } = useMultiServerLibrary();
  const autoScan = useSettingsStore((state) => state.autoScan);

  useEffect(() => {
    const config = getServersConfig();

    if (autoScan && config.servers.length > 0 && tracks.length === 0) {
      console.log("🔄 Auto-scanning servers on startup...");
      triggerRescanAll();
      scanAllServers();
    }

    // Load local playlists in Tauri if no server is active
    const isTauri =
      typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;
    if (isTauri && config.servers.length === 0) {
      const adapter = createLibraryAdapter();
      if (adapter && adapter.getPlaylists) {
        adapter.getPlaylists().then((playlists) => {
          useLibraryStore.getState().setPlaylists(playlists);
        });
      }
    }
  }, []); // Only run once on mount
}
