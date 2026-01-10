import { useState } from "react";
import type { Plugin } from "../../../services/PluginService";
import { Switch, Button, Badge } from "@sonantica/ui";
import {
  IconSettings,
  IconAlertTriangle,
  IconCheck,
  IconActivity,
  IconRefresh,
} from "@tabler/icons-react";
import { PluginActivationModal } from "./PluginActivationModal";
import { useQueueStore } from "@sonantica/player-core";

interface PluginCardProps {
  plugin: Plugin;
  onToggle: (
    id: string,
    enabled: boolean,
    scope?: string,
    trackIds?: string[]
  ) => Promise<void>;
  onConfigure: (plugin: Plugin) => void;
}

export function PluginCard({ plugin, onToggle, onConfigure }: PluginCardProps) {
  const [loading, setLoading] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);

  const handleToggleClick = (checked: boolean) => {
    if (checked) {
      // Enabling: Show Modal
      setShowActivationModal(true);
    } else {
      // Disabling: Confirm?
      if (
        confirm(
          "Are you sure you want to disable this plugin? Any running jobs will be stopped."
        )
      ) {
        handleConfirmToggle(false);
      }
    }
  };

  const handleConfirmToggle = async (enabled: boolean, scope?: string) => {
    setShowActivationModal(false);
    setLoading(true);
    try {
      let trackIds: string[] | undefined;

      // If scope is queue, extract track IDs from current player queue
      if (scope === "queue") {
        const queueState = useQueueStore.getState();
        // Extract all track IDs from the queue
        trackIds = queueState.queue.map((t) => t.id);
        console.log(
          `[PluginCard] Extracted ${trackIds.length} tracks from queue for plugin activation`
        );
      }

      await onToggle(plugin.id, enabled, scope, trackIds);
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = plugin.health?.status === "ok";
  const storageBytes = plugin.health?.storage_usage_bytes || 0;
  const storageUsed =
    storageBytes > 0 ? (storageBytes / 1024 / 1024).toFixed(2) + " MB" : "0 MB";

  return (
    <>
      <div className="bg-surface-base border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all hover:border-border-hover">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                plugin.isEnabled
                  ? "bg-accent/10 text-accent"
                  : "bg-surface-highlight text-text-muted"
              }`}
            >
              <IconActivity size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">
                {plugin.manifest.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-text-muted bg-surface-highlight px-1.5 py-0.5 rounded">
                  v{plugin.manifest.version || "0.0.0"}
                </span>
                <span className="text-xs text-text-muted capitalize">
                  • {plugin.manifest.capability}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed max-w-xl">
            {plugin.manifest.description || "No description provided."}
          </p>

          <div className="flex items-center gap-3 pt-1">
            {plugin.isEnabled && (
              <Badge
                variant={isHealthy ? "success" : "error"}
                className="gap-1"
              >
                {isHealthy ? (
                  <IconCheck size={12} />
                ) : (
                  <IconAlertTriangle size={12} />
                )}
                {isHealthy ? "Operational" : "Issues Detected"}
              </Badge>
            )}
            {!plugin.isEnabled && <Badge variant="default">Disabled</Badge>}

            {plugin.isEnabled && (
              <span className="text-xs text-text-muted border-l border-border pl-3 ml-1">
                Storage: {storageUsed}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {plugin.isEnabled && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleConfirmToggle(true, "all")}
              disabled={loading}
              title="Sync Missing Tracks"
            >
              <IconRefresh
                size={18}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden md:inline">Sync</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => onConfigure(plugin)}>
            <IconSettings size={18} className="mr-2" />
            Config
          </Button>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                plugin.isEnabled ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {plugin.isEnabled ? "On" : "Off"}
            </span>
            <Switch
              checked={plugin.isEnabled}
              onChange={handleToggleClick}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <PluginActivationModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        onConfirm={(scope) => handleConfirmToggle(true, scope)}
        pluginName={plugin.manifest.name}
        capability={plugin.manifest.capability}
      />
    </>
  );
}
