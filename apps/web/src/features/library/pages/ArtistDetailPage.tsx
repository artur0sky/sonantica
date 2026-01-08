/**
 * Artist Detail Page
 *
 * Displays albums belonging to a specific artist.
 * No external animation library dependencies
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { IconChevronLeft, IconMusic } from "@tabler/icons-react";
import {
  Button,
  ArtistImage,
  DetailPageHeader,
  VirtualizedGrid,
} from "@sonantica/ui";
import { useArtistSimilarArtists } from "@sonantica/recommendations";
import { ArtistCard } from "../components/ArtistCard";
import { AlbumCard } from "../components/AlbumCard";
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
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/artists")}
        className="mb-8 -ml-2 text-text-muted hover:text-text animate-in fade-in slide-in-from-left-4 duration-300"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Artists
      </Button>

      {/* Artist Header */}
      <DetailPageHeader
        type="Artist"
        title={artist.name}
        image={
          <ArtistImage
            src={artistAlbums[0]?.coverArt}
            alt={artist.name}
            className="w-full h-full shadow-xl"
            iconSize={64}
          />
        }
        subtitle={
          <>
            <span>
              {artistAlbums.length} album
              {artistAlbums.length !== 1 ? "s" : ""}
            </span>
            <span className="opacity-30">•</span>
            <span>
              {artistTrackCount} track
              {artistTrackCount !== 1 ? "s" : ""}
            </span>
          </>
        }
      />

      {/* Albums Section */}
      <h2 className="text-2xl font-bold mb-6">Albums</h2>
      <VirtualizedGrid
        items={artistAlbums}
        keyExtractor={(album: any) => album.id}
        idPrefix="album"
        renderItem={(album: any) => (
          <AlbumCard
            album={album}
            onClick={() => setLocation(`/album/${album.id}`)}
          />
        )}
        emptyState={{
          icon: <IconMusic size={40} stroke={1.5} />,
          title: "No albums found",
          description: "This artist has no albums in your library.",
        }}
      />

      {/* Analytics Section */}
      <ArtistAnalyticsSection artistName={artist.name} artistId={artist.id} />

      {/* Similar Artists Section */}
      {similarArtists.length > 0 && (
        <div className="mt-12 pt-12 border-t border-border">
          <h2 className="text-xl font-bold mb-6 text-text-muted">
            Similar Artists
          </h2>
          <VirtualizedGrid
            items={similarArtists.map((rec) => rec.item)}
            keyExtractor={(item: any) => item.id}
            idPrefix="similar"
            renderItem={(recArtist: any) => (
              <ArtistCard
                artist={recArtist}
                onClick={() => setLocation(`/artist/${recArtist.id}`)}
              />
            )}
            emptyState={{
              icon: <IconMusic size={40} stroke={1.5} />,
              title: "No similar artists",
              description: "Couldn't find any similar artists.",
            }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
          />
        </div>
      )}
    </div>
  );
}
