import { useState } from "react";
import {
  SidebarContainer,
  SidebarSection,
  useUIStore,
  Button,
  cn,
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
import { type SimilarityWeights } from "@sonantica/recommendations";
import { trackToMediaSource } from "../../utils/streamingUrl";

export function RecommendationsSidebar() {
  const toggleRecommendations = useUIStore((s) => s.toggleRecommendations);
  const [diversity, setDiversity] = useState(0.2);
  const playNext = useQueueStore((s) => s.playNext);

  const [weights, setWeights] = useState<SimilarityWeights>({
    audio: 1.0,
    lyrics: 0.0,
    visual: 0.0,
    stems: 0.0,
  });
  const [activeMode, setActiveMode] = useState("balanced");

  // Get recommendations (Smart AI or Client Fallback)
  const {
    trackRecommendations,
    albumRecommendations,
    artistRecommendations,
    isAI,
    isLoading,
  } = useSmartRecommendations({ diversity, weights });

  const diversityOptions = [
    { value: 0.0, label: "Similar" },
    { value: 0.5, label: "Balanced" },
    { value: 1.0, label: "Diverse" },
  ];

  const discoveryModes = [
    {
      id: "balanced",
      label: "Balanced",
      weights: {
        audio: 1.0,
        lyrics: 0.0,
        visual: 0.0,
        stems: 0.0,
      } as SimilarityWeights,
    },
    {
      id: "lyrics",
      label: "Lyrical",
      weights: {
        audio: 0.3,
        lyrics: 1.0,
        visual: 0.1,
        stems: 0.0,
      } as SimilarityWeights,
    },
    {
      id: "vibe",
      label: "Vibe",
      weights: {
        audio: 0.4,
        lyrics: 0.0,
        visual: 1.0,
        stems: 0.0,
      } as SimilarityWeights,
    },
    {
      id: "groove",
      label: "Groove",
      weights: {
        audio: 0.5,
        lyrics: 0.0,
        visual: 0.0,
        stems: 1.0,
      } as SimilarityWeights,
    },
  ];

  const handleModeChange = (modeId: string) => {
    const mode = discoveryModes.find((m) => m.id === modeId);
    if (mode) {
      setActiveMode(modeId);
      setWeights(mode.weights);
    }
  };

  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();

  const handleSaveAsPlaylist = async () => {
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
        <div className="flex gap-1 items-center">
          {isAI && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[9px] text-primary border border-primary/20 mr-1"
              title="Powered by Sonántica Brain"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Brain
            </div>
          )}

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
      <div
        className={cn(
          "flex flex-col h-full overflow-y-auto overflow-x-hidden px-1 pb-20 transition-opacity duration-200",
          isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
        }}
      >
        <div className="mb-4 px-1">
          <p className="text-xs text-text-muted italic opacity-70">
            "We don't predict. We interpret."
          </p>
        </div>

        <div className="px-1 mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {discoveryModes.map((mode) => (
            <Button
              key={mode.id}
              variant={activeMode === mode.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleModeChange(mode.id)}
              className="text-[10px] px-3 h-7 whitespace-nowrap border border-transparent hover:border-border-hover"
            >
              {mode.label}
            </Button>
          ))}
        </div>

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
