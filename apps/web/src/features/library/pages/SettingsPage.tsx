/**
 * Settings Page
 *
 * "User autonomy" - Configure library sources and preferences.
 */

import { useState, useEffect, useRef } from "react";
import {
  PageHeader,
  EmptyState,
  FolderList,
  Tabs,
  ScanButton,
  type Tab,
} from "@sonantica/ui";
import { FolderManager } from "@sonantica/media-library";
import type { LibraryConfig } from "@sonantica/shared";
import { WebFolderStorage } from "../../../utils/WebFolderStorage";
import { WebFolderValidator } from "../../../utils/WebFolderValidator";
import { useLibraryStore } from "@sonantica/media-library";
import {
  IconFolder,
  IconSettings,
  IconPalette,
  IconInfoCircle,
} from "@tabler/icons-react";

// Initialize folder manager (singleton pattern)
const folderManager = new FolderManager(
  new WebFolderStorage(),
  new WebFolderValidator()
);

const TABS: Tab[] = [
  { id: "library", label: "Library", icon: IconFolder },
  { id: "general", label: "General", icon: IconSettings },
  { id: "appearance", label: "Appearance", icon: IconPalette },
  { id: "about", label: "About", icon: IconInfoCircle },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [config, setConfig] = useState<LibraryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanningFolderId, setScanningFolderId] = useState<string | null>(null);
  const { library, scanning } = useLibraryStore();
  const autoScanExecutedRef = useRef(false);
  const configLoadedRef = useRef(false);

  // Load configuration on mount (only once) - SYNCHRONOUSLY from localStorage first
  useEffect(() => {
    if (configLoadedRef.current) return;

    const loadConfig = async () => {
      try {
        // CRITICAL: Load from localStorage FIRST before any async operations
        let initialConfig: LibraryConfig | null = null;
        try {
          const stored = localStorage.getItem("sonantica:library-config");
          if (stored) {
            initialConfig = JSON.parse(stored);
            console.log("📂 Loaded config from localStorage:", {
              autoScanOnStartup: initialConfig?.autoScanOnStartup,
              parallelScan: initialConfig?.parallelScan,
            });
          }
        } catch (e) {
          console.error("Failed to load config from localStorage:", e);
        }

        // Now initialize FolderManager (which may add system folders)
        await folderManager.initialize();
        const currentConfig = folderManager.getConfig();

        // If we had a stored config, merge the settings
        if (initialConfig) {
          currentConfig.autoScanOnStartup =
            initialConfig.autoScanOnStartup ?? false;
          currentConfig.parallelScan = initialConfig.parallelScan ?? false;
        }

        setConfig(currentConfig);
        configLoadedRef.current = true;

        // Debug logging
        console.log("🔍 Final config loaded:", {
          autoScanOnStartup: currentConfig.autoScanOnStartup,
          parallelScan: currentConfig.parallelScan,
          type: typeof currentConfig.autoScanOnStartup,
          foldersCount: currentConfig.folders.length,
          folders: currentConfig.folders.map((f) => ({
            path: f.path,
            enabled: f.enabled,
          })),
        });
      } catch (error) {
        console.error("Failed to load configuration:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Subscribe to configuration changes
    const unsubscribe = folderManager.onChange((newConfig: LibraryConfig) => {
      console.log("📢 Config changed:", newConfig);
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  // Auto-scan effect (only when library is ready and config is loaded)
  useEffect(() => {
    if (
      !library ||
      !config ||
      autoScanExecutedRef.current ||
      !configLoadedRef.current
    ) {
      return;
    }

    // Debug logging
    console.log("🔍 Auto-scan check:", {
      autoScanOnStartup: config.autoScanOnStartup,
      type: typeof config.autoScanOnStartup,
      hasLibrary: !!library,
      foldersCount: config.folders.length,
      alreadyExecuted: autoScanExecutedRef.current,
    });

    // Auto-scan on startup ONLY if explicitly enabled
    if (config.autoScanOnStartup === true) {
      const paths = folderManager.getScanPaths();
      console.log("🚀 Auto-scan ENABLED - triggering with paths:", paths);
      if (paths.length > 0) {
        autoScanExecutedRef.current = true;
        // Don't await here to not block UI
        const scan = useLibraryStore.getState().scan;
        scan(paths).catch(console.error);
      }
    } else {
      console.log(
        "⏸️ Auto-scan DISABLED - skipping (config.autoScanOnStartup =",
        config.autoScanOnStartup,
        ")"
      );
    }
  }, [library, config]);

  const handleToggleFolder = async (folderId: string, enabled: boolean) => {
    try {
      await folderManager.updateFolder(folderId, { enabled });
      // We don't auto-scan on toggle on anymore, user must explicitly scan
    } catch (error) {
      console.error("Failed to toggle folder:", error);
    }
  };

  const handleRemoveFolder = async (folderId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this folder from your library? content wil remain on disk."
      )
    ) {
      return;
    }

    try {
      await folderManager.removeFolder(folderId);

      // Optionally clear library if all folders removed?
      // For now, let's leave it to user to re-scan.
    } catch (error) {
      console.error("Failed to remove folder:", error);
      alert(error instanceof Error ? error.message : "Failed to remove folder");
    }
  };

  const handleEditFolder = (folderId: string) => {
    // TODO: Implement edit dialog
    console.log("Edit folder:", folderId);
  };

  const handleToggleRecursive = async (
    folderId: string,
    recursive: boolean
  ) => {
    try {
      await folderManager.updateFolder(folderId, { recursive });
    } catch (error) {
      console.error("Failed to toggle recursive:", error);
    }
  };

  const handleScanFolder = async (folderId: string) => {
    if (scanning) return;

    try {
      const folder = folderManager.getFolders().find((f) => f.id === folderId);
      if (folder) {
        setScanningFolderId(folderId);
        // Scan only this folder path using store method
        const scan = useLibraryStore.getState().scan;
        await scan([folder.path]);
      }
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setScanningFolderId(null);
    }
  };

  const handleScanAll = async () => {
    const scan = useLibraryStore.getState().scan;

    if (scanning) {
      // Cancel ongoing scan
      scan([], true);
      return;
    }

    try {
      const paths = folderManager.getScanPaths();
      if (paths.length === 0) {
        alert("No folders configured. Please add folders first.");
        return;
      }
      await scan(paths);
    } catch (err) {
      console.error("Scan all failed", err);
    }
  };

  const handleScanSelected = async (folderIds: string[]) => {
    if (scanning) return;

    try {
      const selectedFolders = folderManager
        .getFolders()
        .filter((f) => folderIds.includes(f.id));
      const paths = selectedFolders.map((f) => f.path);
      const scan = useLibraryStore.getState().scan;
      await scan(paths);
    } catch (err) {
      console.error("Scan selected failed", err);
    }
  };

  const handleClearLibrary = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete all scanned track records? This action cannot be undone.\n\nConfigured folders and files on your disk will remain intact."
    );

    if (!confirmed) return;

    try {
      const clearLibrary = useLibraryStore.getState().clearLibrary;
      await clearLibrary();
      alert(
        "Library cleared successfully. You can re-scan your folders whenever you want."
      );
    } catch (err) {
      console.error("Clear library failed", err);
      alert("Error clearing library. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Loading settings...</div>
      </div>
    );
  }

  const folders = config?.folders || [];

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Settings" subtitle="Configure your preferences" />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="px-6">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {activeTab === "library" && (
              <LibraryTab
                folders={folders}
                config={config}
                setConfig={setConfig}
                scanning={scanning}
                scanningFolderId={scanningFolderId}
                onToggleFolder={handleToggleFolder}
                onRemoveFolder={handleRemoveFolder}
                onEditFolder={handleEditFolder}
                onToggleRecursive={handleToggleRecursive}
                onScanFolder={handleScanFolder}
                onScanAll={handleScanAll}
                onScanSelected={handleScanSelected}
                onClearLibrary={handleClearLibrary}
                folderManager={folderManager}
              />
            )}

            {activeTab === "general" && <GeneralTab />}

            {activeTab === "appearance" && <AppearanceTab />}

            {activeTab === "about" && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Library Tab Component
interface LibraryTabProps {
  folders: any[];
  config: LibraryConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<LibraryConfig | null>>;
  scanning: boolean;
  scanningFolderId: string | null;
  onToggleFolder: (folderId: string, enabled: boolean) => void;
  onRemoveFolder: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onToggleRecursive: (folderId: string, recursive: boolean) => void;
  onScanFolder: (folderId: string) => void;
  onScanAll: () => void;
  onScanSelected: (folderIds: string[]) => void;
  onClearLibrary: () => void;
  folderManager: FolderManager;
}

function LibraryTab({
  folders,
  config,
  setConfig,
  scanning,
  scanningFolderId,
  onToggleFolder,
  onRemoveFolder,
  onEditFolder,
  onToggleRecursive,
  onScanFolder,
  onScanAll,
  onScanSelected,
  onClearLibrary,
  folderManager,
}: LibraryTabProps) {
  return (
    <div className="space-y-8">
      {/* Music Folders Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text mb-1">
              Music Folders
            </h2>
            <p className="text-sm text-text-muted">
              Configured folders for your library
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ScanButton
              onClick={onScanAll}
              scanning={scanning}
              size="md"
              disabled={!scanning && folders.length === 0}
            />
          </div>
        </div>

        {folders.length === 0 ? (
          <EmptyState
            icon={IconFolder}
            title="No folders configured"
            description="The system folder /media will be available once mounted. Contact your administrator to configure additional folders."
          />
        ) : (
          <FolderList
            folders={folders}
            onToggle={onToggleFolder}
            onRemove={onRemoveFolder}
            onEdit={onEditFolder}
            onScan={onScanFolder}
            onScanSelected={onScanSelected}
            onToggleRecursive={onToggleRecursive}
            scanning={scanning}
            scanningFolderId={scanningFolderId}
          />
        )}
      </section>

      {/* Library Settings */}
      <section>
        <h2 className="text-xl font-semibold text-text mb-4">
          Library Settings
        </h2>

        <div className="space-y-4 bg-surface border border-border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-text">
                Auto-scan on startup
              </h3>
              <p className="text-sm text-text-muted">
                Automatically scan library folders when the app starts
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config?.autoScanOnStartup || false}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  // Update local state immediately for UI responsiveness
                  setConfig((prev) =>
                    prev ? { ...prev, autoScanOnStartup: newValue } : prev
                  );
                  // Persist to storage
                  await folderManager.updateSettings({
                    autoScanOnStartup: newValue,
                  });
                  console.log("✅ Auto-scan setting updated:", newValue);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-accent transition-colors">
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-text">
                Parallel scanning
              </h3>
              <p className="text-sm text-text-muted">
                Scan multiple folders simultaneously (faster but more resource
                intensive)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config?.parallelScan || false}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  // Update local state immediately for UI responsiveness
                  setConfig((prev) =>
                    prev ? { ...prev, parallelScan: newValue } : prev
                  );
                  // Persist to storage
                  await folderManager.updateSettings({
                    parallelScan: newValue,
                  });
                  console.log("✅ Parallel scan setting updated:", newValue);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-accent transition-colors">
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <h3 className="text-base font-medium text-text">
                Watch for changes
              </h3>
              <p className="text-sm text-text-muted">
                Automatically detect new files (coming soon)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="sr-only"
              />
              <div className="w-11 h-6 bg-surface-elevated rounded-full">
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow" />
              </div>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 pt-6 border-t border-error/20">
          <h3 className="text-base font-medium text-error mb-2">Danger Zone</h3>
          <p className="text-sm text-text-muted mb-4">
            These actions are irreversible. Proceed with caution.
          </p>
          <button
            onClick={onClearLibrary}
            className="px-4 py-2 bg-error/10 text-error border border-error/30 rounded-md hover:bg-error/20 transition-colors text-sm font-medium"
          >
            Delete all track records
          </button>
        </div>
      </section>

      {/* Stats Section */}
      {folders.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-text mb-4">
            Library Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-text">
                {folders.length}
              </div>
              <div className="text-sm text-text-muted">
                {folders.length === 1 ? "Folder" : "Folders"}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-text">
                {folders.filter((f) => f.enabled).length}
              </div>
              <div className="text-sm text-text-muted">Active</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-text">
                {folders.reduce((sum, f) => sum + (f.trackCount || 0), 0)}
              </div>
              <div className="text-sm text-text-muted">Tracks</div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-text">
                {folders.filter((f) => f.recursive).length}
              </div>
              <div className="text-sm text-text-muted">Recursive</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// General Tab Component
function GeneralTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-text mb-4">
          General Settings
        </h2>
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <p className="text-text-muted">General settings coming soon...</p>
        </div>
      </section>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-text mb-4">
          Appearance Settings
        </h2>
        <div className="bg-surface border border-border rounded-lg p-6 text-center">
          <p className="text-text-muted">Theme customization coming soon...</p>
        </div>
      </section>
    </div>
  );
}

// About Tab Component
function AboutTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-text mb-4">
          About Sonántica
        </h2>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-text mb-2">Sonántica</h3>
            <p className="text-text-muted italic">
              "Every file has an intention."
            </p>
          </div>

          <div className="space-y-4 text-sm text-text-muted max-w-2xl mx-auto">
            <p>
              An open-source multimedia player designed with audio fidelity and
              user autonomy at its core.
            </p>
            <p>
              Sonántica believes that listening is not passive, that sound is
              not noise, but language.
            </p>
            <p className="text-center pt-4 border-t border-border">
              <span className="text-text">Version:</span> 0.1.0
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
