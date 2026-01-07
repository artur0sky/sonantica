/**
 * Artist Card Component
 *
 * Grid item for artist view - matches AlbumCard appearance
 */

import { motion } from "framer-motion";
import { ArtistImage } from "@sonantica/ui";

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
      className="group cursor-pointer"
    >
      {/* Artist Image - Circular */}
      <div className="aspect-square mb-4 relative">
        <ArtistImage
          src={undefined} // Artists don't have images yet
          alt={artist.name}
          className="w-full h-full"
          iconSize={48}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          <div className="text-white text-sm font-medium">View Artist</div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-semibold text-base truncate mb-1 group-hover:text-accent transition-colors">
          {artist.name}
        </h3>
        <p className="text-sm text-text-muted truncate">
          {artist.albumCount || 0} albums
        </p>
      </div>
    </motion.div>
  );
}
