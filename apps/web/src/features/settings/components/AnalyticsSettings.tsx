import { useAnalyticsStore } from "@sonantica/analytics";
import {
  IconDeviceAnalytics,
  IconWorldUpload,
  IconActivity,
} from "@tabler/icons-react";
import { Switch } from "@sonantica/ui";

import { useSettingsStore } from "../../../stores/settingsStore";

export function AnalyticsSettings() {
  const { config, updateConfig } = useAnalyticsStore();
  const { analyticsDashboardRefreshRate, setNumber } = useSettingsStore();

  const handleLatencyChange = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        updateConfig({ flushInterval: 10000, batchSize: 10 });
        break;
      case "medium":
        updateConfig({ flushInterval: 60000, batchSize: 50 });
        break;
      case "high":
        updateConfig({ flushInterval: 300000, batchSize: 100 });
        break;
    }
  };

  const currentLatency =
    config.flushInterval <= 15000
      ? "low"
      : config.flushInterval <= 60000
      ? "medium"
      : "high";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-surface-elevated border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IconDeviceAnalytics className="text-accent" />
          Analytics & Privacy
        </h2>

        <p className="text-sm text-text-muted mb-6">
          Sonántica follows a strict "Technical Transparency" philosophy. You
          decide exactly what data is collected. All data stays on your server.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-text-primary">
                Enable Analytics
              </label>
              <p className="text-sm text-text-muted">
                Collect listening history and system health metrics.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onChange={(checked) => updateConfig({ enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-text-primary">
                Offline Tracking
              </label>
              <p className="text-sm text-text-muted">
                Buffer events when offline and send them later.
              </p>
            </div>
            <Switch
              checked={config.trackInOfflineMode}
              disabled={!config.enabled}
              onChange={(checked) =>
                updateConfig({ trackInOfflineMode: checked })
              }
            />
          </div>

          <hr className="border-border/50" />

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium text-text-primary">
                  Playback Data
                </label>
                <p className="text-sm text-text-muted">
                  Track plays, skips, and listening duration.
                </p>
              </div>
              <Switch
                checked={config.collectPlaybackData}
                disabled={!config.enabled}
                onChange={(checked) =>
                  updateConfig({ collectPlaybackData: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium text-text-primary">
                  UI Interactions
                </label>
                <p className="text-sm text-text-muted">
                  Track page views and theme changes.
                </p>
              </div>
              <Switch
                checked={config.collectUIInteractions}
                disabled={!config.enabled}
                onChange={(checked) =>
                  updateConfig({ collectUIInteractions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium text-text-primary">
                  Search History
                </label>
                <p className="text-sm text-text-muted">
                  Track search queries to improve results.
                </p>
              </div>
              <Switch
                checked={config.collectSearchData}
                disabled={!config.enabled}
                onChange={(checked) =>
                  updateConfig({ collectSearchData: checked })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-elevated border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IconWorldUpload className="text-accent" />
          Network Performance
        </h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Reporting Frequency (Latency)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLatencyChange("low")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  currentLatency === "low"
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-surface border-border text-text-muted hover:bg-surface-hover"
                }`}
              >
                Real-time
                <span className="block text-[10px] opacity-70 mt-0.5">
                  High Bandwidth
                </span>
              </button>
              <button
                onClick={() => handleLatencyChange("medium")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  currentLatency === "medium"
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-surface border-border text-text-muted hover:bg-surface-hover"
                }`}
              >
                Normal
                <span className="block text-[10px] opacity-70 mt-0.5">
                  Balanced
                </span>
              </button>
              <button
                onClick={() => handleLatencyChange("high")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  currentLatency === "high"
                    ? "bg-accent/10 border-accent text-accent"
                    : "bg-surface border-border text-text-muted hover:bg-surface-hover"
                }`}
              >
                Passive
                <span className="block text-[10px] opacity-70 mt-0.5">
                  Background
                </span>
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Controls how often the app sends data to the server ("Batching").
              Passive is recommended for mobile devices to save battery.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
            <IconActivity size={18} className="text-text-muted" />
            <div className="text-xs text-text-muted font-mono">
              Current Buffer: {config.batchSize} events /{" "}
              {config.flushInterval / 1000}s interval
            </div>
          </div>
        </div>
      </div>
      <div className="bg-surface-elevated border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IconActivity className="text-accent" />
          Dashboard Updates
        </h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Refresh Frequency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 30000, 60000].map((rate) => (
                <button
                  key={rate}
                  onClick={() =>
                    setNumber("analyticsDashboardRefreshRate", rate)
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    analyticsDashboardRefreshRate === rate
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface border-border text-text-muted hover:bg-surface-hover"
                  }`}
                >
                  {rate / 1000}s
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              Controls how often the Analytics Dashboard fetches new data. Fewer
              updates reduce server load.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
