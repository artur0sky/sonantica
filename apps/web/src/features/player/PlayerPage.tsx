/**
 * Player Page
 *
 * Main player interface with tabs for different views.
 */

import { useState } from "react";
import { Button } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";
import { PlayerControls } from "./components/PlayerControls";
import { NowPlaying } from "./components/NowPlaying";
import { Timeline } from "./components/Timeline";
import { VolumeControl } from "./components/VolumeControl";
import { LyricsDisplay } from "./components/LyricsDisplay";
import { cn } from "@sonantica/shared";
import { IconMusic, IconMicrophone, IconInfoCircle } from "@tabler/icons-react";

type TabType = "player" | "lyrics" | "info";

export function PlayerPage() {
  const { loadTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<TabType>("player");

  // Log component mount
  console.log("🎵 PlayerPage rendered");

  const handleLoadDemo = async () => {
    try {
      await loadTrack({
        id: "demo-1",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        mimeType: "audio/mpeg",
        metadata: {
          title: "SoundHelix Song #1",
          artist: "SoundHelix",
          album: "Demo Album",
        },
      });
    } catch (error) {
      console.error("Failed to load demo:", error);
    }
  };

  // Log active tab changes
  console.log("📑 Active tab:", activeTab);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Now Playing */}
      <NowPlaying />

      {/* Tabs */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-border bg-surface-elevated">
          <button
            onClick={() => setActiveTab("player")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "player"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconMusic size={18} stroke={1.5} />
            Player
          </button>
          <button
            onClick={() => setActiveTab("lyrics")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "lyrics"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconMicrophone size={18} stroke={1.5} />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "info"
                ? "bg-surface text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text hover:bg-surface/50"
            )}
          >
            <IconInfoCircle size={18} stroke={1.5} />
            Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "player" && (
            <div className="space-y-6">
              <PlayerControls />
              <Timeline />
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button onClick={handleLoadDemo} variant="ghost" size="sm">
                  🎵 Load Demo Track
                </Button>
                <VolumeControl />
              </div>
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="min-h-[400px]">
              <LyricsDisplay />
            </div>
          )}

          {activeTab === "info" && (
            <div>
              <h3 className="font-semibold mb-3">About Sonántica</h3>
              <p className="text-sm text-text-muted mb-4">
                Navigate your music library or load a demo track to start
                listening.
              </p>
              <ul className="text-sm text-text-muted space-y-2">
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/player-core
                  </span>{" "}
                  - Audio engine
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/media-library
                  </span>{" "}
                  - Library indexing
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">
                    @sonantica/lyrics
                  </span>{" "}
                  - Lyrics extraction
                </li>
                <li>
                  •{" "}
                  <span className="text-accent font-mono">@sonantica/web</span>{" "}
                  - This PWA
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
