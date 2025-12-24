/**
 * Album Detail Page
 *
 * Displays tracks belonging to a specific album.
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore, type Track } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
import {
  IconChevronLeft,
  IconPlayerPlay,
  IconMusic,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button } from "@sonantica/ui";
import { playFromContext } from "../../../utils/playContext";

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getAlbumById } = useLibraryStore();

  const album = useMemo(
    () => (id ? getAlbumById(id) : null),
    [id, getAlbumById]
  );

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <p>Album not found</p>
        <Button
          variant="ghost"
          onClick={() => setLocation("/albums")}
          className="mt-4"
        >
          Back to Albums
        </Button>
      </div>
    );
  }

  const handlePlayAll = () => {
    const tracksAsSources = album.tracks.map((t: Track) => ({
      ...t,
      url: t.path,
    }));
    playFromContext(tracksAsSources, 0);
  };

  const handleTrackClick = (index: number) => {
    const tracksAsSources = album.tracks.map((t: Track) => ({
      ...t,
      url: t.path,
    }));
    playFromContext(tracksAsSources, index);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/albums")}
        className="mb-8 -ml-2 text-text-muted hover:text-text"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Albums
      </Button>

      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-xl overflow-hidden bg-surface-elevated shadow-2xl border border-border"
        >
          {album.coverArt ? (
            <img
              src={album.coverArt}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-elevated">
              <IconMusic size={64} className="text-text-muted/20" stroke={1} />
            </div>
          )}
        </motion.div>

        <div className="flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2 block">
              Album
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              {album.name}
            </h1>
            <div className="flex items-center gap-3 text-lg text-text-muted">
              <span
                className="font-medium text-text hover:text-accent cursor-pointer transition-colors"
                onClick={() => {
                  if (album.artistId) {
                    setLocation(`/artist/${album.artistId}`);
                  } else {
                    // Fallback to searching by name if ID is missing
                    setLocation(`/tracks?query=${album.artist}`);
                  }
                }}
              >
                {album.artist}
              </span>
              {album.year && (
                <>
                  <span className="opacity-30">•</span>
                  <span>{album.year}</span>
                </>
              )}
              <span className="opacity-30">•</span>
              <span>
                {album.tracks.length} track
                {album.tracks.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                onClick={handlePlayAll}
                className="gap-2 px-8 h-12 text-lg"
              >
                <IconPlayerPlay size={20} className="fill-current" />
                Play Album
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-1">
        {album.tracks.map((track, index) => (
          <TrackItem
            key={track.id}
            track={track}
            onClick={() => handleTrackClick(index)}
          />
        ))}
      </div>
    </div>
  );
}
