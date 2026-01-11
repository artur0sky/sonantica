import { useLocation } from "wouter";
import { useLibraryStore } from "@sonantica/media-library";

export function useLeftSidebarLogic() {
  const [location] = useLocation();
  const {
    playlists,
    pinnedPlaylistIds,
    togglePin,
  } = useLibraryStore();

  const isPlaylistActive = (id: string) => location === `/playlists/${id}`;

  return {
    location,
    playlists,
    pinnedPlaylistIds,
    togglePin,
    isPlaylistActive,
  };
}
