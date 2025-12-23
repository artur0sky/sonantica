/**
 * Artists Page
 * 
 * Browse library by artists.
 */

import { SearchBar } from '../../../shared/components/molecules';
import { useLibraryStore } from '../../../shared/store/libraryStore';
import { ArtistCard } from '../components/ArtistCard';
import { IconMicrophone, IconSearch } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function ArtistsPage() {
  const {
    stats,
    searchQuery,
    setSearchQuery,
    selectArtist,
    getFilteredArtists,
  } = useLibraryStore();

  const filteredArtists = getFilteredArtists();

  const handleArtistClick = (artist: any) => {
    selectArtist(artist);
    // TODO: Navigate to artist detail view or show albums
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Artists</h1>
        {stats.totalArtists > 0 && (
          <p className="text-sm text-text-muted mb-6">
            {stats.totalArtists} artist{stats.totalArtists !== 1 ? 's' : ''} in library
          </p>
        )}

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search artists..."
        />
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredArtists.length === 0 ? (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-center py-20"
           >
             {searchQuery ? (
                <>
                  <IconSearch size={48} className="mx-auto text-text-muted/30 mb-4" />
                  <p className="text-text-muted">No artists found matching "{searchQuery}"</p>
                </>
             ) : (
                <>
                  <IconMicrophone size={48} className="mx-auto text-text-muted/30 mb-4" />
                  <p className="text-text-muted">No artists in library</p>
                </>
             )}
           </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {filteredArtists.map((artist: any) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => handleArtistClick(artist)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
