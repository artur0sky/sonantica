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
import { useLocation } from "wouter";
import {
  getServersConfig,
  setActiveServer,
  removeServerConfig,
  testServerConnectionById,
} from "../../../services/LibraryService";
import { useMultiServerLibrary } from "../../../hooks/useMultiServerLibrary";
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

export function ServersSection() {
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState(getServersConfig());
  const [testing, setTesting] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(() => {
    return localStorage.getItem("sonantica:auto-scan") === "true";
  });
  const [parallelScan, setParallelScan] = useState(() => {
    return localStorage.getItem("sonantica:parallel-scan") !== "false"; // Default true
  });

  const {
    tracks,
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

      // If no servers left, redirect to setup
      const newConfig = getServersConfig();
      if (newConfig.servers.length === 0) {
        setLocation("/setup");
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

  const handleAddServer = () => {
    setLocation("/setup");
  };

  const handleScanServer = async (serverId: string) => {
    await scanServer(serverId);
  };

  const handleScanAll = async () => {
    if (parallelScan) {
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

  const handleToggleAutoScan = () => {
    const newValue = !autoScan;
    setAutoScan(newValue);
    localStorage.setItem("sonantica:auto-scan", String(newValue));
  };

  const handleToggleParallelScan = () => {
    const newValue = !parallelScan;
    setParallelScan(newValue);
    localStorage.setItem("sonantica:parallel-scan", String(newValue));
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
        <button
          onClick={handleAddServer}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <IconPlus size={18} />
          Add Server
        </button>
      </div>

      {/* Library Stats */}
      {tracks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {tracks.length}
            </div>
            <div className="text-sm text-text-muted">Tracks</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {config.servers.length}
            </div>
            <div className="text-sm text-text-muted">Servers</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {new Set(tracks.map((t) => t.artist)).size}
            </div>
            <div className="text-sm text-text-muted">Artists</div>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-text-primary">
              {new Set(tracks.map((t) => t.album)).size}
            </div>
            <div className="text-sm text-text-muted">Albums</div>
          </div>
        </div>
      )}

      {/* Scan Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleScanAll}
            disabled={isScanning || config.servers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <IconPlayerPlay
              size={18}
              className={isScanning ? "animate-pulse" : ""}
            />
            {isScanning ? "Scanning..." : "Scan All Servers"}
          </button>
          {tracks.length > 0 && (
            <button
              onClick={handleClearLibrary}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors"
            >
              Clear Library
            </button>
          )}
        </div>

        {/* Scan Options */}
        <div className="flex items-center gap-6 p-4 bg-surface-elevated border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAutoScan}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoScan ? "bg-primary" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoScan ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
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
            <button
              onClick={handleToggleParallelScan}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                parallelScan ? "bg-primary" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  parallelScan ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {parallelScan ? (
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
                {parallelScan
                  ? "Scan all servers simultaneously (faster)"
                  : "Scan servers one by one (safer)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Servers List */}
      {config.servers.length === 0 ? (
        <div className="text-center py-12 bg-surface-elevated rounded-lg border border-border">
          <IconServer size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">No servers configured</p>
          <button
            onClick={handleAddServer}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Add Your First Server
          </button>
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-text-primary">
                        {server.name}
                      </h4>
                      {isActive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                          <IconCheck size={12} />
                          Active
                        </span>
                      )}
                      {isServerScanning && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full animate-pulse">
                          Scanning...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mb-1">
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScanServer(server.id)}
                      disabled={isServerScanning}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      title="Scan this server"
                    >
                      Scan
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => handleSwitchServer(server.id)}
                        className="px-3 py-1.5 text-sm bg-surface-elevated border border-border rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        Switch
                      </button>
                    )}
                    <button
                      onClick={() => handleTestConnection(server.id)}
                      disabled={isTesting}
                      className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
                      title="Test connection"
                    >
                      <IconRefresh
                        size={18}
                        className={isTesting ? "animate-spin" : ""}
                      />
                    </button>
                    <button
                      onClick={() => handleRemoveServer(server.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove server"
                    >
                      <IconTrash size={18} />
                    </button>
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
