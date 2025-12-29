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

export function LibrarySettings() {
  const { clearLibrary, triggerRescanAll } = useMultiServerLibrary();
  const {
    autoScan,
    watchFolders,
    parallelScanning,
    fetchMissingMetadata,
    embeddedCoversPriority,
    scanFileSizeLimit,
    coverArtSizeLimit,
    toggle,
    setNumber,
  } = useSettingsStore();

  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    if (
      confirm(
        "Are you sure you want to clear the library database? This will remove all indexed tracks and require a full rescan."
      )
    ) {
      setIsClearing(true);
      try {
        await clearLibrary();
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
    <div className="space-y-8 animate-in fade-in duration-500 delay-100">
      <SettingSection
        title="Scanning"
        description="Configure how Sonántica indexes your music."
      >
        <SettingRow
          label="Auto-Scan on Startup"
          description="Check for new files every time the app launches."
        >
          <Switch checked={autoScan} onChange={() => toggle("autoScan")} />
        </SettingRow>

        <SettingRow
          label="Watch Folders"
          description="Monitor folders for changes in real-time."
        >
          <Switch
            checked={watchFolders}
            onChange={() => toggle("watchFolders")}
          />
        </SettingRow>

        <SettingRow
          label="Parallel Scanning"
          description="Scan multiple folders simultaneously. Faster, but uses more CPU."
        >
          <Switch
            checked={parallelScanning}
            onChange={() => toggle("parallelScanning")}
          />
        </SettingRow>

        <SettingRow
          label="Max Scan File Size"
          description="Skip files larger than this size. Selecting Unlimited may cause freezes on huge files."
        >
          <div className="w-56">
            <Select
              options={fileSizeOptions}
              value={scanFileSizeLimit.toString()}
              onChange={(e) =>
                setNumber("scanFileSizeLimit", parseInt(e.target.value))
              }
            />
            {scanFileSizeLimit === 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ Performance may be impacted.
              </p>
            )}
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Metadata"
        description="Configuration for tag reading and internet fetching."
      >
        <SettingRow
          label="Fetch Missing Metadata"
          description="Download covers and tags from MusicBrainz/Discogs."
        >
          <Switch
            checked={fetchMissingMetadata}
            onChange={() => toggle("fetchMissingMetadata")}
          />
        </SettingRow>

        <SettingRow
          label="Embedded Covers Priority"
          description="Prefer embedded art over folder.jpg."
        >
          <Switch
            checked={embeddedCoversPriority}
            onChange={() => toggle("embeddedCoversPriority")}
          />
        </SettingRow>

        <SettingRow
          label="Cover Art Max Size"
          description="Limit the size of extracted embedded artwork."
        >
          <div className="w-56">
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

      <SettingSection title="Maintenance">
        <SettingRow
          label="Rescan Library"
          description="Force a full rescan of all configured servers with current settings."
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  "Start a full rescan of all servers? This will respect the new size limits."
                )
              ) {
                triggerRescanAll();
              }
            }}
          >
            Rescan All
          </Button>
        </SettingRow>

        <SettingRow
          label="Clear Library Cache"
          description="Remove all indexed data and rescan from scratch."
        >
          <Button
            variant="danger"
            size="sm"
            className="text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20"
            onClick={handleClear}
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear Database"}
          </Button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
