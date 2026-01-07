/**
 * Album Detail Page
 *
 * Displays tracks belonging to a specific album.
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
import { IconChevronLeft, IconPlayerPlay } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button, CoverArt } from "@sonantica/ui";
import { useAlbumSimilarAlbums } from "@sonantica/recommendations";
import { AlbumCard } from "../components/AlbumCard";
import { AlbumAnalyticsSection } from "../../analytics/components/AlbumAnalyticsSection";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getAlbumById, tracks } = useLibraryStore();

  const album = useMemo(
    () => (id ? getAlbumById(id) : null) ?? null,
    [id, getAlbumById]
  );

  // Get tracks for this album
  const albumTracks = useMemo(
    () =>
      album
        ? tracks.filter(
            (t) => t.album === album.title && t.artist === album.artist
          )
        : [],
    [album, tracks]
  );

  // Get similar albums with a balanced diversity score
  const similarAlbums = useAlbumSimilarAlbums(album, {
    limit: 6,
    minScore: 0.3,
  });

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
    const tracksAsSources = albumTracks.map(trackToMediaSource);
    playFromContext(tracksAsSources, 0);
  };

  const handleTrackClick = (index: number) => {
    const tracksAsSources = albumTracks.map(trackToMediaSource);
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
          className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0"
        >
          <CoverArt
            src={album.coverArt}
            alt={album.title}
            className="w-full h-full shadow-2xl"
            iconSize={64}
          />
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
              {album.title}
            </h1>
            <div className="flex items-center gap-3 text-lg text-text-muted">
              <span
                className="font-medium text-text hover:text-accent cursor-pointer transition-colors"
                onClick={() => {
                  // Find artist by name
                  const artists = useLibraryStore.getState().artists;
                  const artist = artists.find((a) => a.name === album.artist);
                  if (artist) {
                    setLocation(`/artist/${artist.id}`);
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
                {albumTracks.length} track
                {albumTracks.length !== 1 ? "s" : ""}
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
        {albumTracks.map((track, index) => (
          <TrackItem
            key={track.id}
            track={track}
            onClick={() => handleTrackClick(index)}
          />
        ))}
      </div>

      {/* Analytics Section */}
      <AlbumAnalyticsSection
        albumTitle={album.title}
        artistName={album.artist}
        albumId={album.id}
      />

      {/* Similar Albums Section */}
      {similarAlbums.length > 0 && (
        <div className="mt-16 pt-12 border-t border-border">
          <h2 className="text-xl font-bold mb-6 text-text-muted">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {similarAlbums.map((rec: any) => (
              <AlbumCard
                key={rec.item.id}
                album={rec.item}
                onClick={() => setLocation(`/album/${rec.item.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
