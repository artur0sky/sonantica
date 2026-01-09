import { useMemo } from "react";
import {
  SettingSection,
  SettingRow,
  Switch,
  PlatformPieChart,
  StatCard,
} from "@sonantica/ui";
import {
  IconDatabase,
  IconRefresh,
  IconTrash,
  IconDisc,
  IconCloudOff,
} from "@tabler/icons-react";
import { useSettingsStore } from "../../../stores/settingsStore";
import { useStorageInfo } from "../../../hooks/useStorageInfo";
import { formatBytes, clearAllStorage } from "../../../services/StorageService";

export function OfflineSettings() {
  const {
    offlineMode,
    hideUnavailableOffline,
    downloadQuality,
    toggle,
    setDownloadQuality,
  } = useSettingsStore();

  const {
    data: storageData,
    loading: storageLoading,
    refresh: refreshStorage,
  } = useStorageInfo();

  // Format storage data for pie chart
  const storageChartData = useMemo(() => {
    if (
      !storageData ||
      !storageData.breakdown ||
      storageData.breakdown.length === 0
    ) {
      return [];
    }

    return storageData.breakdown.map((category) => ({
      id: category.id,
      label: category.label,
      value: category.value,
      color: category.color,
    }));
  }, [storageData]);

  // Storage statistics cards
  const storageStats = useMemo(() => {
    if (!storageData) return [];

    return [
      {
        label: "Total Used",
        value: formatBytes(storageData.used),
        icon: <IconDisc size={18} />,
      },
      {
        label: "Available",
        value: formatBytes(storageData.available),
        icon: <IconCloudOff size={18} />,
      },
      {
        label: "Usage",
        value: storageData.percentage.toFixed(1),
        unit: "%",
        icon: <IconDatabase size={18} />,
      },
    ];
  }, [storageData]);

  const handleClearStorage = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar todos los datos offline? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await clearAllStorage();
      await refreshStorage();
      alert("Almacenamiento limpiado exitosamente");
    } catch (error) {
      console.error("Failed to clear storage:", error);
      alert("Error al limpiar el almacenamiento");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-200">
      <SettingSection
        title="Offline Mode"
        description="Manage offline playback and downloads."
      >
        <SettingRow
          label="Offline Mode"
          description="Only show and play tracks available offline."
        >
          <Switch
            checked={offlineMode}
            onChange={() => toggle("offlineMode")}
          />
        </SettingRow>

        <SettingRow
          label="Hide Unavailable Tracks"
          description="Hide tracks that aren't downloaded when in offline mode."
        >
          <Switch
            checked={hideUnavailableOffline}
            onChange={() => toggle("hideUnavailableOffline")}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Download Settings"
        description="Configure download quality and behavior."
      >
        <SettingRow
          label="Download Quality"
          description="Quality to use when downloading tracks for offline playback."
        >
          <select
            value={downloadQuality}
            onChange={(e) => setDownloadQuality(e.target.value as any)}
            className="w-full sm:w-auto bg-surface p-2 rounded text-sm px-4 border border-border min-w-[140px] focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="original">Original (Lossless)</option>
            <option value="high">High (320kbps)</option>
            <option value="normal">Normal (192kbps)</option>
            <option value="low">Low (128kbps)</option>
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Storage Usage"
        description="Monitor and manage offline storage consumption."
      >
        {/* Storage Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {storageStats.map((stat, index) => (
            <StatCard key={index} {...stat} loading={storageLoading} />
          ))}
        </div>

        {/* Storage Breakdown Chart */}
        <div className="mb-6">
          <PlatformPieChart
            title="Storage Breakdown"
            data={storageChartData}
            height={350}
            innerRadius={0.6}
            padAngle={2}
            cornerRadius={3}
            loading={storageLoading}
          />
        </div>

        {/* Detailed Breakdown List */}
        {storageData &&
          storageData.breakdown &&
          storageData.breakdown.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium text-text-secondary">
                Detailed Breakdown
              </h4>
              {storageData.breakdown.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary">
                      {formatBytes(category.value)}
                    </span>
                    <span className="text-sm font-medium min-w-[50px] text-right">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Storage Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={refreshStorage}
            disabled={storageLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconRefresh
              size={18}
              className={storageLoading ? "animate-spin" : ""}
            />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          <button
            onClick={handleClearStorage}
            disabled={storageLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconTrash size={18} />
            <span className="text-sm font-medium">Clear All Storage</span>
          </button>
        </div>
      </SettingSection>
    </div>
  );
}
