/**
 * Left Sidebar - Navigation
 * 
 * Main navigation for the application.
 * "User autonomy" - clear, accessible navigation.
 */

import { Link, useLocation } from 'wouter';
import { IconMusic, IconDisc, IconMicrophone, IconPlaylist } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '../../utils';

interface NavItem {
  path: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Tracks', Icon: IconMusic },
  { path: '/albums', label: 'Albums', Icon: IconDisc },
  { path: '/artists', label: 'Artists', Icon: IconMicrophone },
  { path: '/playlists', label: 'Playlists', Icon: IconPlaylist },
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

export function LeftSidebar() {
  const [location] = useLocation();

  return (
    <nav className="p-4">
      {/* Header */}
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
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md transition-fast cursor-pointer',
                    'hover:bg-surface-elevated',
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  <Icon size={20} stroke={1.5} />
                  <span className="font-medium">{item.label}</span>
                </motion.a>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Footer */}
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
    </nav>
  );
}
