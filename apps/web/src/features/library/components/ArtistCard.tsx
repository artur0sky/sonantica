/**
 * Artist Card Component
 * 
 * Grid item for artist view
 */

import { IconMicrophone } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface ArtistCardProps {
  artist: any;
  onClick: () => void;
}

export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer p-4 bg-surface hover:bg-surface-elevated rounded-xl transition-colors border border-transparent hover:border-border text-center"
    >
      {/* Artist Avatar */}
      <div className="aspect-square bg-surface-elevated rounded-full mb-4 flex items-center justify-center shadow-lg relative overflow-hidden mx-auto w-40 max-w-full">
        <div className="text-text-muted/20 group-hover:text-accent/50 transition-colors">
          <IconMicrophone size={48} stroke={1.5} />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-accent transition-colors">
          {artist.name}
        </h3>
        <p className="text-sm text-text-muted truncate mb-2">
          {artist.albums?.length || 0} albums • {artist.trackCount || 0} tracks
        </p>
      </div>
    </motion.div>
  );
}
