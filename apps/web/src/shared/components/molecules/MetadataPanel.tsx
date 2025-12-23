/**
 * Metadata Panel
 * 
 * Detailed view of track information.
 */

import { motion } from 'framer-motion';
import type { MediaMetadata } from '@sonantica/shared';
import { IconMusic, IconX } from '@tabler/icons-react';

interface MetadataPanelProps {
  metadata: MediaMetadata;
  onClose: () => void;
}

export function MetadataPanel({ metadata, onClose }: MetadataPanelProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed right-0 top-0 h-full w-80 md:w-96 bg-surface border-l border-border shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Track Details</h2>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Artwork */}
        <div className="aspect-square bg-surface-elevated rounded-lg mb-6 flex items-center justify-center border border-border overflow-hidden">
          {metadata.coverArt ? (
            <img src={metadata.coverArt} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <IconMusic size={64} className="text-text-muted/20" />
          )}
        </div>

        {/* Fields */}
        <dl className="space-y-4">
          <div>
            <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Title</dt>
            <dd className="font-medium text-lg">{metadata.title || 'Unknown'}</dd>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Artist</dt>
              <dd className="font-medium">{metadata.artist || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Album</dt>
              <dd className="font-medium">{metadata.album || 'Unknown'}</dd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Year</dt>
              <dd className="font-mono">{metadata.year || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Track</dt>
              <dd className="font-mono">{metadata.trackNumber || '-'}</dd>
            </div>
          </div>

          <div>
            <dt className="text-xs text-text-muted uppercase tracking-wide mb-1">Genre</dt>
            <dd>{metadata.genre || '-'}</dd>
          </div>
        </dl>
      </div>
    </motion.div>
  );
}
