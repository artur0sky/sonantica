/**
 * Album Card Component
 * 
 * Grid item for album view
 */

import { IconDisc } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface AlbumCardProps {
  album: any;
  onClick: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer p-4 bg-surface hover:bg-surface-elevated rounded-xl transition-colors border border-transparent hover:border-border"
    >
      {/* Album Art */}
      <div className="aspect-square bg-surface-elevated rounded-lg mb-4 flex items-center justify-center shadow-lg relative overflow-hidden">
        {album.coverArt ? (
          <img src={album.coverArt} alt={album.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-text-muted/20 group-hover:text-accent/50 transition-colors">
            <IconDisc size={64} stroke={1} />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="text-center group-hover:text-left transition-all">
        <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-accent transition-colors">
          {album.name}
        </h3>
        <p className="text-sm text-text-muted truncate">
          {album.artist}
        </p>
        <p className="text-xs text-text-muted/60 mt-2 font-mono">
          {album.year || 'Unknown Year'} • {album.tracks?.length || 0} tracks
        </p>
      </div>
    </motion.div>
  );
}
