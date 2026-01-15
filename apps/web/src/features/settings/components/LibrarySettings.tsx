import { useState } from "react";
import {
  SettingSection,
  SettingRow,
  Switch,
  Button,
  Select,
} from "@sonantica/ui";
import { useMultiServerLibrary } from "../../../hooks/useMultiServerLibrary";
import { useSettingsStore } from "../../../stores/settingsStore";
import {
  useLocalLibrary,
  type LocalFolder,
} from "../../../hooks/useLocalLibrary";
import {
  IconFolder,
  IconServer,
  IconRefresh,
  IconTrash,
  IconBooks,
  IconClock,
  IconMusic,
  IconFolderPlus,
} from "@tabler/icons-react";
import { ServersSection } from "../../library/components/ServersSection";
import { isTauri } from "@sonantica/shared";

export function LibrarySettings() {
  const isDesktop = isTauri();
  const {
    clearLibrary: clearServerLibrary,
    triggerRescanAll: rescanServers,
    isScanning: isServerScanning,
  } = useMultiServerLibrary();
  const {
    folders,
    isScanning: isLocalScanning,
    addFolder,
    removeFolder,
    scanAllFolders,
    isTauriAvailable,
  } = useLocalLibrary();

  const {
    autoScan,
    watchFolders,
    parallelScanning,
    scanFileSizeLimit,
    coverArtSizeLimit,
    toggle,
    setNumber,
  } = useSettingsStore();

  const [isClearing, setIsClearing] = useState(false);

  const isScanning = isServerScanning || isLocalScanning;

  const handleGlobalScan = async () => {
    // Scan servers
    rescanServers();
    // Scan local if tauri
    if (isTauriAvailable) {
      scanAllFolders();
    }
  };

  const handleClearEverything = async () => {
    if (
      confirm(
        "Are you sure you want to clear the entire library? This will remove all indexed tracks from local folders and remote servers."
      )
    ) {
      setIsClearing(true);
      try {
        await clearServerLibrary();
        // Local library is usually persisted in localStorage within useLocalLibrary,
        // but it doesn't have a 'clear' for the track database separate from servers
        // because they often share the same store/cache in some implementations.
        // For now, reload to be safe as it's a heavy operation.
        window.location.reload();
      } catch (e) {
        console.error("Failed to clear library", e);
        setIsClearing(false);
      }
    }
  };

  const fileSizeOptions = [
    { value: (50 * 1024 * 1024).toString(), label: "50 MB" },
    { value: (100 * 1024 * 1024).toString(), label: "100 MB (Standard)" },
    { value: (500 * 1024 * 1024).toString(), label: "500 MB (Full Albums)" },
    { value: "0", label: "Unlimited (Warning)" },
  ];

  const coverArtOptions = [
    { value: (1 * 1024 * 1024).toString(), label: "1 MB (Efficient)" },
    { value: (5 * 1024 * 1024).toString(), label: "5 MB (High Res)" },
    { value: (10 * 1024 * 1024).toString(), label: "10 MB (Ultra)" },
    { value: "0", label: "Unlimited (Raw)" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* 1. Global Sources Management */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Library Sources
            </h2>
            <p className="text-text-muted">
              Manage where your music comes from.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              onClick={handleGlobalScan}
              disabled={isScanning}
              className="flex-1 sm:flex-none"
            >
              <IconRefresh
                size={18}
                className={`mr-2 ${isScanning ? "animate-spin" : ""}`}
              />
              Scan All
            </Button>
          </div>
        </div>

        {/* Local Folders (Only Desktop) */}
        {isTauriAvailable && (
          <SettingSection
            title="Local Folders"
            description="High-fidelity music stored on this computer."
            icon={IconFolder}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Added Directories</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addFolder}
                  className="h-8"
                >
                  <IconFolderPlus size={16} className="mr-2" />
                  Add Folder
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {folders.length > 0 ? (
                  folders.map((f: LocalFolder) => (
                    <div
                      key={f.path}
                      className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <IconMusic size={18} className="text-text-muted" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">
                            {f.path}
                          </p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">
                            {f.trackCount} Tracks Found
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFolder(f.path)}
                        className="p-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-text-muted italic">
                    No local folders configured.
                  </div>
                )}
              </div>
            </div>
          </SettingSection>
        )}

        {/* Remote Servers */}
        <SettingSection
          title="Sonántica Servers"
          description="Cloud or NAS instances for shared listening."
          icon={IconServer}
        >
          <div className="bg-surface/30 rounded-xl p-1">
            <ServersSection />
          </div>
        </SettingSection>
      </div>

      {/* 2. Scanning & Behavior */}
      <SettingSection
        title="Indexation Policy"
        description="Configuration for the search and metadata engines."
        icon={IconClock}
      >
        <SettingRow
          label="Auto-Scan on Startup"
          description="Index new files automatically when launching Sonántica."
        >
          <Switch checked={autoScan} onChange={() => toggle("autoScan")} />
        </SettingRow>

        <SettingRow
          label="Parallel Scanning"
          description="Load multiple sources at once. Improved speed on SSDs."
        >
          <Switch
            checked={parallelScanning}
            onChange={() => toggle("parallelScanning")}
          />
        </SettingRow>

        <SettingRow
          label="File Size Limit"
          description="Standard: 100MB. Skip larger items to prevent buffering lags."
        >
          <div className="w-full sm:w-48">
            <Select
              options={fileSizeOptions}
              value={scanFileSizeLimit.toString()}
              onChange={(e) =>
                setNumber("scanFileSizeLimit", parseInt(e.target.value))
              }
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Visual Cache"
          description="Configure maximum resolution for embedded album covers."
        >
          <div className="w-full sm:w-48">
            <Select
              options={coverArtOptions}
              value={coverArtSizeLimit.toString()}
              onChange={(e) =>
                setNumber("coverArtSizeLimit", parseInt(e.target.value))
              }
            />
          </div>
        </SettingRow>
      </SettingSection>

      {/* 3. Maintenance */}
      <SettingSection
        title="Maintenance"
        description="Database hygiene and purge tools."
        icon={IconBooks}
      >
        <SettingRow
          label="Purge Library Database"
          description="Remove all indexed data and resets the cache. Files are NOT deleted."
        >
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearEverything}
            disabled={isClearing}
            className="w-full sm:w-auto text-red-400 border-red-900/40 hover:bg-red-900/10"
          >
            {isClearing ? "Purging..." : "Wipe Database"}
          </Button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
