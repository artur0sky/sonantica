import { useState } from "react";
import type { Plugin } from "../../../services/PluginService";
import { Switch, Button, Badge } from "@sonantica/ui";
import {
  IconSettings,
  IconAlertTriangle,
  IconCheck,
  IconActivity,
} from "@tabler/icons-react";

interface PluginCardProps {
  plugin: Plugin;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onConfigure: (plugin: Plugin) => void;
}

export function PluginCard({ plugin, onToggle, onConfigure }: PluginCardProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      await onToggle(plugin.id, checked);
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = plugin.health?.status === "ok";

  return (
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
            <Badge variant={isHealthy ? "success" : "error"} className="gap-1">
              {isHealthy ? (
                <IconCheck size={12} />
              ) : (
                <IconAlertTriangle size={12} />
              )}
              {isHealthy ? "Operational" : "Issues Detected"}
            </Badge>
          )}
          {!plugin.isEnabled && <Badge variant="default">Disabled</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
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
            onChange={handleToggle}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
