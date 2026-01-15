import { useSettingsStore } from "../../../stores/settingsStore";
import {
  IconLayoutNavbar,
  IconPackage,
  IconFolder,
  IconFolderPlus,
  IconTrash,
  IconRefresh,
  IconMusic,
} from "@tabler/icons-react";
import {
  useLocalLibrary,
  type LocalFolder,
} from "../../../hooks/useLocalLibrary";
import { Button } from "@sonantica/ui";

export function DesktopSettings() {
  const { desktopCloseAction, setDesktopCloseAction } = useSettingsStore();
  const {
    folders,
    isScanning,
    scanProgress,
    error,
    addFolder,
    removeFolder,
    scanFolder,
    scanAllFolders,
  } = useLocalLibrary();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Local Library */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-text-muted mb-6">
          <IconFolder size={20} stroke={1.5} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Local Library
          </h2>
        </div>

        <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h3 className="font-medium">Music Folders</h3>
                <p className="text-sm text-text-muted">
                  Add local directories to scan for music files. Sonántica will
                  index all audio files found.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={addFolder}
                disabled={isScanning}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <IconFolderPlus size={16} />
                Add Folder
              </Button>
            </div>

            {/* Folder List */}
            {folders.length > 0 ? (
              <div className="space-y-2">
                {folders.map((folder: LocalFolder) => (
                  <div
                    key={folder.path}
                    className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border hover:border-accent/50 transition-colors group"
                  >
                    <IconMusic
                      size={20}
                      className="text-text-muted flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {folder.path}
                      </p>
                      <p className="text-xs text-text-muted">
                        {folder.trackCount > 0
                          ? `${folder.trackCount} tracks`
                          : "Not scanned yet"}
                        {folder.lastScanned &&
                          ` • Last scanned: ${folder.lastScanned.toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scanFolder(folder.path)}
                        disabled={isScanning}
                        className="p-2 text-text-muted hover:text-accent rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50"
                        title="Rescan folder"
                      >
                        <IconRefresh
                          size={16}
                          className={isScanning ? "animate-spin" : ""}
                        />
                      </button>
                      <button
                        onClick={() => removeFolder(folder.path)}
                        disabled={isScanning}
                        className="p-2 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50"
                        title="Remove folder"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-surface/30 rounded-lg border border-dashed border-border">
                <IconFolder
                  size={40}
                  className="mx-auto text-text-muted/30 mb-3"
                />
                <p className="text-sm text-text-muted mb-4">
                  No music folders added yet.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addFolder}
                  className="flex items-center gap-2 mx-auto"
                >
                  <IconFolderPlus size={16} />
                  Add Your First Folder
                </Button>
              </div>
            )}

            {/* Scan Progress */}
            {isScanning && scanProgress && (
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-accent">
                    Scanning...
                  </span>
                  <span className="text-xs text-text-muted">
                    {scanProgress.current} files found
                  </span>
                </div>
                {scanProgress.current_file && (
                  <p className="text-xs text-text-muted truncate">
                    {scanProgress.current_file}
                  </p>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Scan All Button */}
            {folders.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={scanAllFolders}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-2"
              >
                <IconRefresh
                  size={16}
                  className={isScanning ? "animate-spin" : ""}
                />
                Scan All Folders
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Desktop Integration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-text-muted mb-6">
          <IconPackage size={20} stroke={1.5} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Desktop Integration
          </h2>
        </div>

        <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden divide-y divide-border">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">Close Behavior</h3>
              <p className="text-sm text-text-muted">
                What should happen when you click the close button?
              </p>
            </div>
            <select
              value={desktopCloseAction}
              onChange={(e) => setDesktopCloseAction(e.target.value as any)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="ask">Always ask</option>
              <option value="minimize">Minimize to System Tray</option>
              <option value="close">Close application</option>
            </select>
          </div>

          <div className="p-4 sm:p-6 flex items-center justify-between gap-4 opacity-50 cursor-not-allowed">
            <div className="space-y-1">
              <h3 className="font-medium">Launch at Startup</h3>
              <p className="text-sm text-text-muted">
                Start Sonántica automatically when you log in.
              </p>
            </div>
            <div className="h-6 w-10 bg-surface border-2 border-border rounded-full relative">
              <div className="absolute left-1 top-1 h-3 w-3 bg-text-muted rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Tray Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-text-muted mb-6">
          <IconLayoutNavbar size={20} stroke={1.5} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            System Tray
          </h2>
        </div>

        <div className="bg-surface-elevated border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-text-muted">
            The system tray icon is always active to allow quick access to the
            player.
          </p>
        </div>
      </section>
    </div>
  );
}
