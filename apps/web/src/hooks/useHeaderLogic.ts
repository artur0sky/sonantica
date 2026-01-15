import { useLocation } from "wouter";
import { useUIStore } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { trackToMediaSource } from "../utils/streamingUrl";
import { useAnalytics } from "@sonantica/analytics";
import { usePlaylistSettingsStore } from "../stores/playlistSettingsStore";
import { formatArtists } from "@sonantica/shared";

export function useHeaderLogic() {
  const { toggleLeftSidebar } = useUIStore();
  const [, setLocation] = useLocation();
  const { loadTrack, play } = usePlayerStore();
  const trackAccess = usePlaylistSettingsStore((s) => s.trackAccess);
  const analytics = useAnalytics();

  const handleSearchResultSelect = async (result: any) => {
    // Track search result selection
    analytics.trackSearch(result.title, result.type);
    
    switch (result.type) {
      case "track": {
        const track = result.data;
        const mediaSource = trackToMediaSource(track);
        
        const { playNext, next: moveNext } = useQueueStore.getState();
        
        // Insert track as next in queue
        playNext(mediaSource);
        
        // Move to the newly inserted track
        const nextTrack = moveNext(true); // Force next
        
        if (nextTrack) {
          await loadTrack(nextTrack);
          await play();
        }
        break;
      }

      case "artist":
        setLocation(`/artist/${result.id}`);
        break;

      case "album":
        setLocation(`/album/${result.id}`);
        break;

      case "playlist":
        trackAccess(result.id);
        setLocation(`/playlist/${result.id}`);
        break;

      case "genre":
      case "year":
        setLocation("/tracks");
        break;
    }
  };

  const handleSearchResultAction = async (result: any, action: "playNext" | "addToQueue") => {
    const { tracks: allTracks } = useLibraryStore.getState();
    let tracksToQueue: any[] = [];

    const normalizedQuery = result.title.toLowerCase();
    const normalizedSubtitle = result.subtitle?.toLowerCase();

    switch (result.type) {
      case "track":
        tracksToQueue = [result.data];
        break;
      case "album":
        tracksToQueue = allTracks.filter(
          (t) =>
            t.album?.toLowerCase() === normalizedQuery &&
            formatArtists(t.artist).toLowerCase() === normalizedSubtitle
        );
        break;
      case "artist":
        tracksToQueue = allTracks.filter(
          (t) => formatArtists(t.artist).toLowerCase() === normalizedQuery
        );
        break;
      case "playlist":
        tracksToQueue = result.data.tracks || [];
        break;
    }

    if (tracksToQueue.length === 0) return;

    const sources = tracksToQueue.map(trackToMediaSource);
    const { playNext, addToQueue: pushToQueue } = useQueueStore.getState();

    if (action === "playNext") {
      playNext(sources);
    } else {
      pushToQueue(sources);
    }
  };

  return {
    toggleLeftSidebar,
    handleSearchResultSelect,
    handleSearchResultAction,
  };
}
