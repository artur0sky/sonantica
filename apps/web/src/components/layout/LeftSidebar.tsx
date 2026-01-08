/**
 * Left Sidebar - Navigation
 *
 * Main navigation for the application.
 * Refactored to remove Framer Motion and use CSS animations.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import {
  IconMusic,
  IconDisc,
  IconMicrophone,
  IconPlaylist,
  IconChartBar,
  IconPin,
  IconPinnedOff,
} from "@tabler/icons-react";
import { cn } from "@sonantica/shared";
import { useLeftSidebarLogic } from "../../hooks/useLeftSidebarLogic";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlaylistSettingsStore } from "../../stores/playlistSettingsStore";

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
  { path: "/", label: "Tracks", Icon: IconMusic },
  { path: "/albums", label: "Albums", Icon: IconDisc },
  { path: "/artists", label: "Artists", Icon: IconMicrophone },
  { path: "/playlists", label: "Playlists", Icon: IconPlaylist },
  { path: "/analytics", label: "Analytics", Icon: IconChartBar },
];

interface LeftSidebarProps {
  isCollapsed?: boolean;
}

export function LeftSidebar({ isCollapsed }: LeftSidebarProps) {
  const { location } = useLeftSidebarLogic();
  const { playlists } = useLibraryStore();
  const { pinnedIds, lastAccessed, togglePin, trackAccess } =
    usePlaylistSettingsStore();

  // Filter and sort playlists for sidebar
  const sidebarPlaylists = useMemo(() => {
    const manualPlaylists = playlists.filter(
      (p) => p.type !== "HISTORY_SNAPSHOT"
    );

    return manualPlaylists
      .sort((a, b) => {
        const aPinned = pinnedIds.includes(a.id);
        const bPinned = pinnedIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        const aTime = lastAccessed[a.id] || 0;
        const bTime = lastAccessed[b.id] || 0;
        return bTime - aTime;
      })
      .slice(0, 15);
  }, [playlists, pinnedIds, lastAccessed]);

  return (
    <nav className={cn("p-4 flex flex-col h-full", isCollapsed && "p-2")}>
      {/* Header */}
      {!isCollapsed && (
        <div className="mb-8 px-2 animate-in fade-in slide-in-from-left-4 duration-500">
          <h2 className="text-xl font-bold text-text tracking-tight">
            Library
          </h2>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold opacity-60">
            "Every file has an intention."
          </p>
        </div>
      )}

      {/* Navigation Items */}
      <ul className="space-y-1">
        {navItems.map((item, index) => {
          const isActive = location === item.path;
          const { Icon } = item;

          return (
            <li
              key={item.path}
              className="animate-in fade-in slide-in-from-left-2 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden group",
                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto",
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-text-muted hover:text-text hover:bg-surface-elevated/50"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={isCollapsed ? 30 : 22}
                    stroke={2}
                    className={cn(
                      "transition-transform",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </a>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Playlists Section */}
      {!isCollapsed && sidebarPlaylists.length > 0 && (
        <div className="mt-10 animate-in fade-in duration-700 delay-300">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted opacity-50">
              Collections
            </h3>
          </div>
          <ul className="space-y-0.5">
            {sidebarPlaylists.map((playlist: any, index) => {
              const isActive = location === `/playlist/${playlist.id}`;
              const isPinned = pinnedIds.includes(playlist.id);

              return (
                <li
                  key={playlist.id}
                  className="animate-in fade-in slide-in-from-left-1 fill-mode-both"
                  style={{ animationDelay: `${400 + index * 30}ms` }}
                >
                  <div className="group relative">
                    <Link href={`/playlist/${playlist.id}`}>
                      <a
                        onClick={() => trackAccess(playlist.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
                          isActive
                            ? "bg-accent/10 text-accent font-bold"
                            : "text-text-muted/80 hover:text-text hover:bg-surface-elevated/30"
                        )}
                      >
                        <IconPlaylist
                          size={16}
                          stroke={2}
                          className={cn(
                            isActive ? "text-accent" : "text-text-muted/40"
                          )}
                        />
                        <span className="text-sm truncate pr-6">
                          {playlist.name}
                        </span>
                      </a>
                    </Link>

                    {/* Pin Toggle */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePin(playlist.id);
                      }}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 text-text-muted",
                        isPinned && "opacity-100 text-accent"
                      )}
                      title={isPinned ? "Unpin" : "Pin"}
                    >
                      {isPinned ? (
                        <IconPinnedOff size={14} stroke={2.5} />
                      ) : (
                        <IconPin size={14} stroke={2.5} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer Quote */}
      {!isCollapsed && (
        <div className="mt-auto pt-8 px-4 opacity-30 hover:opacity-100 transition-opacity animate-in fade-in duration-1000 delay-700">
          <div className="w-8 h-0.5 bg-border mb-4" />
          <p className="text-[10px] text-text-muted italic leading-relaxed">
            "Respect the intention of the sound and the freedom of the
            listener."
          </p>
        </div>
      )}
    </nav>
  );
}
