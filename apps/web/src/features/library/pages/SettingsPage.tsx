/**
 * Settings Page
 *
 * "User autonomy" - Configure library sources and preferences.
 */

import { useState, useEffect } from "react";
import {
  PageHeader,
  EmptyState,
  FolderList,
  AddFolderButton,
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
  const { library, scanning } = useLibraryStore();

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        await folderManager.initialize();
        const currentConfig = folderManager.getConfig();
        setConfig(currentConfig);

        // Auto-scan on startup ONLY if enabled
        if (currentConfig.autoScanOnStartup && library) {
          const paths = folderManager.getScanPaths();
          if (paths.length > 0) {
            // Don't await here to not block UI
            library.scan(paths).catch(console.error);
          }
        }
      } catch (error) {
        console.error("Failed to load configuration:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    // Subscribe to configuration changes
    const unsubscribe = folderManager.onChange((newConfig: LibraryConfig) => {
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  const handleAddFolder = async () => {
    try {
      // Use File System Access API to select folder
      if (!("showDirectoryPicker" in window)) {
        alert(
          "Your browser does not support folder selection. Please use a modern browser like Chrome or Edge."
        );
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "read",
      });

      // Add folder to configuration
      await folderManager.addFolder(dirHandle.name, {
        name: dirHandle.name,
        recursive: true,
        enabled: true,
      });

      // Store the directory handle for future access
      // Note: In production, you'd want to use IndexedDB to persist handles
      console.log("Folder added:", dirHandle.name);

      // Ask user to scan immediately
      if (confirm("Folder added. Do you want to scan it now?")) {
        // Logic handled by general scan
        if (library) {
          // We scan specifically this new folder?
          // Currently backend scan takes a list of paths.
          // But directory handle storage is tricky on web without mapped paths.
          // For now, let's trigger a full scan of enabled paths which includes this one.
          const paths = folderManager.getScanPaths();
          await library.scan(paths);
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Failed to add folder:", error);
        alert("Failed to add folder. Please try again.");
      }
    }
  };

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

  const handleScanFolder = async (folderId: string) => {
    if (!library || scanning) return;

    try {
      const folder = folderManager.getFolders().find((f) => f.id === folderId);
      if (folder) {
        // Scan only this folder path
        await library.scan([folder.path]);
      }
    } catch (err) {
      console.error("Scan failed", err);
    }
  };

  const handleScanAll = async () => {
    if (!library) return;

    if (scanning) {
      library.cancelScan();
      return;
    }

    try {
      const paths = folderManager.getScanPaths();
      await library.scan(paths);
    } catch (err) {
      console.error("Scan all failed", err);
    }
  };

  const handleScanSelected = async (folderIds: string[]) => {
    if (!library || scanning) return;

    try {
      const selectedFolders = folderManager
        .getFolders()
        .filter((f) => folderIds.includes(f.id));
      const paths = selectedFolders.map((f) => f.path);
      await library.scan(paths);
    } catch (err) {
      console.error("Scan selected failed", err);
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
                scanning={scanning}
                onAddFolder={handleAddFolder}
                onToggleFolder={handleToggleFolder}
                onRemoveFolder={handleRemoveFolder}
                onEditFolder={handleEditFolder}
                onScanFolder={handleScanFolder}
                onScanAll={handleScanAll}
                onScanSelected={handleScanSelected}
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
  scanning: boolean;
  onAddFolder: () => void;
  onToggleFolder: (folderId: string, enabled: boolean) => void;
  onRemoveFolder: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onScanFolder: (folderId: string) => void;
  onScanAll: () => void;
  onScanSelected: (folderIds: string[]) => void;
  folderManager: FolderManager;
}

function LibraryTab({
  folders,
  config,
  scanning,
  onAddFolder,
  onToggleFolder,
  onRemoveFolder,
  onEditFolder,
  onScanFolder,
  onScanAll,
  onScanSelected,
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
              Select folders to include in your library
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ScanButton
              onClick={onScanAll}
              scanning={scanning}
              size="sm"
              disabled={!scanning && folders.length === 0}
              label="Analizar todo"
              scanningLabel="Cancelar"
            />
            <AddFolderButton onClick={onAddFolder} />
          </div>
        </div>

        {folders.length === 0 ? (
          <EmptyState
            icon={IconFolder}
            title="No folders configured"
            description="Add folders to build your music library. Sonántica will scan these locations for audio files."
            action={<AddFolderButton onClick={onAddFolder} />}
          />
        ) : (
          <FolderList
            folders={folders}
            onToggle={onToggleFolder}
            onRemove={onRemoveFolder}
            onEdit={onEditFolder}
            onScan={onScanFolder}
            onScanSelected={onScanSelected}
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
                onChange={(e) => {
                  folderManager.updateSettings({
                    autoScanOnStartup: e.target.checked,
                  });
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
