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
} from "@sonantica/ui";
import { FolderManager } from "@sonantica/media-library";
import type { LibraryConfig } from "@sonantica/shared";
import { WebFolderStorage } from "../../../utils/WebFolderStorage";
import { WebFolderValidator } from "../../../utils/WebFolderValidator";
import { useLibraryStore } from "@sonantica/media-library";
import { IconFolder } from "@tabler/icons-react";

// Initialize folder manager (singleton pattern)
const folderManager = new FolderManager(
  new WebFolderStorage(),
  new WebFolderValidator()
);

export function SettingsPage() {
  const [config, setConfig] = useState<LibraryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const library = useLibraryStore((state) => state.library);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        await folderManager.initialize();
        setConfig(folderManager.getConfig());
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

      // Optionally trigger a scan
      if (library) {
        const paths = folderManager.getScanPaths();
        await library.scan(paths);
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

      // Re-scan if toggling on
      if (enabled && library) {
        const paths = folderManager.getScanPaths();
        await library.scan(paths);
      }
    } catch (error) {
      console.error("Failed to toggle folder:", error);
    }
  };

  const handleRemoveFolder = async (folderId: string) => {
    if (
      !confirm("Are you sure you want to remove this folder from your library?")
    ) {
      return;
    }

    try {
      await folderManager.removeFolder(folderId);

      // Optionally clear and re-scan
      if (library) {
        library.clear();
        const paths = folderManager.getScanPaths();
        if (paths.length > 0) {
          await library.scan(paths);
        }
      }
    } catch (error) {
      console.error("Failed to remove folder:", error);
    }
  };

  const handleEditFolder = (folderId: string) => {
    // TODO: Implement edit dialog
    console.log("Edit folder:", folderId);
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
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Settings"
        subtitle="Configure your music library and preferences"
      />

      <div className="px-6 pb-6 max-w-4xl">
        {/* Library Folders Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text mb-1">
                Music Folders
              </h2>
              <p className="text-sm text-text-muted">
                Select folders to include in your library
              </p>
            </div>
            <AddFolderButton onClick={handleAddFolder} />
          </div>

          {folders.length === 0 ? (
            <EmptyState
              icon={IconFolder}
              title="No folders configured"
              description="Add folders to build your music library. Sonántica will scan these locations for audio files."
              action={<AddFolderButton onClick={handleAddFolder} />}
            />
          ) : (
            <FolderList
              folders={folders}
              onToggle={handleToggleFolder}
              onRemove={handleRemoveFolder}
              onEdit={handleEditFolder}
            />
          )}
        </section>

        {/* Library Settings Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text mb-4">
            Library Settings
          </h2>

          <div className="space-y-4 bg-surface border border-border rounded-lg p-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    </div>
  );
}
