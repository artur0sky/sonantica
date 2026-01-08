import { useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../components/TrackItem";
import { PlaylistStats } from "../components/PlaylistStats";
import { usePlaylistSettingsStore } from "../../../stores/playlistSettingsStore";
import {
  IconChevronLeft,
  IconPlayerPlay,
  IconTrash,
  IconEdit,
  IconMusic,
} from "@tabler/icons-react";
import {
  Button,
  CoverArt,
  DetailPageHeader,
  VirtualizedList,
  ConfirmDialog,
  PromptDialog,
} from "@sonantica/ui";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";

import { usePlaylistCRUD } from "../../../hooks/usePlaylistCRUD";
import { useDialog } from "../../../hooks/useDialog";

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getPlaylistById, tracks } = useLibraryStore();
  const trackAccess = usePlaylistSettingsStore((s) => s.trackAccess);
  const { deletePlaylist, renamePlaylist } = usePlaylistCRUD();
  const { dialogState, showConfirm, showPrompt, handleConfirm, handleCancel } =
    useDialog();

  useEffect(() => {
    if (id) trackAccess(id);
  }, [id, trackAccess]);

  const playlist = useMemo(
    () => (id ? getPlaylistById(id) : null) ?? null,
    [id, getPlaylistById]
  );

  // Get tracks for this playlist
  const playlistTracks = useMemo(() => {
    if (!playlist || !playlist.trackIds) return [];

    // Map trackIds to actual track objects, maintaining order
    return playlist.trackIds
      .map((trackId) => tracks.find((t) => t.id === trackId))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);
  }, [playlist, tracks]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <p>Playlist not found</p>
        <Button
          variant="ghost"
          onClick={() => setLocation("/playlists")}
          className="mt-4"
        >
          Back to Playlists
        </Button>
      </div>
    );
  }

  const handlePlayAll = () => {
    const tracksAsSources = playlistTracks.map(trackToMediaSource);
    playFromContext(tracksAsSources, 0);
  };

  const handleTrackClick = (index: number) => {
    const tracksAsSources = playlistTracks.map(trackToMediaSource);
    playFromContext(tracksAsSources, index);
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`,
      "danger"
    );
    if (confirmed) {
      try {
        await deletePlaylist(playlist.id);
        setLocation("/playlists");
      } catch (error) {
        console.error("Failed to delete playlist:", error);
      }
    }
  };

  const handleEdit = async () => {
    const newName = await showPrompt(
      "Rename Playlist",
      "Enter a new name for this playlist",
      playlist.name,
      "Playlist name"
    );
    if (newName && newName !== playlist.name) {
      try {
        await renamePlaylist(playlist.id, newName);
      } catch (error) {
        console.error("Failed to rename playlist:", error);
      }
    }
  };

  // Determine cover art (4-grid or single)
  const coverArts = playlist.coverArts || [];
  const hasGrid = coverArts.length >= 4;

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-32">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/playlists")}
        className="mb-8 -ml-2 text-text-muted hover:text-text animate-in fade-in slide-in-from-left-4 duration-300"
      >
        <IconChevronLeft size={20} className="mr-1" />
        Back to Playlists
      </Button>

      {/* Playlist Header */}
      <DetailPageHeader
        type={
          playlist.type === "HISTORY_SNAPSHOT" ? "Queue History" : "Playlist"
        }
        title={playlist.name}
        image={
          hasGrid ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-md overflow-hidden shadow-2xl">
              {coverArts.slice(0, 4).map((art: string, i: number) => (
                <CoverArt
                  key={i}
                  src={art}
                  alt=""
                  className="w-full h-full"
                  iconSize={24}
                />
              ))}
            </div>
          ) : (
            <CoverArt
              src={coverArts[0]}
              alt={playlist.name}
              className="w-full h-full shadow-2xl"
              iconSize={64}
            />
          )
        }
        subtitle={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {playlist.type === "SMART" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                  SMART
                </span>
              )}
              {playlist.type === "GENERATED" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
                  MIX
                </span>
              )}
            </div>
            <span>
              {playlistTracks.length} track
              {playlistTracks.length !== 1 ? "s" : ""}
            </span>
            {playlist.snapshotDate && (
              <>
                <span className="opacity-30">•</span>
                <span className="text-sm">
                  {new Date(playlist.snapshotDate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        }
        actions={
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              onClick={handlePlayAll}
              className="gap-2 px-8 h-12 text-lg flex-1 sm:flex-initial"
              disabled={playlistTracks.length === 0}
            >
              <IconPlayerPlay size={20} className="fill-current" />
              Play Playlist
            </Button>

            {playlist.type !== "HISTORY_SNAPSHOT" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  variant="secondary"
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <IconEdit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="ghost"
                  className="gap-2 text-red-400 hover:text-red-300 flex-1 sm:flex-initial"
                >
                  <IconTrash size={18} />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Content Grid: Tracks + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tracks List */}
        <div className="lg:col-span-2">
          <VirtualizedList
            items={playlistTracks}
            keyExtractor={(t: any) => t.id}
            idPrefix="track"
            renderItem={(track: any, index: number) => (
              <TrackItem
                track={track}
                onClick={() => handleTrackClick(index)}
              />
            )}
            estimateSize={56}
            showInfo={false}
            emptyState={{
              icon: <IconMusic size={40} stroke={1.5} />,
              title: "This playlist is empty",
              description: "Add tracks to this playlist to see them here.",
            }}
          />
        </div>

        {/* Playlist Statistics */}
        {playlistTracks.length > 0 && (
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
              <PlaylistStats playlistId={playlist.id} />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog for deleting playlist */}
      <ConfirmDialog
        isOpen={dialogState.isOpen && dialogState.type === "confirm"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
      />

      {/* Prompt Dialog for renaming playlist */}
      <PromptDialog
        isOpen={dialogState.isOpen && dialogState.type === "prompt"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        defaultValue={dialogState.defaultValue}
        placeholder={dialogState.placeholder}
      />
    </div>
  );
}
