import { useEffect } from "react";
import { getServersConfig } from "../services/LibraryService";
import { useMultiServerLibrary } from "./useMultiServerLibrary";

/**
 * Hook to handle auto-scanning on app startup
 */
export function useAutoScan() {
  const { tracks, scanAllServers } = useMultiServerLibrary();

  useEffect(() => {
    const autoScan = localStorage.getItem("sonantica:auto-scan") === "true";
    const config = getServersConfig();

    if (autoScan && config.servers.length > 0 && tracks.length === 0) {
      console.log("🔄 Auto-scanning servers on startup...");
      scanAllServers();
    }
  }, []); // Only run once on mount
}
