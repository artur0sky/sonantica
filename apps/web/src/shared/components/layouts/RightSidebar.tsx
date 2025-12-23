/**
 * Right Sidebar - Queue
 * 
 * Playback queue management.
 * Shows current track and upcoming tracks.
 */

import { IconX, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../atoms';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function RightSidebar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { toggleQueue } = useUIStore();

  // TODO: Implement queue store
  const queue: any[] = [];

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Queue</h2>
        <motion.button
          onClick={toggleQueue}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-fast"
          aria-label="Close queue"
        >
          <IconX size={20} stroke={1.5} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Now Playing */}
        <AnimatePresence mode="wait">
          {currentTrack && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6"
            >
              <h3 className="text-sm text-text-muted mb-3 uppercase tracking-wide">
                Now Playing
              </h3>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-surface-elevated p-4 rounded-md border border-accent"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 bg-surface rounded flex items-center justify-center flex-shrink-0"
                  >
                    <IconPlayerPlay size={24} stroke={1.5} className="text-accent" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {currentTrack.metadata?.title || 'Unknown Title'}
                    </div>
                    <div className="text-sm text-text-muted truncate">
                      {currentTrack.metadata?.artist || 'Unknown Artist'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-text-muted uppercase tracking-wide">
              Next Up
            </h3>
            {queue.length > 0 && (
              <Button variant="ghost" size="sm">
                <IconTrash size={16} stroke={1.5} />
                <span className="ml-1">Clear</span>
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {queue.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <p className="text-text-muted text-sm">
                  No tracks in queue
                </p>
                <p className="text-text-muted text-xs mt-2">
                  Tracks will appear here when you play them
                </p>
              </motion.div>
            ) : (
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {queue.map((track: any, index: number) => (
                  <motion.li
                    key={track.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="flex items-center gap-3 p-3 rounded-md transition-fast cursor-pointer"
                  >
                    <span className="text-text-muted text-sm w-6">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {track.metadata?.title}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {track.metadata?.artist}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
