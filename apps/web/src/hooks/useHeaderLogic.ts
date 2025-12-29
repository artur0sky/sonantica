import { useLocation } from "wouter";
import { useUIStore } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { trackToMediaSource } from "../utils/streamingUrl";

export function useHeaderLogic() {
  const { toggleLeftSidebar } = useUIStore();
  const [, setLocation] = useLocation();
  const { loadTrack, play } = usePlayerStore();
  const { setQueue } = useQueueStore();
  const { albums } = useLibraryStore();

  const handleSearchResultSelect = async (result: any) => {
    switch (result.type) {
      case "track": {
        const track = result.data;
        const { tracks } = useLibraryStore.getState();
        
        // Find the album this track belongs to to queue the context
        const album = albums.find(
          (a) =>
            a.title === track.album &&
            a.artist === track.artist
        );

        if (album) {
          // Get tracks for this album from library
          const albumTracks = tracks.filter(t => t.album === album.title && t.artist === album.artist);
          const trackIndex = albumTracks.findIndex((t) => t.id === track.id);
          const tracksAsSources = albumTracks.map(trackToMediaSource);
          setQueue(tracksAsSources, trackIndex >= 0 ? trackIndex : 0);
        } else {
          setQueue([trackToMediaSource(track)], 0);
        }

        await loadTrack(trackToMediaSource(track));
        await play();
        break;
      }

      case "artist":
        setLocation(`/artist/${result.id}`);
        break;

      case "album":
        setLocation(`/album/${result.id}`);
        break;

      case "genre":
      case "year":
        setLocation("/tracks");
        break;
    }
  };

  return {
    toggleLeftSidebar,
    handleSearchResultSelect,
  };
}
