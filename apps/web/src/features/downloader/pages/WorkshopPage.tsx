import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";

import {
  IconHammer,
  IconSearch,
  IconDownload,
  IconCheck,
  IconLoader,
  IconArrowRight,
  IconMusic,
  IconSettings,
  IconPlaylist,
  IconDisc,
  IconRefresh,
  IconArrowLeft,
  IconUser,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconX,
  IconBolt,
  IconHourglassLow,
} from "@tabler/icons-react";
import {
  Button,
  Input,
  MediaCard,
  TrackItem as TrackItemUI,
  CoverArt,
  ArtistImage,
  cn,
} from "@sonantica/ui";
import { motion, AnimatePresence } from "framer-motion";
import { PluginService, type Plugin } from "../../../services/PluginService";
import { PluginConfigModal } from "../../settings/components/PluginConfigModal";

interface SearchResult {
  id: string;
  type: "track" | "album" | "playlist" | "artist";
  title: string;
  subtitle: string;
  cover_art: string;
  url: string;
  track_count?: number;
  tracks?: SearchResult[];
  is_downloaded?: boolean;
  download_status?: string;
}

interface PreservationJob {
  id: string;
  title: string;
  artist?: string;
  coverArt?: string;
  url?: string;
  type: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "paused";
  progress: number;
  message: string;
  speed?: string;
  eta?: string;
  trackId?: string;
  created_at?: string;
}

import { useLibraryStore } from "@sonantica/media-library";
import { TrackItem } from "../../library/components/TrackItem";

import { usePluginStore } from "../../../stores/pluginStore";

