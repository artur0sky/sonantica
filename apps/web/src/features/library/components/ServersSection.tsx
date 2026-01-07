/**
 * Enhanced Servers Section with Advanced Scanning Features
 *
 * UI for managing multiple Sonántica server instances.
 * Features:
 * - Add, switch, remove servers
 * - Scan libraries (parallel/sequential)
 * - Auto-scan on server add
 * - Clear library data
 *
 * Philosophy: "User Autonomy" - Multiple self-hosted instances
 */

import { useState, useEffect } from "react";

import {
  getServersConfig,
  setActiveServer,
  removeServerConfig,
  testServerConnectionById,
  saveServerConfig,
} from "../../../services/LibraryService";
import { useMultiServerLibrary } from "../../../hooks/useMultiServerLibrary";
import { useSettingsStore } from "../../../stores/settingsStore";
import {
  IconServer,
  IconCheck,
  IconTrash,
  IconPlus,
  IconRefresh,
  IconPlayerPlay,
  IconBolt,
  IconClock,
} from "@tabler/icons-react";
import { Button, Switch, ActionIconButton, Input } from "@sonantica/ui";

export function ServersSection() {
  const [config, setConfig] = useState(getServersConfig());
  const [testing, setTesting] = useState<string | null>(null);

  // Add Server State
  const [isAdding, setIsAdding] = useState(false);
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerApiKey, setNewServerApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const { autoScan, parallelScanning, toggle } = useSettingsStore();

  const {
    tracks,
    artists,
    albums,
    isScanning,
    scanningServers,
    scanServer,
    scanAllServers,
    clearLibrary,
  } = useMultiServerLibrary();

  // Auto-scan on mount if enabled and servers exist
  useEffect(() => {
    if (autoScan && config.servers.length > 0 && tracks.length === 0) {
      console.log("🔄 Auto-scanning servers on mount...");
      handleScanAll();
    }
  }, []); // Only on mount

  const handleSwitchServer = async (serverId: string) => {
    setActiveServer(serverId);
    setConfig(getServersConfig());

    // Reload the page to refresh library data
    window.location.reload();
  };

  const handleRemoveServer = (serverId: string) => {
    if (confirm("Are you sure you want to remove this server?")) {
      removeServerConfig(serverId);
      setConfig(getServersConfig());

      // If no servers left, redirect to setup if empty
      const newConfig = getServersConfig();
      if (newConfig.servers.length === 0) {
        // We stay on page to show empty state with "Add Server" button
      }
    }
  };

  const handleTestConnection = async (serverId: string) => {
    setTesting(serverId);
    try {
      const connected = await testServerConnectionById(serverId);
      if (connected) {
        alert("Connection successful!");
      } else {
        alert("Unable to connect to server");
      }
    } catch (error) {
      alert(
        "Connection failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setTesting(null);
    }
  };

  const handleStartAddServer = () => {
    setIsAdding(true);
    setNewServerUrl("");
    setNewServerApiKey("");
    setAddError(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setAddError(null);
  };

  const handleAddServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newServerUrl.trim()) {
      setAddError("Please enter a server URL");
      return;
    }

    setIsConnecting(true);

    try {
      // Save temporarily to test
      const tempServer = saveServerConfig({
        name: newServerUrl.trim(),
        serverUrl: newServerUrl.trim(),
        apiKey: newServerApiKey.trim() || undefined,
      });

      // Now test it
      const connected = await testServerConnectionById(tempServer.id);

      if (!connected) {
        // Rollback
        removeServerConfig(tempServer.id);
        throw new Error(
          "Unable to connect to server. Check URL and try again."
        );
      }

      // Success
      setConfig(getServersConfig());
      setIsAdding(false);

      // Optional: Setup auto-scan for this new server?
      if (autoScan) {
        scanServer(tempServer.id);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add server");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleScanServer = async (serverId: string) => {
    await scanServer(serverId);
  };

  const handleScanAll = async () => {
    if (parallelScanning) {
      // Scan all servers in parallel
      await scanAllServers();
    } else {
      // Scan servers sequentially
      for (const server of config.servers) {
        await scanServer(server.id);
      }
    }
  };

  const handleClearLibrary = () => {
    if (
      confirm(
        "Are you sure you want to clear all scanned tracks? This will not affect your servers or files."
      )
    ) {
      clearLibrary();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Servers</h3>
          <p className="text-sm text-text-muted">
            Manage your Sonántica server instances
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={handleStartAddServer}
            variant="primary"
            className="flex items-center gap-2"
          >
            <IconPlus size={18} />
            Add Server
          </Button>
        )}
      </div>

      {/* Add Server Form */}
      {isAdding && (
        <div className="bg-surface-elevated border border-primary/50 rounded-lg p-6 animate-in fade-in slide-in-from-top-2">
          <h4 className="font-medium text-text-primary mb-4">Add New Server</h4>
          <form onSubmit={handleAddServerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Server URL
                </label>
                <Input
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="http://localhost:8090"
                  autoFocus
                  disabled={isConnecting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  API Key (Optional)
                </label>
                <Input
                  type="password"
                  value={newServerApiKey}
                  onChange={(e) => setNewServerApiKey(e.target.value)}
                  placeholder="Secret key"
                  disabled={isConnecting}
                />
              </div>
            </div>

            {addError && (
              <p className="text-sm text-red-400 bg-red-400/10 p-2 rounded">
                {addError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelAdd}
                disabled={isConnecting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting && (
                  <IconRefresh className="animate-spin" size={16} />
                )}
                {isConnecting ? "Connecting..." : "Add Server"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Library Stats */}
      {tracks.length > 0 && !isAdding && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {tracks.length}
            </div>
            <div className="text-sm text-text-muted">Tracks Loaded</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {config.servers.length}
            </div>
            <div className="text-sm text-text-muted">Servers</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {artists.length}
            </div>
            <div className="text-sm text-text-muted">Artists</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {albums.length}
            </div>
            <div className="text-sm text-text-muted">Albums</div>
          </div>
        </div>
      )}

      {/* Scan Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleScanAll}
            disabled={isScanning || config.servers.length === 0}
            variant="primary"
            className="flex items-center gap-2"
          >
            <IconPlayerPlay
              size={18}
              className={isScanning ? "animate-pulse" : ""}
            />
            {isScanning ? "Scanning..." : "Scan All Servers"}
          </Button>
          {tracks.length > 0 && (
            <Button
              onClick={handleClearLibrary}
              variant="danger"
              className="flex items-center gap-2"
            >
              Clear Library
            </Button>
          )}
        </div>

        {/* Scan Options */}
        <div className="flex flex-col sm:flex-row gap-6 p-4 bg-surface-elevated border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              checked={autoScan}
              onChange={() => toggle("autoScan")}
              label="Auto-Scan"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">
                Auto-Scan
              </div>
              <div className="text-xs text-text-muted">
                Scan servers automatically on startup
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={parallelScanning}
              onChange={() => toggle("parallelScanning")}
              label="Parallel Scan"
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {parallelScanning ? (
                  <>
                    <IconBolt size={16} className="text-yellow-500" />
                    Parallel Scan
                  </>
                ) : (
                  <>
                    <IconClock size={16} className="text-blue-500" />
                    Sequential Scan
                  </>
                )}
              </div>
              <div className="text-xs text-text-muted">
                {parallelScanning
                  ? "Scan all servers simultaneously (faster)"
                  : "Scan servers one by one (safer)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Servers List */}
      {config.servers.length === 0 && !isAdding ? (
        <div className="text-center py-12 bg-surface-elevated rounded-lg border border-border">
          <IconServer size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">No servers configured</p>
          <Button onClick={handleStartAddServer} variant="primary">
            Add Your First Server
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {config.servers.map((server) => {
            const isActive = server.id === config.activeServerId;
            const isTesting = testing === server.id;
            const isServerScanning = scanningServers.has(server.id);
            const serverTracks = tracks.filter((t) => t.serverId === server.id);

            return (
              <div
                key={server.id}
                className={`p-4 rounded-lg border transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "bg-surface-elevated border-border hover:border-border-hover"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-text-primary truncate">
                        {server.name}
                      </h4>
                      {isActive && (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                          <IconCheck size={12} />
                          Active
                        </span>
                      )}
                      {isServerScanning && (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full animate-pulse">
                          Scanning...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mb-1 truncate">
                      {server.serverUrl}
                    </p>
                    {serverTracks.length > 0 && (
                      <p className="text-xs text-green-500">
                        {serverTracks.length} tracks loaded
                      </p>
                    )}
                    {server.lastConnected && (
                      <p className="text-xs text-text-muted">
                        Last connected:{" "}
                        {new Date(server.lastConnected).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleScanServer(server.id)}
                      disabled={isServerScanning}
                      variant="secondary"
                      size="sm"
                    >
                      Scan
                    </Button>
                    {!isActive && (
                      <Button
                        onClick={() => handleSwitchServer(server.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Switch
                      </Button>
                    )}
                    <ActionIconButton
                      icon={IconRefresh}
                      onClick={() => handleTestConnection(server.id)}
                      title="Test connection"
                      className={isTesting ? "animate-spin" : ""}
                    />
                    <ActionIconButton
                      icon={IconTrash}
                      onClick={() => handleRemoveServer(server.id)}
                      title="Remove server"
                      className="text-red-500 hover:bg-red-500/10"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Multi-Server Support:</strong> You can connect to multiple
          Sonántica instances and aggregate your music library from all of them.
          Use "Scan All Servers" to load tracks from all configured servers, or
          scan individual servers as needed.
          {autoScan &&
            " Auto-scan is enabled - servers will be scanned automatically on startup."}
        </p>
      </div>
    </div>
  );
}
