/**
 * Album Detail Page
 *
 * Displays tracks belonging to a specific album.
 * No external animation library dependencies
 */

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
import {
  IconChevronLeft,
  IconPlayerPlay,
  IconMusic,
} from "@tabler/icons-react";
import {
  Button,
  CoverArt,
  DetailPageHeader,
  VirtualizedGrid,
  VirtualizedList,
} from "@sonantica/ui";
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
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/albums")}
        className="mb-8 -ml-2 text-text-muted hover:text-text animate-in fade-in slide-in-from-left-4 duration-300"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Albums
      </Button>

      {/* Album Header */}
      <DetailPageHeader
        type="Album"
        title={album.title}
        image={
          <CoverArt
            src={album.coverArt}
            alt={album.title}
            className="w-full h-full shadow-2xl"
            iconSize={64}
            priority={true}
          />
        }
        subtitle={
          <>
            <span
              className="font-medium text-text hover:text-accent cursor-pointer transition-colors"
              onClick={() => {
                // Find artist by name
                const artists = useLibraryStore.getState().artists;
                const artistFound = artists.find(
                  (a) => a.name === album.artist
                );
                if (artistFound) {
                  setLocation(`/artist/${artistFound.id}`);
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
          </>
        }
        actions={
          <Button onClick={handlePlayAll} className="gap-2 px-8 h-12 text-lg">
            <IconPlayerPlay size={20} className="fill-current" />
            Play Album
          </Button>
        }
      />

      {/* Tracks List */}
      <VirtualizedList
        items={albumTracks}
        keyExtractor={(t: any) => t.id}
        idPrefix="track"
        renderItem={(track: any, index: number) => (
          <TrackItem track={track} onClick={() => handleTrackClick(index)} />
        )}
        estimateSize={56}
        showInfo={false}
        emptyState={{
          icon: <IconMusic size={40} stroke={1.5} />,
          title: "No tracks found",
          description: "This album has no tracks in your library.",
        }}
      />

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
          <VirtualizedGrid
            items={similarArtistsItems(similarAlbums)}
            keyExtractor={(item: any) => item.id}
            idPrefix="similar"
            renderItem={(recAlbum: any) => (
              <AlbumCard
                album={recAlbum}
                onClick={() => setLocation(`/album/${recAlbum.id}`)}
              />
            )}
            emptyState={{
              icon: <IconMusic size={40} stroke={1.5} />,
              title: "No similar albums",
              description: "",
            }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
          />
        </div>
      )}
    </div>
  );
}

// Helper to extract items from recommendations
function similarArtistsItems(recs: any[]) {
  return recs.map((r) => r.item);
}
