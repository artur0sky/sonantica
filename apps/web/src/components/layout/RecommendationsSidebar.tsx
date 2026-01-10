/**
 * Recommendations Sidebar
 *
 * Displays intelligent music suggestions based on current playback.
 * "Sound is a form of language" - recommendations help discover connections.
 * No external animation library dependencies
 */

import { useState } from "react";
import {
  SidebarContainer,
  SidebarSection,
  useUIStore,
  Button,
} from "@sonantica/ui";
import { useSmartRecommendations } from "../../hooks/useSmartRecommendations";
import { usePlaylistCRUD } from "../../hooks/usePlaylistCRUD";
import { useDialog } from "../../hooks/useDialog";
import { PromptDialog } from "@sonantica/ui";
import { RecommendationCard } from "../../features/recommendations/components/RecommendationCard";
import {
  IconMusic,
  IconDisc,
  IconMicrophone,
  IconPlaylistAdd,
} from "@tabler/icons-react";
import { useQueueStore } from "@sonantica/player-core";

import { trackToMediaSource } from "../../utils/streamingUrl";

export function RecommendationsSidebar() {
  const toggleRecommendations = useUIStore((s) => s.toggleRecommendations);
  const [diversity, setDiversity] = useState(0.2); // Ignored by AI for now, but kept for client side fallback if we pass it
  const playNext = useQueueStore((s) => s.playNext);

  // Get recommendations (Smart AI or Client Fallback)
  const { trackRecommendations, albumRecommendations, artistRecommendations } =
    useSmartRecommendations();

  const diversityOptions = [
    { value: 0.0, label: "Similar" },
    { value: 0.5, label: "Balanced" },
    { value: 1.0, label: "Diverse" },
  ];

  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();

  // Save recommendations as playlist
  const handleSaveAsPlaylist = async () => {
    // Get current diversity label
    const diversityLabel =
      diversityOptions.find((opt) => opt.value === diversity)?.label ||
      "Balanced";

    const playlistName = await showPrompt(
      "Save Discovery Mix",
      "Enter a name for this playlist",
      `${diversityLabel} Mix ${new Date().toLocaleDateString()}`,
      "Discovery Mix"
    );
    if (!playlistName) return;

    try {
      const trackIds = trackRecommendations.map((rec: any) => rec.item.id);
      console.log("[RecommendationsSidebar] Creating playlist:", {
        name: playlistName,
        diversity: diversityLabel,
        diversityValue: diversity,
        trackCount: trackIds.length,
        trackIds,
      });

      const createdPlaylist = await createPlaylist(
        playlistName,
        "GENERATED",
        trackIds
      );
      console.log(
        "[RecommendationsSidebar] Playlist created:",
        createdPlaylist
      );
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
        <SidebarSection title="Suggested Tracks" icon={<IconMusic size={12} />}>
          <div className="space-y-1">
            {trackRecommendations.map((rec: any, index: number) => (
              <div
                key={rec.item.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <RecommendationCard
                  type="track"
                  item={rec.item}
                  reasons={rec.reasons}
                  onClick={() => playNext(trackToMediaSource(rec.item))}
                />
              </div>
            ))}
            {trackRecommendations.length === 0 && (
              <p className="text-xs text-text-muted py-4 text-center">
                Play something to start discovering.
              </p>
            )}
          </div>
        </SidebarSection>

        {/* Albums Section */}
        {albumRecommendations.length > 0 && (
          <SidebarSection title="Related Albums" icon={<IconDisc size={12} />}>
            <div className="grid grid-cols-2 gap-3">
              {albumRecommendations.map((rec: any) => (
                <RecommendationCard
                  key={rec.item.id}
                  type="album"
                  item={rec.item}
                />
              ))}
            </div>
          </SidebarSection>
        )}

        {/* Artists Section */}
        {artistRecommendations.length > 0 && (
          <SidebarSection
            title="Similar Artists"
            icon={<IconMicrophone size={12} />}
          >
            <div className="space-y-2">
              {artistRecommendations.map((rec: any) => (
                <RecommendationCard
                  key={rec.item.id}
                  type="artist"
                  item={rec.item}
                  score={rec.score}
                />
              ))}
            </div>
          </SidebarSection>
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
