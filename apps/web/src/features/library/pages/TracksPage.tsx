/**
 * Tracks Page
 * 
 * Main library view showing all tracks.
 * Default landing page.
 */

import { Button } from '../../../shared/components/atoms';
import { SearchBar } from '../../../shared/components/molecules';
import { useLibraryStore } from '../../../shared/store/libraryStore';
import { TrackItem } from '../components/TrackItem';
import { IconRefresh, IconMusic, IconSearch, IconPlayerPlay, IconArrowsShuffle } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playFromContext, playAll, playAllShuffled } from '../../../shared/utils/playContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export function TracksPage() {
  const {
    stats,
    scanning,
    scanProgress,
    searchQuery,
    scan,
    setSearchQuery,
    getFilteredTracks,
  } = useLibraryStore();

  const filteredTracks = getFilteredTracks();

  const handleScan = async () => {
    try {
      await scan(['/media/']);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  const handleTrackClick = async (_track: any, index: number) => {
    try {
      // Convert tracks to MediaSource format
      const mediaSources = filteredTracks.map(t => ({
        id: t.id,
        url: t.path,
        mimeType: t.mimeType,
        metadata: t.metadata,
      }));

      // Play from context with all tracks, starting at clicked track
      await playFromContext(mediaSources, index);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const handlePlayAll = async () => {
    try {
      const mediaSources = filteredTracks.map(t => ({
        id: t.id,
        url: t.path,
        mimeType: t.mimeType,
        metadata: t.metadata,
      }));
      await playAll(mediaSources);
    } catch (error) {
      console.error('Failed to play all:', error);
    }
  };

  const handleShuffle = async () => {
    try {
      const mediaSources = filteredTracks.map(t => ({
        id: t.id,
        url: t.path,
        mimeType: t.mimeType,
        metadata: t.metadata,
      }));
      await playAllShuffled(mediaSources);
    } catch (error) {
      console.error('Failed to shuffle:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tracks</h1>
            <AnimatePresence>
              {stats.totalTracks > 0 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-text-muted mt-1"
                >
                  {stats.totalTracks} track{stats.totalTracks !== 1 ? 's' : ''} in library
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {/* Play All Button */}
            {filteredTracks.length > 0 && (
              <>
                <Button
                  onClick={handlePlayAll}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <IconPlayerPlay size={18} />
                  Play All
                </Button>

                <Button
                  onClick={handleShuffle}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <IconArrowsShuffle size={18} />
                  Shuffle
                </Button>
              </>
            )}

            <Button
              onClick={handleScan}
              disabled={scanning}
              variant="primary"
              className="flex items-center gap-2"
            >
              <motion.div
                animate={scanning ? { rotate: 360 } : { rotate: 0 }}
                transition={scanning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <IconRefresh size={18} />
              </motion.div>
              {scanning ? `Scanning... (${scanProgress})` : 'Scan Library'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tracks, artists, albums..."
        />
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {stats.totalTracks === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-24 bg-surface/50 border border-border/50 rounded-2xl border-dashed"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center p-6 bg-surface-elevated rounded-full mb-6 text-accent"
            >
              <IconMusic size={48} stroke={1.5} />
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">No music found</h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Your library is empty. Click "Scan Library" to index your music files from the media folder.
            </p>
            <Button onClick={handleScan} variant="primary" disabled={scanning}>
              {scanning ? 'Scanning...' : 'Scan Library'}
            </Button>
          </motion.div>
        ) : filteredTracks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconSearch size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">
              No tracks found matching "{searchQuery}"
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {filteredTracks.map((track: any, index: number) => (
              <TrackItem
                key={track.id}
                track={track}
                onClick={() => handleTrackClick(track, index)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
