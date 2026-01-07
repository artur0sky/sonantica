/**
 * Left Sidebar - Navigation
 *
 * Main navigation for the application.
 * "User autonomy" - clear, accessible navigation.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import {
  IconMusic,
  IconDisc,
  IconMicrophone,
  IconPlaylist,
  IconChartBar,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@sonantica/shared";
import { useLeftSidebarLogic } from "../../hooks/useLeftSidebarLogic";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlaylistSettingsStore } from "../../stores/playlistSettingsStore";
import { IconPin, IconPinnedOff } from "@tabler/icons-react";

interface NavItem {
  path: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
}

const navItems: NavItem[] = [
  { path: "/", label: "Tracks", Icon: IconMusic },
  { path: "/albums", label: "Albums", Icon: IconDisc },
  { path: "/artists", label: "Artists", Icon: IconMicrophone },
  { path: "/playlists", label: "Playlists", Icon: IconPlaylist },
  { path: "/analytics", label: "Analytics", Icon: IconChartBar },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

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
    // Exclude history snapshots by default for a cleaner sidebar
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
      .slice(0, 15); // Show top 15
  }, [playlists, pinnedIds, lastAccessed]);

  return (
    <nav
      className={cn("p-4 transition-all duration-300", isCollapsed && "p-2")}
    >
      {/* Header */}
      {!isCollapsed && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text">Library</h2>
          <p className="text-xs text-text-muted mt-1">
            "Every file has an intention."
          </p>
        </motion.div>
      )}

      {/* Navigation Items */}
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {navItems.map((item) => {
          const isActive = location === item.path;
          const { Icon } = item;

          return (
            <motion.li key={item.path} variants={itemVariants}>
              <Link href={item.path}>
                <motion.a
                  whileHover={{
                    x: isCollapsed ? 0 : 4,
                    scale: isCollapsed ? 1.05 : 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer overflow-hidden",
                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto",
                    "hover:bg-white/5",
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/40"
                      : "text-text-muted hover:text-text"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={isCollapsed ? 30 : 22} stroke={1.5} />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.a>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Playlists Section */}
      {!isCollapsed && sidebarPlaylists.length > 0 && (
        <div className="mt-8">
          <div className="px-4 mb-2 flex items-center justify-between group/header">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60">
              Your Playlists
            </h3>
          </div>
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-0.5"
          >
            {sidebarPlaylists.map((playlist: any) => {
              const isActive = location === `/playlist/${playlist.id}`;
              const isPinned = pinnedIds.includes(playlist.id);

              return (
                <motion.li key={playlist.id} variants={itemVariants}>
                  <div className="group relative">
                    <Link href={`/playlist/${playlist.id}`}>
                      <motion.a
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => trackAccess(playlist.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl transition-all cursor-pointer overflow-hidden",
                          "hover:bg-white/5",
                          isActive
                            ? "bg-accent/10 text-accent font-semibold"
                            : "text-text-muted hover:text-text"
                        )}
                      >
                        <IconPlaylist
                          size={18}
                          stroke={1.5}
                          className={cn(
                            isActive ? "text-accent" : "text-text-muted/50"
                          )}
                        />
                        <span className="text-sm truncate pr-6">
                          {playlist.name}
                        </span>
                      </motion.a>
                    </Link>

                    {/* Pin Toggle */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePin(playlist.id);
                      }}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 text-text-muted",
                        isPinned && "opacity-100 text-accent"
                      )}
                      title={isPinned ? "Unpin" : "Pin"}
                    >
                      {isPinned ? (
                        <IconPinnedOff size={14} />
                      ) : (
                        <IconPin size={14} />
                      )}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-8 pt-4 border-t border-border"
        >
          <p className="text-xs text-text-muted italic">
            "Respect the intention of the sound."
          </p>
        </motion.div>
      )}
    </nav>
  );
}
