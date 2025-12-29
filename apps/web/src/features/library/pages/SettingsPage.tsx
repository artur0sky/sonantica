/**
 * Settings Page
 *
 * Configuration for Sonántica.
 * Features:
 * - Server management
 * - Application info
 * - General settings (future)
 */

import { useState } from "react";
import { Tabs, type Tab } from "@sonantica/ui";
import { IconServer, IconInfoCircle, IconSettings } from "@tabler/icons-react";
import { ServersSection } from "../components/ServersSection";
import { useLocation } from "wouter";
import { Button } from "@sonantica/ui";

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("servers");

  const tabs: Tab[] = [
    {
      id: "servers",
      label: "Servers",
      icon: IconServer,
    },
    {
      id: "general",
      label: "General",
      icon: IconSettings,
    },
    {
      id: "info",
      label: "Info",
      icon: IconInfoCircle,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-text-muted">Configure your Sonántica experience</p>
        </div>
        <Button variant="ghost" onClick={() => setLocation("/")}>
          Back to Library
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "servers" && (
          <div className="bg-surface-elevated border border-border rounded-lg p-4 sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Media Servers</h2>
              <p className="text-sm text-text-muted">
                Manage your connections to Sonántica API servers.
              </p>
            </div>
            <ServersSection />
          </div>
        )}

        {activeTab === "general" && (
          <div className="bg-surface-elevated border border-border rounded-lg p-4 sm:p-6 text-center py-20">
            <IconSettings size={48} className="mx-auto mb-4 text-text-muted" />
            <h2 className="text-xl font-semibold mb-2">General Settings</h2>
            <p className="text-text-muted">
              Additional configuration options coming soon.
            </p>
          </div>
        )}

        {activeTab === "info" && (
          <div className="bg-surface-elevated border border-border rounded-lg p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">About Sonántica</h2>
              <div className="prose prose-invert max-w-none text-text-muted">
                <p className="mb-4">
                  <strong>Server-based architecture:</strong> Sonántica uses a
                  distributed server-based approach. All media files are
                  streamed from configured API servers. No local file scanning
                  is performed by the client directly; it relies on the servers
                  to index and serve content.
                </p>
                <p>
                  This allows you to access your music from anywhere, aggregate
                  multiple libraries, and keep your client lightweight.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="text-sm text-text-muted">
                <p>Version: 0.1.0 (Alpha)</p>
                <p>Client: Web / PWA</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
