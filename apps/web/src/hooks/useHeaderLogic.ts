import { useLocation } from "wouter";
import { useUIStore } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";

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
        // Find the album this track belongs to to queue the context
        const album = albums.find(
          (a) =>
            a.name === track.metadata.album &&
            a.artist === track.metadata.artist
        );

        if (album) {
          const trackIndex = album.tracks.findIndex((t) => t.id === track.id);
          const tracksAsSources = album.tracks.map((t) => ({
            ...t,
            url: t.path,
          }));
          setQueue(tracksAsSources, trackIndex >= 0 ? trackIndex : 0);
        } else {
          setQueue([{ ...track, url: track.path }], 0);
        }

        await loadTrack({ ...track, url: track.path });
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
