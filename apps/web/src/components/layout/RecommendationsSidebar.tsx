/**
 * Recommendations Sidebar
 *
 * Displays intelligent music suggestions based on current playback.
 * "Sound is a form of language" - recommendations help discover connections.
 */

import { useState } from "react";
import { SidebarContainer, useUIStore, Button, CoverArt } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useQueueRecommendations } from "@sonantica/recommendations";
import { usePlaylistCRUD } from "../../hooks/usePlaylistCRUD";
import { useDialog } from "../../hooks/useDialog";
import { PromptDialog } from "@sonantica/ui";
import { TrackItem } from "../../features/library/components/TrackItem";
import {
  IconMusic,
  IconDisc,
  IconMicrophone,
  IconPlayerPlay,
  IconPlaylistAdd,
} from "@tabler/icons-react";
import { useQueueStore } from "@sonantica/player-core";
import { AnimatePresence, motion } from "framer-motion";

import { trackToMediaSource } from "../../utils/streamingUrl";

export function RecommendationsSidebar() {
  const toggleRecommendations = useUIStore((s) => s.toggleRecommendations);
  const [diversity, setDiversity] = useState(0.2);
  const playNext = useQueueStore((s) => s.playNext);

  // Get recommendations based on selected diversity
  const { trackRecommendations, albumRecommendations, artistRecommendations } =
    useQueueRecommendations({
      limit: 10,
      minScore: 0.3,
      diversity,
    });

  const diversityOptions = [
    { value: 0.0, label: "Similar" },
    { value: 0.5, label: "Balanced" },
    { value: 1.0, label: "Diverse" },
  ];

  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();

  // Save recommendations as playlist
  const handleSaveAsPlaylist = async () => {
    const playlistName = await showPrompt(
      "Save Discovery Mix",
      "Enter a name for this playlist",
      `Discovery Mix ${new Date().toLocaleDateString()}`,
      "Discovery Mix"
    );
    if (!playlistName) return;

    try {
      const trackIds = trackRecommendations.map((rec: any) => rec.item.id);
      await createPlaylist(playlistName, "GENERATED", trackIds);
    } catch (error) {
      console.error("Failed to save playlist:", error);
    }
  };

  return (
    <SidebarContainer
      title="Discovery"
      onClose={toggleRecommendations}
      headerActions={
        <div className="flex gap-1">
          {trackRecommendations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAsPlaylist}
              className="p-2"
              title="Save as Playlist"
            >
              <IconPlaylistAdd size={16} stroke={1.5} />
            </Button>
          )}
          {diversityOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={diversity === opt.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDiversity(opt.value)}
              className="text-[10px] px-2 h-6"
              title={`Diversity: ${opt.label}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-y-auto px-1 pb-20">
        {/* Intro */}
        <div className="mb-6 px-1">
          <p className="text-xs text-text-muted italic opacity-70">
            "We don't predict. We interpret."
          </p>
        </div>

        {/* Tracks Section */}
        <div className="mb-8">
          <h3 className="text-[10px] text-text-muted/70 font-bold mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
            <IconMusic size={12} /> Suggested Tracks
          </h3>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {trackRecommendations.map((rec: any) => (
                <motion.div
                  key={rec.item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <div className="relative group">
                    <TrackItem
                      track={rec.item}
                      onClick={() => playNext(trackToMediaSource(rec.item))}
                    />
                    {/* Reason badge */}
                    {rec.reasons.length > 0 && (
                      <div className="absolute top-1 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] bg-surface-elevated/90 backdrop-blur px-1.5 py-0.5 rounded border border-border/50 text-text-muted">
                          {rec.reasons[0].description}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {trackRecommendations.length === 0 && (
              <p className="text-xs text-text-muted py-4 text-center">
                Play something to start discovering.
              </p>
            )}
          </div>
        </div>

        {/* Albums Section */}
        {albumRecommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] text-text-muted/70 font-bold mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
              <IconDisc size={12} /> Related Albums
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {albumRecommendations.map((rec: any) => (
                // Using a simplified view or existing card
                <div
                  key={rec.item.id}
                  className="p-2 hover:bg-surface-elevated transition-colors cursor-pointer group"
                >
                  <div className="aspect-square overflow-hidden mb-2 relative">
                    <CoverArt
                      src={
                        rec.item.coverArt ||
                        useLibraryStore
                          .getState()
                          .albums.find((a: any) => a.id === rec.item.id)
                          ?.coverArt
                      }
                      alt={rec.item.title}
                      className="w-full h-full"
                      iconSize={24}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <IconPlayerPlay
                        className="text-white drop-shadow-md"
                        size={24}
                      />
                    </div>
                  </div>
                  <h4 className="text-xs font-medium truncate">
                    {rec.item.title}
                  </h4>
                  <p className="text-[10px] text-text-muted truncate">
                    {rec.item.artist}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artists Section */}
        {artistRecommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] text-text-muted/70 font-bold mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
              <IconMicrophone size={12} /> Similar Artists
            </h3>
            <div className="space-y-2">
              {artistRecommendations.map((rec: any) => (
                <div
                  key={rec.item.id}
                  className="flex items-center gap-3 p-2 hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden">
                    <IconMicrophone size={16} className="text-text-muted/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">
                      {rec.item.name}
                    </h4>
                    <p className="text-[10px] text-text-muted">
                      {rec.item.albumCount || 0} albums
                    </p>
                  </div>
                  <div className="text-[9px] text-text-muted/50">
                    {Math.round(rec.score * 100)}% match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prompt Dialog for saving recommendations as playlist */}
      <PromptDialog
        isOpen={dialogState.isOpen && dialogState.type === "prompt"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        defaultValue={dialogState.defaultValue}
        placeholder={dialogState.placeholder}
      />
    </SidebarContainer>
  );
}
