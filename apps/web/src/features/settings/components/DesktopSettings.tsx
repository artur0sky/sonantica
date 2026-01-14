import { useSettingsStore } from "../../../stores/settingsStore";
import { IconLayoutNavbar, IconPackage } from "@tabler/icons-react";

export function DesktopSettings() {
  const { desktopCloseAction, setDesktopCloseAction } = useSettingsStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