export function WorkshopPage() {
  const isPluginEnabled = usePluginStore((s) => s.isPluginEnabled);
  const isLoading = usePluginStore((s) => s.isLoading);
  const isEnabled = isPluginEnabled("sonantica-downloader");

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<PreservationJob[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Settings management
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Error handling and Polling optimization
  const [fetchErrorCount, setFetchErrorCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDownloads = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const downloads = await PluginService.getDownloads(undefined, 20);
      setJobs(
        downloads.map((d: any) => ({
          id: d.id,
          title: d.title || d.url,
          artist: d.artist,
          coverArt: d.cover_art,
          url: d.url,
          type: "track",
          status: d.status,
          progress: d.progress,
          message: d.message || d.error_message || "",
          speed: d.speed,
          eta: d.eta,
          created_at: d.created_at,
        }))
      );
      setFetchErrorCount(0);
    } catch (e: any) {
      console.error("Failed to fetch downloads history", e);
      setFetchErrorCount((prev) => prev + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    PluginService.getAllPlugins().then((plugins) => {
      const downloader = plugins.find(
        (p) => p.manifest.id === "sonantica-downloader"
      );
      if (downloader) setPlugin(downloader);
    });

    if (isEnabled && fetchErrorCount < 5) {
      fetchDownloads();
    }
  }, [isEnabled, fetchDownloads, fetchErrorCount]);

  if (!isEnabled && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
          <IconHammer size={48} className="text-text-disabled/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Workshop Inactive</h2>
          <p className="text-text-muted max-w-sm mx-auto">
            The Downloader plugin is currently disabled or unreachable. Enable
            it in{" "}
            <Link href="/settings" className="text-accent hover:underline">
              Settings
            </Link>{" "}
            to access the Workshop.
          </p>
        </div>
      </div>
    );
  }

  // Identification logic state moved to the top for better polling/error management

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    setSelectedResult(null);
    setError(null);
    try {
      const data = await PluginService.identify(searchQuery);
      setResults(data);
      setHasSearched(true);
      if (data.length === 1) {
        handleSelectResult(data[0]);
      }
    } catch (error: any) {
      console.error("Identification failed", error);
      setError(error.message || "Failed to identify source");
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreserve = async (result: SearchResult) => {
    setError(null);
    try {
      await PluginService.startDownload(
        result.url,
        plugin?.config?.output_format || "flac",
        {
          title: result.title,
          artist: result.subtitle,
          cover_art: result.cover_art,
        }
      );
      // Optimistic update
      fetchDownloads();
    } catch (error: any) {
      console.error("Preservation failed", error);
      setError(error.message || "Failed to start preservation");
    }
    // Also reset selection if track
    if (result.type === "track" && isSelectionMode) {
      toggleTrackSelection(result.id);
    }
  };

  const handlePreserveSelected = async () => {
    if (!selectedResult || selectedTrackIds.size === 0) return;

    const tracksToPreserve =
      selectedResult.tracks?.filter((t) => selectedTrackIds.has(t.id)) || [];

    for (const track of tracksToPreserve) {
      await handlePreserve(track);
    }

    setSelectedTrackIds(new Set());
    setIsSelectionMode(false);
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!selectedResult?.tracks) return;
    if (selectedTrackIds.size === selectedResult.tracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(selectedResult.tracks.map((t) => t.id)));
    }
  };

  const handleSelectResult = async (result: SearchResult) => {
    setSelectedResult(result);
    setSelectedTrackIds(new Set());
    setIsSelectionMode(false);

    if (
      (result.type === "album" || result.type === "playlist") &&
      (!result.tracks || result.tracks.length === 0)
    ) {
      try {
        const detailed = await PluginService.identify(result.url);
        if (detailed && detailed.length > 0) {
          setSelectedResult(detailed[0]);
        }
      } catch (error) {
        console.error("Failed to fetch detailed signal components", error);
      }
    }
  };

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!plugin) return;
    await PluginService.updateConfig(plugin.id, config);
    setPlugin({ ...plugin, config });
    setShowSettings(false);
  };

  // Job Actions
  const handlePause = async (id: string) => {
    await PluginService.pauseDownload(id);
    fetchDownloads();
  };
  const handleResume = async (id: string) => {
    await PluginService.resumeDownload(id);
    fetchDownloads();
  };
  const handleRetry = async (id: string) => {
    await PluginService.retryDownload(id);
    fetchDownloads();
  };
  const handleCancel = async (id: string) => {
    await PluginService.cancelDownload(id);
    fetchDownloads();
  };
  const handleDelete = async (id: string) => {
    if (confirm("Remove this entry from history?")) {
      await PluginService.deleteDownload(id);
      fetchDownloads();
    }
  };

  const activeBatchJobs = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  );

  const aggregateProgress =
    activeBatchJobs.length > 0
      ? Math.round(
          activeBatchJobs.reduce((acc, j) => acc + (j.progress || 0), 0) /
            activeBatchJobs.length
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <IconHammer className="text-accent" size={32} />
            The Workshop
          </h1>
          <p className="text-text-muted max-w-2xl italic">
            "The craftsman does not rush the tool. Sound deserves the time it
            takes to be correctly preserved."
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2"
        >
          <IconSettings size={18} />
          Workshop Settings
        </Button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
          <IconX
            size={20}
            className="cursor-pointer"
            onClick={() => setError(null)}
          />
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Search & Results */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-elevated border border-border p-6 rounded-2xl space-y-4 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconSearch size={20} className="text-accent" />
              Source Identification
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Paste Spotify URL (Playlist, Album, Track) or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-surface font-mono text-sm border-white/5 focus:border-accent/50"
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-accent hover:bg-accent-light text-white font-bold"
              >
                {isSearching ? (
                  <IconLoader className="animate-spin" />
                ) : (
                  "Identify Signal"
                )}
              </Button>
            </form>
          </section>

          <section className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {selectedResult ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Detail Header */}
                  <div className="flex flex-col md:flex-row gap-8 items-start bg-surface-elevated/50 p-8 rounded-3xl border border-border">
                    <div className="w-full md:w-64 aspect-square flex-shrink-0 shadow-2xl shadow-black/50 overflow-hidden rounded-2xl border border-white/10">
                      {selectedResult.type === "artist" ? (
                        <ArtistImage
                          src={selectedResult.cover_art}
                          alt={selectedResult.title}
                          className="w-full h-full"
                          iconSize={80}
                        />
                      ) : (
                        <CoverArt
                          src={selectedResult.cover_art}
                          alt={selectedResult.title}
                          className="w-full h-full"
                          iconSize={80}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-6 self-end">
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResult(null)}
                          className="pl-0 text-text-muted hover:text-accent transition-colors"
                        >
                          <IconArrowLeft size={16} className="mr-1" /> Back to
                          results
                        </Button>
                        <h2 className="text-4xl font-bold tracking-tight">
                          {selectedResult.title}
                        </h2>
                        <p className="text-xl text-text-muted">
                          {selectedResult.subtitle}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          {/* Badges */}
                          <span className="text-sm font-bold uppercase tracking-widest px-3 py-1 bg-accent/20 text-accent rounded-full border border-accent/30 flex items-center gap-2">
                            {selectedResult.type === "playlist" ? (
                              <IconPlaylist size={14} />
                            ) : selectedResult.type === "album" ? (
                              <IconDisc size={14} />
                            ) : selectedResult.type === "artist" ? (
                              <IconUser size={14} />
                            ) : (
                              <IconMusic size={14} />
                            )}
                            {selectedResult.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <Button
                          onClick={() => handlePreserve(selectedResult)}
                          className="bg-accent hover:bg-accent-light text-white px-8 py-6 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                        >
                          <IconDownload size={24} />
                          Preserve Entire {selectedResult.type}
                        </Button>

                        {selectedResult.tracks && (
                          <Button
                            variant="secondary"
                            onClick={() => setIsSelectionMode(!isSelectionMode)}
                            className={cn(
                              "px-8 py-6 rounded-2xl font-bold flex items-center gap-3 transition-all",
                              isSelectionMode &&
                                "bg-accent/10 border-accent/50 text-accent"
                            )}
                          >
                            <IconCheck size={24} />
                            {isSelectionMode
                              ? "Cancel Selection"
                              : "Selection Mode"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Batch Actions & Global Progress */}
                  {(isSelectionMode && selectedTrackIds.size > 0) ||
                  activeBatchJobs.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-elevated border border-accent/30 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl sticky top-4 z-10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {activeBatchJobs.length > 0 ? (
                            <>
                              <div className="flex items-center gap-2">
                                <IconLoader
                                  className="animate-spin text-accent"
                                  size={20}
                                />
                                <span className="font-bold text-accent">
                                  Active Batches: {activeBatchJobs.length}
                                </span>
                              </div>
                              <span className="text-xs text-text-muted font-mono">
                                {aggregateProgress}% Total
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-text-muted">
                                {selectedTrackIds.size} components selected
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSelectAll}
                                className="text-accent hover:bg-accent/10"
                              >
                                {selectedTrackIds.size ===
                                selectedResult.tracks?.length
                                  ? "Deselect All"
                                  : "Select All"}
                              </Button>
                            </>
                          )}
                        </div>

                        {!activeBatchJobs.length && (
                          <Button
                            onClick={handlePreserveSelected}
                            className="bg-accent text-white hover:bg-accent-light font-bold px-6 shadow-lg shadow-accent/20"
                          >
                            <IconDownload size={18} className="mr-2" />
                            Preserve Selection
                          </Button>
                        )}
                      </div>

                      {activeBatchJobs.length > 0 && (
                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${aggregateProgress}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ) : null}

                  {/* Track Listing */}
                  {selectedResult.tracks && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 px-2">
                        <IconMusic size={20} className="text-accent" />
                        Component Recognition
                      </h3>
                      <div className="bg-surface-elevated rounded-2xl border border-border divide-y divide-white/5 overflow-hidden">
                        {selectedResult.tracks.map((track) => {
                          const status = track.is_downloaded
                            ? "completed"
                            : track.download_status;
                          return (
                            <div key={track.id} className="group relative">
                              <TrackItemUI
                                title={track.title}
                                artist={track.subtitle}
                                album={selectedResult.title}
                                image={
                                  <CoverArt
                                    src={
                                      track.cover_art ||
                                      selectedResult.cover_art
                                    }
                                    alt=""
                                    className="w-full h-full"
                                    iconSize={20}
                                  />
                                }
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedTrackIds.has(track.id)}
                                onClick={() =>
                                  isSelectionMode
                                    ? toggleTrackSelection(track.id)
                                    : handlePreserve(track)
                                }
                                className={cn(
                                  "hover:bg-white/5 transition-colors",
                                  selectedTrackIds.has(track.id) &&
                                    "bg-accent/5",
                                  status === "completed" && "opacity-75"
                                )}
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                {status === "completed" ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                                    <IconCheck
                                      className="text-green-500"
                                      size={12}
                                    />
                                    <span className="text-[10px] font-bold text-green-500 uppercase">
                                      Preserved
                                    </span>
                                  </div>
                                ) : (
                                  !isSelectionMode && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-all">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handlePreserve(track)}
                                      >
                                        <IconDownload size={16} />
                                      </Button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-2"
                >
                  {results.map((result) => (
                    <MediaCard
                      key={result.id}
                      title={result.title}
                      subtitle={result.subtitle}
                      image={
                        <CoverArt
                          src={result.cover_art}
                          alt={result.title}
                          className="w-full h-full"
                        />
                      }
                      onClick={() => handleSelectResult(result)}
                      hoverOverlay={
                        <div className="bg-accent/80 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-2xl">
                          <IconArrowRight size={18} />
                          Analyze Signal
                        </div>
                      }
                      badge={
                        result.is_downloaded && (
                          <IconCheck size={14} className="text-green-500" />
                        )
                      }
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                    <IconSearch size={48} className="text-text-disabled/20" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl font-medium text-text-muted">
                      {hasSearched
                        ? "The signal is silent"
                        : "The workshop is ready"}
                    </p>

                    {hasSearched && searchQuery && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
                        <p className="text-sm text-text-muted/60 mb-4">
                          No direct match found. You can try to force the
                          preservation of this identifier:
                        </p>
                        <Button
                          variant="secondary"
                          className="bg-accent/10 hover:bg-accent/20 border-accent/20 text-accent"
                          onClick={() =>
                            handlePreserve({
                              id: "manual-" + Date.now(),
                              type: "track",
                              title: searchQuery,
                              subtitle: "Manual Retrieval",
                              cover_art: "",
                              url: searchQuery,
                            })
                          }
                        >
                          <IconDownload size={18} className="mr-2" />
                          Force Preservation
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right: Active preservation (Queue & History) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconDownload size={20} className="text-accent" />
              Preservation Queue
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDownloads}
              className={cn(
                "h-8 w-8 p-0 rounded-full hover:bg-white/5",
                isRefreshing && "animate-spin text-accent"
              )}
              title="Refresh queue"
            >
              <IconRefresh size={18} />
            </Button>
          </div>

          <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {jobs.length === 0 ? (
              <div className="bg-surface-elevated/50 border border-dashed border-border rounded-xl p-8 text-center text-text-muted text-sm">
                No active preservation tasks.
              </div>
            ) : (
              <AnimatePresence>
                {jobs.map((job) => {
                  const libraryTracks = useLibraryStore.getState().tracks;
                  const matchingTrack =
                    job.status === "completed"
                      ? libraryTracks.find(
                          (t) =>
                            t.title?.toLowerCase() ===
                              job.title?.toLowerCase() ||
                            t.filename
                              ?.toLowerCase()
                              .includes(job.title?.toLowerCase() || "")
                        )
                      : null;

                  return (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-surface-elevated border border-border p-4 rounded-xl space-y-3 shadow-md group border-l-4"
                      style={{
                        borderLeftColor:
                          job.status === "completed"
                            ? "var(--accent)"
                            : "transparent",
                      }}
                    >
                      {matchingTrack ? (
                        <div className="bg-accent/5 rounded-lg p-1 border border-accent/10">
                          <TrackItem
                            track={matchingTrack}
                            onClick={() => {}}
                            compact
                          />
                          <div className="px-3 pb-2 flex items-center justify-between mt-1">
                            <span className="text-[10px] text-accent font-bold uppercase tracking-tighter">
                              Ready in Library
                            </span>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="p-1 text-text-muted hover:text-error transition-colors"
                            >
                              <IconTrash size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-surface flex-shrink-0 overflow-hidden border border-white/5">
                                <CoverArt src={job.coverArt} iconSize={16} />
                              </div>
                              <div className="min-w-0">
                                <h4
                                  className="text-sm font-medium truncate"
                                  title={job.title}
                                >
                                  {job.title}
                                </h4>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <p className="text-[10px] text-text-muted truncate uppercase tracking-tighter font-semibold opacity-70">
                                    {job.artist || "Unknown Source"}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-[10px] uppercase tracking-wider font-bold",
                                        job.status === "completed"
                                          ? "text-green-500"
                                          : job.status === "failed"
                                          ? "text-red-500"
                                          : job.status === "processing"
                                          ? "text-accent"
                                          : "text-text-muted"
                                      )}
                                    >
                                      {job.status}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                      {job.created_at &&
                                        new Date(
                                          job.created_at
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <div className="flex items-center gap-2">
                                {job.speed && (
                                  <span className="flex items-center gap-1 text-accent font-bold">
                                    <IconBolt size={10} />
                                    {job.speed}
                                  </span>
                                )}
                                {job.eta && (
                                  <span className="flex items-center gap-1 text-text-muted">
                                    <IconHourglassLow size={10} />
                                    ETA: {job.eta}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-accent">
                                {Math.round(job.progress)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-text-muted text-right mt-1 font-medium italic opacity-80">
                              {job.message ||
                                (job.status === "processing"
                                  ? "Preserving..."
                                  : "")}
                            </p>
                          </div>

                          {/* Controls */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {job.status === "processing" && (
                              <>
                                <button
                                  onClick={() => handlePause(job.id)}
                                  className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-white"
                                  title="Pause"
                                >
                                  <IconPlayerPause size={14} />
                                </button>
                                <button
                                  onClick={() => handleCancel(job.id)}
                                  className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-error"
                                  title="Cancel"
                                >
                                  <IconX size={14} />
                                </button>
                              </>
                            )}
                            {job.status === "paused" && (
                              <button
                                onClick={() => handleResume(job.id)}
                                className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-white"
                                title="Resume"
                              >
                                <IconPlayerPlay size={14} />
                              </button>
                            )}
                            {job.status === "pending" && (
                              <button
                                onClick={() => handleCancel(job.id)}
                                className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-error"
                                title="Cancel"
                              >
                                <IconX size={14} />
                              </button>
                            )}
                            {(job.status === "completed" ||
                              job.status === "failed" ||
                              job.status === "cancelled") && (
                              <div className="flex gap-1">
                                {job.status === "failed" && (
                                  <button
                                    onClick={() => handleRetry(job.id)}
                                    className="p-1.5 hover:bg-surface rounded text-accent hover:text-white"
                                    title="Retry"
                                  >
                                    <IconRefresh size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(job.id)}
                                  className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-error"
                                  title="Remove"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {showSettings && plugin && (
        <PluginConfigModal
          isOpen={showSettings}
          pluginId={plugin.id}
          pluginName={plugin.manifest.name}
          config={plugin.config}
          onSave={handleSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
