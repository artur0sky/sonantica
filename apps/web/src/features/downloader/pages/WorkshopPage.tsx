import { useState, useEffect } from "react";
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
  IconArrowLeft,
  IconUser
} from "@tabler/icons-react";
import { 
  Button, 
  Input, 
  MediaCard, 
  TrackItem as TrackItemUI, 
  CoverArt, 
  ArtistImage,
  cn
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
}

interface PreservationJob {
  id: string;
  title: string;
  type: "track" | "album" | "playlist";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  trackId?: string; // Optional: Link to a specific track if it's a single track job
}

export function WorkshopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<PreservationJob[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Settings management
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Fetch specifically the downloader plugin to get its config
    PluginService.getAllPlugins().then(plugins => {
      const downloader = plugins.find(p => p.manifest.id === "sonantica-downloader");
      if (downloader) setPlugin(downloader);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setSelectedResult(null);
    try {
      const data = await PluginService.identify(searchQuery);
      setResults(data);
      setHasSearched(true);
      // If only one result, auto-select it
      if (data.length === 1) {
        handleSelectResult(data[0]);
      }
    } catch (error) {
      console.error("Identification failed", error);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreserve = async (result: SearchResult) => {
    try {
      // If it's a playlist or album, the process is the same for the worker
      const resp = await PluginService.startDownload(result.url, plugin?.config?.output_format || "flac");
      const jobId = resp.id; // Fixed: Use 'id' from backend response, not 'job_id'

      const newJob: PreservationJob = {
        id: jobId,
        title: result.title,
        type: result.type as any,
        status: "pending",
        progress: 0,
        message: "Source identified. Waiting for slot.",
        trackId: result.type === "track" ? result.id : undefined
      };
      
      setJobs(prev => [newJob, ...prev]);
      pollJobStatus(jobId);
    } catch (error) {
      console.error("Preservation failed", error);
    }
  };

  const handlePreserveSelected = async () => {
    if (!selectedResult || selectedTrackIds.size === 0) return;
    
    const tracksToPreserve = selectedResult.tracks?.filter(t => selectedTrackIds.has(t.id)) || [];
    
    for (const track of tracksToPreserve) {
      await handlePreserve(track);
    }
    
    // Reset selection after starting
    setSelectedTrackIds(new Set());
    setIsSelectionMode(false);
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds(prev => {
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
      setSelectedTrackIds(new Set(selectedResult.tracks.map(t => t.id)));
    }
  };

  const pollJobStatus = async (jobId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        attempts++;
        const status = await PluginService.getDownloadJobStatus(jobId);
        
        setJobs((prev: PreservationJob[]) => {
          const job = prev.find(j => j.id === jobId);
          // If job vanished or is already final in state, we might want to stop
          if (!job) {
            clearInterval(interval);
            return prev;
          }

          return prev.map((j: PreservationJob) => 
            j.id === jobId 
              ? { 
                  ...j, 
                  status: status.status, 
                  progress: status.progress, 
                  message: status.message 
                } 
              : j
          );
        });

        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
        }
        
        // Safety timeout
        if (attempts > 300) { // 10 minutes at 2s interval
           clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to poll status", error);
        // Don't clear immediately, maybe it's a transient network issue
        if (attempts > 305) clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const handleSelectResult = async (result: SearchResult) => {
    setSelectedResult(result);
    // Reset selection state
    setSelectedTrackIds(new Set());
    setIsSelectionMode(false);

    // If it's a collection but tracks are missing, refetch using identify with URL
    if ((result.type === "album" || result.type === "playlist") && (!result.tracks || result.tracks.length === 0)) {
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

  // Aggregate Batch Progress
  const activeBatchJobs = jobs.filter(j => j.status === "pending" || j.status === "processing");
  const completedBatchJobs = jobs.filter(j => j.status === "completed");
  const totalBatchSize = activeBatchJobs.length + completedBatchJobs.length;
  const aggregateProgress = totalBatchSize > 0 
    ? Math.round((jobs.reduce((acc, j) => acc + (j.progress || 0), 0)) / jobs.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <IconHammer className="text-accent" size={32} />
            The Workshop
          </h1>
          <p className="text-text-muted max-w-2xl italic">
            "The craftsman does not rush the tool. Sound deserves the time it takes to be correctly preserved."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Search & Results */}
        <div className="lg:col-span-2 space-y-8">
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
              <Button type="submit" disabled={isSearching} className="bg-accent hover:bg-accent-light text-white font-bold">
                {isSearching ? <IconLoader className="animate-spin" /> : "Identify Signal"}
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
                        <ArtistImage src={selectedResult.cover_art} alt={selectedResult.title} className="w-full h-full" iconSize={80} />
                      ) : (
                        <CoverArt src={selectedResult.cover_art} alt={selectedResult.title} className="w-full h-full" iconSize={80} />
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
                          <IconArrowLeft size={16} className="mr-1" /> Back to results
                        </Button>
                        <h2 className="text-4xl font-bold tracking-tight">{selectedResult.title}</h2>
                        <p className="text-xl text-text-muted">{selectedResult.subtitle}</p>
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-sm font-bold uppercase tracking-widest px-3 py-1 bg-accent/20 text-accent rounded-full border border-accent/30 flex items-center gap-2">
                            {selectedResult.type === "playlist" ? <IconPlaylist size={14} /> : selectedResult.type === "album" ? <IconDisc size={14} /> : selectedResult.type === "artist" ? <IconUser size={14} /> : <IconMusic size={14} />}
                            {selectedResult.type}
                          </span>
                          {selectedResult.track_count && (
                            <span className="text-sm text-text-disabled font-mono italic">
                              {selectedResult.track_count} tracks identified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <Button 
                          onClick={() => handlePreserve(selectedResult)}
                          className="bg-accent hover:bg-accent-light text-white px-8 py-6 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                        >
                          <IconDownload size={24} />
                          Preserve Entire {selectedResult.type.charAt(0).toUpperCase() + selectedResult.type.slice(1)}
                        </Button>

                        {selectedResult.tracks && (
                          <Button 
                            variant="secondary"
                            onClick={() => setIsSelectionMode(!isSelectionMode)}
                            className={cn(
                              "px-8 py-6 rounded-2xl font-bold flex items-center gap-3 transition-all",
                              isSelectionMode && "bg-accent/10 border-accent/50 text-accent"
                            )}
                          >
                            <IconCheck size={24} />
                            {isSelectionMode ? "Cancel Selection" : "Selection Mode"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Batch Actions & Global Progress */}
                  {(isSelectionMode && selectedTrackIds.size > 0) || activeBatchJobs.length > 0 ? (
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
                                <IconLoader className="animate-spin text-accent" size={20} />
                                <span className="font-bold text-accent">Active Preservation: {activeBatchJobs.length} components</span>
                              </div>
                              <span className="text-xs text-text-muted font-mono">{aggregateProgress}% Total</span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-text-muted">{selectedTrackIds.size} components selected</span>
                              <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-accent hover:bg-accent/10">
                                {selectedTrackIds.size === selectedResult.tracks?.length ? "Deselect All" : "Select All"}
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
                          const activeJob = jobs.find(j => j.trackId === track.id && (j.status === "pending" || j.status === "processing"));
                          const completedJob = jobs.find(j => j.trackId === track.id && j.status === "completed");

                          return (
                            <div key={track.id} className="group relative">
                              <TrackItemUI 
                                title={track.title}
                                artist={track.subtitle}
                                album={selectedResult.title}
                                image={<CoverArt src={track.cover_art || selectedResult.cover_art} alt="" className="w-full h-full" iconSize={20} />}
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedTrackIds.has(track.id)}
                                onClick={() => isSelectionMode ? toggleTrackSelection(track.id) : handlePreserve(track)}
                                className={cn(
                                  "hover:bg-white/5 transition-colors",
                                  selectedTrackIds.has(track.id) && "bg-accent/5",
                                  activeJob && "bg-accent/5"
                                )}
                              />
                              
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                {activeJob ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 border border-accent/30 rounded-full">
                                    <IconLoader className="animate-spin text-accent" size={12} />
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{activeJob.progress}%</span>
                                  </div>
                                ) : completedJob ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                                    <IconCheck className="text-green-500" size={12} />
                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Preserved</span>
                                  </div>
                                ) : !isSelectionMode ? (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all">
                                    <Button 
                                      variant="secondary" 
                                      size="sm"
                                      onClick={() => handlePreserve(track)}
                                      className="h-10 px-4 rounded-xl flex items-center gap-2 hover:bg-accent hover:text-white"
                                    >
                                      <IconDownload size={16} />
                                      <span className="text-xs">Preserve</span>
                                    </Button>
                                  </div>
                                ) : null}
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
                        result.type === "artist" ? (
                          <ArtistImage src={result.cover_art} alt={result.title} className="w-full h-full" iconSize={48} />
                        ) : (
                          <CoverArt src={result.cover_art} alt={result.title} className="w-full h-full" iconSize={48} />
                        )
                      }
                      imageShape={result.type === "artist" ? "circle" : "square"}
                      badge={
                        <div className="bg-surface/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-accent ring-1 ring-black/50">
                          {result.type === "playlist" ? <IconPlaylist size={14} /> : result.type === "album" ? <IconDisc size={14} /> : result.type === "artist" ? <IconUser size={14} /> : <IconMusic size={14} />}
                        </div>
                      }
                      onClick={() => handleSelectResult(result)}
                      hoverOverlay={
                        <div className="bg-accent/80 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-2xl">
                          <IconArrowRight size={18} />
                          Analyze Signal
                        </div>
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
                    {hasSearched ? (
                      <IconSearch size={48} className="text-accent/20" />
                    ) : (
                      <IconMusic size={48} className="text-text-disabled/20" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-medium text-text-muted">
                      {hasSearched ? "The signal is silent" : "The workshop is ready"}
                    </p>
                    <p className="text-sm text-text-disabled max-w-xs mx-auto italic">
                      {hasSearched 
                        ? "We couldn't identify any source for this query. Try a direct Spotify link or a different search term."
                        : '"A quiet workshop is a workshop waiting for inspiration. Provide a source to begin the process."'
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right: Active preservation (Queue) */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconDownload size={20} className="text-accent" />
            Active Preservation
          </h2>
          
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="bg-surface-elevated/50 border border-dashed border-border rounded-xl p-8 text-center text-text-muted text-sm">
                No active preservation tasks.
              </div>
            ) : (
              <AnimatePresence>
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface-elevated border border-border p-4 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium truncate">{job.title}</h4>
                        <p className="text-[10px] uppercase tracking-wider text-accent font-bold mt-1">
                          {job.status}
                        </p>
                      </div>
                      {job.status === "completed" ? (
                        <IconCheck className="text-green-500" size={18} />
                      ) : job.status === "failed" ? (
                        <span className="text-red-500 text-xs font-bold">!</span>
                      ) : (
                        <IconLoader className="animate-spin text-accent" size={16} />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-muted text-right italic">
                        {job.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {jobs.some(j => j.status === "completed") && (
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl">
              <p className="text-xs text-accent-light flex items-center gap-2">
                <IconMusic size={14} />
                New signal synthesized in Library.
                <IconArrowRight size={14} className="ml-auto" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
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
