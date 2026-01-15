import { useState } from "react";
import {
  IconSparkles,
  IconUser,
  IconDisc,
  IconWaveSquare,
  IconMessageHeart,
  IconAdjustmentsHorizontal,
  IconBrain,
  IconChartInfographic,
} from "@tabler/icons-react";
import { Badge, Button, TrackItem, CoverArt } from "@sonantica/ui";
import { useSmartRecommendations } from "../../../hooks/useSmartRecommendations";
import { useQueueStore } from "@sonantica/player-core";
import { type SimilarityWeights } from "@sonantica/recommendations";
import { playFromContext } from "../../../utils/playContext";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";

export function RecommendationsPage() {
  useDocumentTitle("Smart Recommendations");
  const [activeTab, setActiveTab] = useState<"tracks" | "albums" | "artists">(
    "tracks"
  );
  const [diversity, setDiversity] = useState(0.2);

  // Advanced Weights State
  const [weights, setWeights] = useState<SimilarityWeights>({
    artist: 0.35,
    album: 0.2,
    genre: 0.25,
    audio: 0.5,
    lyrics: 0.3,
    stems: 0.2,
  } as SimilarityWeights);

  const currentMediaSource = useQueueStore((s) => s.queue[s.currentIndex]);

  const {
    trackRecommendations,
    albumRecommendations,
    artistRecommendations,
    isAI,
    isLoading,
  } = useSmartRecommendations({ diversity, weights });

  const tabs = [
    { id: "tracks", label: "Tracks", icon: IconSparkles },
    { id: "albums", label: "Albums", icon: IconDisc },
    { id: "artists", label: "Artists", icon: IconUser },
  ] as const;

  const handlePlayTrack = async (track: any) => {
    try {
      const ms = trackToMediaSource(track);
      await playFromContext([ms], 0);
    } catch (err) {
      console.error("Failed to play recommended track", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <IconSparkles className="text-accent" size={32} />
            Smart Recommendations
          </h1>
          <p className="text-text-muted">
            {currentMediaSource
              ? `Based on your listening history`
              : "Start playing something to see recommendations"}
          </p>
        </div>

        {isAI && (
          <Badge
            variant="accent"
            className="px-4 py-2 text-sm flex items-center gap-2"
          >
            <IconBrain size={16} />
            AI Powered by Sonántica Brain
          </Badge>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="p-6 space-y-6 bg-surface-elevated/30 rounded-2xl border border-border/20">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <IconAdjustmentsHorizontal size={16} /> Influence
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Discovery / Diversity</span>
                  <span className="font-bold text-accent">
                    {Math.round(diversity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={diversity}
                  onChange={(e) => setDiversity(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
                AI Matching
              </h3>

              <div className="space-y-4">
                <WeightSlider
                  label="Audio Similarity"
                  icon={IconWaveSquare}
                  value={weights.audio || 0}
                  onChange={(v) =>
                    setWeights((prev) => ({ ...prev, audio: v }))
                  }
                />
                <WeightSlider
                  label="Lyrics / Message"
                  icon={IconMessageHeart}
                  value={weights.lyrics || 0}
                  onChange={(v) =>
                    setWeights((prev) => ({ ...prev, lyrics: v }))
                  }
                />
                <WeightSlider
                  label="Stem Profile"
                  icon={IconChartInfographic}
                  value={weights.stems || 0}
                  onChange={(v) =>
                    setWeights((prev) => ({ ...prev, stems: v }))
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
                Metadata
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className={weights.artist ? "border-accent text-accent" : ""}
                  onClick={() =>
                    setWeights((p) => ({ ...p, artist: p.artist ? 0 : 0.35 }))
                  }
                >
                  Artist
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className={weights.genre ? "border-accent text-accent" : ""}
                  onClick={() =>
                    setWeights((p) => ({ ...p, genre: p.genre ? 0 : 0.25 }))
                  }
                >
                  Genre
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Results Main Area */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 border-b border-border/30 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                       flex items-center gap-2 px-6 py-2 rounded-xl transition-all
                       ${
                         activeTab === tab.id
                           ? "bg-accent/10 text-accent font-bold"
                           : "text-text-muted hover:text-text hover:bg-surface-elevated"
                       }
                    `}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
              <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-sm animate-pulse tracking-wide uppercase font-bold">
                Analyzing Sound intention...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "tracks" &&
                (trackRecommendations.length > 0 ? (
                  trackRecommendations.map((rec, i) => (
                    <div
                      key={rec.item.id}
                      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <TrackItem
                        title={rec.item.title}
                        artist={rec.item.artist}
                        album={rec.item.album}
                        duration={rec.item.duration}
                        image={
                          <CoverArt
                            src={rec.item.coverArt}
                            className="w-12 h-12"
                          />
                        }
                        onClick={() => handlePlayTrack(rec.item)}
                      />
                      <div className="px-14 pb-1 -mt-1 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 uppercase tracking-tighter">
                          {Math.round(rec.score * 100)}% Match
                        </span>
                        <span className="text-[10px] text-text-muted italic">
                          {rec.reasons[0]?.description}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-text-muted">
                    No track recommendations found.
                  </div>
                ))}

              {activeTab === "albums" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {albumRecommendations.map((rec, i) => (
                    <div
                      key={rec.item.id}
                      className="p-4 rounded-2xl bg-surface-elevated/20 border border-border/40 hover:border-accent/30 transition-all cursor-pointer group animate-in fade-in zoom-in-95 fill-mode-both"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="aspect-square bg-surface rounded-lg mb-4 overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform">
                        <img
                          src={rec.item.coverArt}
                          alt={rec.item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-bold truncate text-sm">
                        {rec.item.title}
                      </h4>
                      <p className="text-xs text-text-muted truncate mb-2">
                        {rec.item.artist}
                      </p>
                      <div className="text-[10px] font-bold text-accent">
                        {Math.round(rec.score * 100)}% Similarity
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "artists" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {artistRecommendations.map((rec, i) => (
                    <div
                      key={rec.item.id}
                      className="p-6 rounded-2xl bg-surface-elevated/20 border border-border/40 flex flex-col items-center text-center hover:bg-surface-elevated transition-colors animate-in fade-in zoom-in-95 fill-mode-both"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-20 h-20 rounded-full bg-surface mb-4 overflow-hidden border-2 border-border/50">
                        <img
                          src={rec.item.imageUrl}
                          alt={rec.item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-bold text-sm">{rec.item.name}</h4>
                      <div className="text-[10px] text-accent mt-1">
                        {Math.round(rec.score * 100)}% Affinity
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: any;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-accent" />
          {label}
        </div>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-secondary/30 rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}
