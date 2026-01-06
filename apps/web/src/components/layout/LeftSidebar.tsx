/**
 * Left Sidebar - Navigation
 *
 * Main navigation for the application.
 * "User autonomy" - clear, accessible navigation.
 */

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
