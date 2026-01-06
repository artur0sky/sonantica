import { useEffect } from "react";
import { getServersConfig } from "../services/LibraryService";
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
  }, []); // Only run once on mount
}
