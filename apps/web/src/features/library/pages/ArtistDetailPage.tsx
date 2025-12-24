/**
 * Artist Detail Page
 *
 * Displays albums belonging to a specific artist.
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import { IconChevronLeft, IconUser } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button } from "@sonantica/ui";

export function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getArtistById } = useLibraryStore();

  const artist = useMemo(
    () => (id ? getArtistById(id) : null),
    [id, getArtistById]
  );

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <p>Artist not found</p>
        <Button
          variant="ghost"
          onClick={() => setLocation("/artists")}
          className="mt-4"
        >
          Back to Artists
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/artists")}
        className="mb-8 -ml-2 text-text-muted hover:text-text"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Artists
      </Button>

      {/* Artist Header */}
      <div className="flex items-center gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-full overflow-hidden bg-surface-elevated shadow-xl border border-border flex items-center justify-center"
        >
          {/* Artists usually don't have images yet in our system, so use an icon or the first album art */}
          {artist.albums[0]?.coverArt ? (
            <div className="relative w-full h-full">
              <img
                src={artist.albums[0].coverArt}
                alt={artist.name}
                className="w-full h-full object-cover blur-sm opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <IconUser size={64} className="text-white" stroke={1.5} />
              </div>
            </div>
          ) : (
            <IconUser size={64} className="text-text-muted/20" stroke={1.5} />
          )}
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2 block">
              Artist
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight">
              {artist.name}
            </h1>
            <p className="text-lg text-text-muted">
              {artist.albums.length} album
              {artist.albums.length !== 1 ? "s" : ""} • {artist.trackCount}{" "}
              track{artist.trackCount !== 1 ? "s" : ""}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Albums Section */}
      <h2 className="text-2xl font-bold mb-6">Albums</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {artist.albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => setLocation(`/album/${album.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
