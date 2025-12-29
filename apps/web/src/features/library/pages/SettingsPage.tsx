/**
 * Settings Page
 *
 * Server-based configuration for Sonántica.
 * No local file scanning - all media comes from configured servers.
 */

import { useState } from "react";
import { Button } from "@sonantica/ui";
import { IconServer, IconRefresh } from "@tabler/icons-react";
import { useLocation } from "wouter";
import { ServersSection } from "../components/ServersSection";

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshLibrary = async () => {
    setRefreshing(true);
    try {
      // Trigger a refresh of all configured servers
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-text-muted">
          Configure your Sonántica media servers
        </p>
      </div>

      {/* Server Configuration */}
      <div className="bg-surface-elevated border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <IconServer size={24} className="text-accent" />
          <h2 className="text-xl font-semibold">Media Servers</h2>
        </div>
        <p className="text-sm text-text-muted mb-6">
          Add and manage your Sonántica API servers. Each server provides access
          to your music library.
        </p>

        <ServersSection />
      </div>

      {/* Actions */}
      <div className="bg-surface-elevated border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Library Actions</h2>

        <div className="space-y-4">
          <div>
            <Button
              onClick={handleRefreshLibrary}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <IconRefresh
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Library"}
            </Button>
            <p className="text-sm text-text-muted mt-2">
              Reload the page to fetch the latest data from all configured
              servers
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              Back to Library
            </Button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-surface border border-border/50 rounded-lg">
        <p className="text-sm text-text-muted">
          <strong>Server-based architecture:</strong> Sonántica now uses a
          server-based approach. All media files are streamed from configured
          API servers. No local file scanning is required.
        </p>
      </div>
    </div>
  );
}
