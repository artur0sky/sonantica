import { useEffect, useState } from "react";
import { PluginService, type Plugin } from "../../../services/PluginService";
import { PluginCard } from "./PluginCard";
import { PluginConfigModal } from "./PluginConfigModal";
import {
  IconPlugConnected,
  IconPlus,
  IconAlertTriangle,
  IconDeviceDesktop,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconCpu,
} from "@tabler/icons-react";
import { Button, SettingSection, SettingRow, Switch } from "@sonantica/ui";
import { isTauri } from "@sonantica/shared";
import { useSettingsStore } from "../../../stores/settingsStore";

export function PluginsSettings() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const {
    enableServerPluginsOnDesktop,
    enableCompositor,
    enableOrquestador,
    devForceStudio,
    toggle,
  } = useSettingsStore();

  const isDesktop = isTauri();

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const data = await PluginService.getAllPlugins();
      setPlugins(data);
    } catch (error) {
      console.error("Failed to fetch plugins", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleTogglePlugin = async (
    id: string,
    enabled: boolean,
    scope?: string,
    trackIds?: string[]
  ) => {
    try {
      await PluginService.togglePlugin(id, enabled, scope, trackIds);
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isEnabled: enabled } : p))
      );
    } catch (error) {
      console.error("Failed to toggle plugin", error);
    }
  };

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!selectedPlugin) return;
    try {
      await PluginService.updateConfig(selectedPlugin.id, config);
      setPlugins((prev) =>
        prev.map((p) => (p.id === selectedPlugin.id ? { ...p, config } : p))
      );
    } catch (error) {
      console.error("Failed to update config", error);
      throw error;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Strategy */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Workshop & Extensions
          </h2>
          <p className="text-text-muted">
            Manage intelligent services and sound engineering tools.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            window.open(
              "https://github.com/artur0sky/sonantica-plugins",
              "_blank"
            )
          }
        >
          <IconPlus size={18} className="mr-2" />
          Get Plugins
        </Button>
      </div>

      {/* 1. Intelligent Services (Server-side) */}
      <SettingSection
        title="Intelligent Services"
        description="Remote AI capabilities provided by your Sonántica Server."
        icon={IconCpu}
      >
        {isDesktop && !enableServerPluginsOnDesktop && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-4">
            <IconAlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                Server Plugins Hovering
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Plugins are inactive to prioritize local desktop performance.
                Enable <strong>Server Plugins on Desktop</strong> below to use
                them.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isDesktop && !enableServerPluginsOnDesktop ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-surface/20 rounded-xl border border-border border-dashed">
              <IconCpu size={40} className="text-text-muted opacity-20" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-muted">
                  Server Bridge Inactive
                </p>
                <p className="text-xs text-text-muted/60 max-w-xs mx-auto">
                  Remote AI plugins are hidden to save resources and improve
                  native performance.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="py-10 text-center text-text-muted text-sm italic">
              Synchronizing with server...
            </div>
          ) : plugins.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm border border-dashed border-border rounded-xl">
              No server-side plugins registered.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={handleTogglePlugin}
                  onConfigure={setSelectedPlugin}
                />
              ))}
            </div>
          )}
        </div>
      </SettingSection>

      {/* 2. Studio Features (Desktop-side) */}
      {(isDesktop || devForceStudio) && (
        <SettingSection
          title="Studio Engineering"
          description="High-performance local tools for sound creation and routing."
          icon={IconDeviceDesktop}
        >
          <SettingRow
            label="Compositor"
            description="Waveform editing and multi-track recording engine."
            icon={IconMicrophone}
          >
            <Switch
              checked={enableCompositor}
              onChange={() => toggle("enableCompositor")}
            />
          </SettingRow>

          <SettingRow
            label="Orquestador"
            description="Advanced virtual mixer and audio routing (VoiceMeeter logic)."
            icon={IconAdjustmentsHorizontal}
          >
            <Switch
              checked={enableOrquestador}
              onChange={() => toggle("enableOrquestador")}
            />
          </SettingRow>
        </SettingSection>
      )}

      {/* 3. Advanced Configuration & Bridge */}
      <SettingSection
        title="Plugin Infrastructure"
        description="Global settings for the plugin ecosystem."
        icon={IconPlugConnected}
      >
        {isDesktop && (
          <SettingRow
            label="Server Plugins on Desktop"
            description="Allow remote AI processing (Demucs, Brain) while running natively."
          >
            <Switch
              checked={enableServerPluginsOnDesktop}
              onChange={() => toggle("enableServerPluginsOnDesktop")}
              variant="emerald"
            />
          </SettingRow>
        )}

        <SettingRow
          label="Force Studio Visibility"
          description="Display Desktop-only tools on Web environment (Development)."
        >
          <Switch
            checked={devForceStudio}
            onChange={() => toggle("devForceStudio")}
            variant="warning"
          />
        </SettingRow>
      </SettingSection>

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
