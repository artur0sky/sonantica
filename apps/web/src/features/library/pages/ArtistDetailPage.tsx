/**
 * Artist Detail Page
 *
 * Displays albums belonging to a specific artist.
 * No external animation library dependencies
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { AlbumCard } from "../components/AlbumCard";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button, ArtistImage } from "@sonantica/ui";
import { useArtistSimilarArtists } from "@sonantica/recommendations";
import { ArtistCard } from "../components/ArtistCard";
import { ArtistAnalyticsSection } from "../../analytics/components/ArtistAnalyticsSection";

export function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getArtistById, albums, tracks } = useLibraryStore();

  const artist = useMemo(
    () => (id ? getArtistById(id) : null) ?? null,
    [id, getArtistById]
  );

  // Get albums for this artist from library
  const artistAlbums = useMemo(
    () => (artist ? albums.filter((a) => a.artist === artist.name) : []),
    [artist, albums]
  );

  // Calculate actual track count from library
  const artistTrackCount = useMemo(
    () => (artist ? tracks.filter((t) => t.artist === artist.name).length : 0),
    [artist, tracks]
  );

  // Get similar artists
  const similarArtists = useArtistSimilarArtists(artist, {
    limit: 5,
    minScore: 0.2, // Lower threshold to ensure we get results
  });

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
        <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 animate-in fade-in zoom-in-95 duration-500">
          <ArtistImage
            src={artistAlbums[0]?.coverArt}
            alt={artist.name}
            className="w-full h-full shadow-xl"
            iconSize={64}
          />
        </div>

        <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
          <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2 block">
            Artist
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight">
            {artist.name}
          </h1>
          <p className="text-lg text-text-muted">
            {artistAlbums.length} album
            {artistAlbums.length !== 1 ? "s" : ""} • {artistTrackCount} track
            {artistTrackCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Albums Section */}
      <h2 className="text-2xl font-bold mb-6">Albums</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {artistAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => setLocation(`/album/${album.id}`)}
          />
        ))}
      </div>

      {/* Analytics Section */}
      <ArtistAnalyticsSection artistName={artist.name} artistId={artist.id} />

      {/* Similar Artists Section */}
      {similarArtists.length > 0 && (
        <div className="mt-12 pt-12 border-t border-border">
          <h2 className="text-xl font-bold mb-6 text-text-muted">
            Similar Artists
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {similarArtists.map((rec) => (
              <ArtistCard
                key={rec.item.id}
                artist={rec.item}
                onClick={() => setLocation(`/artist/${rec.item.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
