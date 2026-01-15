import React from "react";
import { Link, useLocation } from "wouter";
import {
  IconMusic,
  IconPlaylist,
  IconChartBar,
  IconSparkles,
  IconWaveSquare,
  IconPin,
  IconPinnedOff,
  IconHammer,
  IconMicrophone,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";

import { cn, isTauri } from "@sonantica/shared";
import type { Playlist } from "@sonantica/media-library";
import { useLeftSidebarLogic } from "../../hooks/useLeftSidebarLogic";
import { useSettingsStore } from "../../stores/settingsStore";

interface NavItem {
  path: string;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    stroke?: number;
    className?: string;
  }>;
}

const navItems: NavItem[] = [
  { path: "/library", label: "Library", Icon: IconMusic },
  { path: "/recommendations", label: "Discovery", Icon: IconSparkles },
  { path: "/dsp", label: "DSP Engine", Icon: IconWaveSquare },
  { path: "/analytics", label: "Analytics", Icon: IconChartBar },
  { path: "/workshop", label: "Workshop", Icon: IconHammer },
];

const studioItems: NavItem[] = [
  { path: "/compositor", label: "Compositor", Icon: IconMicrophone },
  {
    path: "/orquestador",
    label: "Orquestador",
    Icon: IconAdjustmentsHorizontal,
  },
];

interface LeftSidebarProps {
  isCollapsed?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isCollapsed = false,
}) => {
  const [location] = useLocation();
  const { playlists, pinnedPlaylistIds, togglePin, isPlaylistActive } =
    useLeftSidebarLogic();

  const enableCompositor = useSettingsStore((s) => s.enableCompositor);
  const enableOrquestador = useSettingsStore((s) => s.enableOrquestador);
  const devForceStudio = useSettingsStore((s) => s.devForceStudio);

  React.useEffect(() => {
    const isTauriEnv =
      typeof window !== "undefined" &&
      ((window as any).__TAURI__ !== undefined ||
        (window as any).__TAURI_INTERNALS__ !== undefined);
    console.log("[Sonántica Studio]", {
      isTauriEnv,
      isTauriUtil: isTauri(),
      enableCompositor,
      enableOrquestador,
      devForceStudio,
    });
  }, [enableCompositor, enableOrquestador, devForceStudio]);

  const isTauriActual =
    isTauri() ||
    (typeof window !== "undefined" &&
      (window as any).__TAURI_INTERNALS__ !== undefined) ||
    devForceStudio;

  const pinnedPlaylists = playlists.filter((p: Playlist) =>
    pinnedPlaylistIds.includes(p.id)
  );
  const otherPlaylists = playlists.filter(
    (p: Playlist) => !pinnedPlaylistIds.includes(p.id)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-surface-base border-r border-border/40 overflow-hidden transition-all duration-300",
        isCollapsed ? "w-full" : "w-full" // Width is controlled by parent aside in MainLayout
      )}
    >
      {/* Brand */}
      <div className={cn("p-6", isCollapsed && "flex justify-center px-0")}>
        <h2 className="text-xl font-bold text-accent tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white flex-shrink-0">
            S
          </div>
          {!isCollapsed && <span>Sonántica</span>}
        </h2>
        {!isCollapsed && (
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest opacity-50">
            Audio Interpreter
          </p>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 opacity-50">
            Main
          </div>
        )}
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group cursor-pointer",
                isCollapsed && "justify-center",
                location === item.path
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-text-muted hover:text-text hover:bg-surface-elevated"
              )}
            >
              <item.Icon
                size={20}
                stroke={1.5}
                className={cn(
                  "transition-transform group-hover:scale-110 flex-shrink-0",
                  location === item.path ? "text-accent" : "text-text-muted"
                )}
              />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
              {!isCollapsed && location === item.path && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </div>
          </Link>
        ))}

        {/* Studio Section (Tauri Only) */}
        {isTauriActual && (enableCompositor || enableOrquestador) && (
          <div className="pt-6 space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 opacity-50">
                Studio
              </div>
            )}
            {studioItems.map((item) => {
              const isEnabled =
                item.path === "/compositor"
                  ? enableCompositor
                  : enableOrquestador;

              if (!isEnabled) return null;

              return (
                <Link key={item.path} href={item.path}>
                  <div
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group cursor-pointer",
                      isCollapsed && "justify-center",
                      location === item.path
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-text-muted hover:text-text hover:bg-surface-elevated"
                    )}
                  >
                    <item.Icon
                      size={20}
                      stroke={1.5}
                      className={cn(
                        "transition-transform group-hover:scale-110 flex-shrink-0",
                        location === item.path
                          ? "text-accent"
                          : "text-text-muted"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                    {!isCollapsed && location === item.path && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pinned Playlists */}
        {pinnedPlaylists.length > 0 && (
          <div className="pt-6 space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 opacity-50">
                Pinned
              </div>
            )}
            {pinnedPlaylists.map((playlist) => (
              <PlaylistNavItem
                key={playlist.id}
                playlist={playlist}
                isActive={isPlaylistActive(playlist.id)}
                isPinned={true}
                onTogglePin={() => togglePin(playlist.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}

        {/* Library / Collection */}
        {!isCollapsed && (
          <div className="pt-6 space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2 opacity-50">
              Collection
            </div>
            <Link href="/playlists">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-elevated transition-all cursor-pointer",
                  location === "/playlists" && "bg-surface-elevated text-text"
                )}
              >
                <IconPlaylist size={20} stroke={1.5} />
                <span className="text-sm">Manage Playlists</span>
              </div>
            </Link>
            {otherPlaylists.slice(0, 8).map((playlist) => (
              <PlaylistNavItem
                key={playlist.id}
                playlist={playlist}
                isActive={isPlaylistActive(playlist.id)}
                isPinned={false}
                onTogglePin={() => togglePin(playlist.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Philosophical Footer */}
      {!isCollapsed && (
        <div className="p-6 mt-auto border-t border-border/20 bg-surface-elevated/20">
          <p className="text-[10px] text-text-muted italic leading-relaxed text-center">
            "Respect the intention of the sound and the freedom of the
            listener."
          </p>
        </div>
      )}
    </aside>
  );
};

interface PlaylistNavItemProps {
  playlist: Playlist;
  isActive: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  isCollapsed?: boolean;
}

const PlaylistNavItem: React.FC<PlaylistNavItemProps> = ({
  playlist,
  isActive,
  isPinned,
  onTogglePin,
  isCollapsed = false,
}) => {
  return (
    <div
      title={isCollapsed ? playlist.name : undefined}
      className={cn(
        "group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
        isCollapsed && "justify-center",
        isActive
          ? "bg-surface-elevated text-text"
          : "text-text-muted hover:text-text hover:bg-surface-elevated/50"
      )}
    >
      <Link
        href={`/playlists/${playlist.id}`}
        className={cn(
          "flex-1 flex items-center gap-3 min-w-0",
          isCollapsed && "justify-center"
        )}
      >
        <div className="w-8 h-8 rounded bg-surface-elevated flex-shrink-0 flex items-center justify-center border border-border/20">
          <IconPlaylist size={16} className="text-text-muted" />
        </div>
        {!isCollapsed && (
          <span className="text-sm truncate">{playlist.name}</span>
        )}
      </Link>
      {!isCollapsed && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-surface-elevated",
            isPinned ? "text-accent opacity-100" : "text-text-muted"
          )}
        >
          {isPinned ? (
            <IconPin size={14} fill="currentColor" />
          ) : (
            <IconPinnedOff size={14} />
          )}
        </button>
      )}
    </div>
  );
};
