import { useEffect, useState } from "react";
import { PluginService, type Plugin } from "../../../services/PluginService";
import { PluginCard } from "./PluginCard";
import { PluginConfigModal } from "./PluginConfigModal";
import { IconPlugConnected, IconPlus } from "@tabler/icons-react";
import { Button } from "@sonantica/ui";

import { usePluginStore } from "../../../stores/pluginStore";

export function PluginsSettings() {
  const {
    plugins,
    isLoading: loading,
    fetchPlugins,
    togglePlugin,
  } = usePluginStore();
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleToggle = async (
    id: string,
    enabled: boolean,
    scope?: string,
    trackIds?: string[]
  ) => {
    await togglePlugin(id, enabled, scope, trackIds);
  };

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!selectedPlugin) return;
    try {
      await PluginService.updateConfig(selectedPlugin.id, config);
      // We might want to refetch or update the specific plugin config in store
      fetchPlugins();
    } catch (error) {
      console.error("Failed to update config", error);
      throw error;
    }
  };

  const handleInstallClick = () => {
    window.open("https://github.com/artur0sky/sonantica-plugins", "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <IconPlugConnected className="text-accent" />
            AI Plugins & Extensions
          </h2>
          <p className="text-sm text-text-muted">
            Enhance Sonántica with AI features like stem separation and
            recommendations.
          </p>
        </div>
        <Button variant="secondary" onClick={handleInstallClick}>
          <IconPlus size={18} className="mr-2" />
          Find Plugins
        </Button>
      </div>

      <div className="bg-surface-elevated border border-border rounded-xl p-4 sm:p-6 space-y-4 min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            Loading plugins...
          </div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <IconPlugConnected size={48} className="mx-auto mb-4 opacity-50" />
            <p>No plugins installed.</p>
            <p className="text-xs mt-2">
              Check Docker Compose to add AI services.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={handleToggle}
                onConfigure={setSelectedPlugin}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPlugin && (
        <PluginConfigModal
          isOpen={!!selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          config={selectedPlugin.config}
          onSave={handleSaveConfig}
          pluginName={selectedPlugin.manifest.name}
          pluginId={selectedPlugin.id}
        />
      )}
    </div>
  );
}
