import { useMemo } from 'react';
import { useLibraryStore, type Track } from '@sonantica/media-library';
import { useSettingsStore } from '../stores/settingsStore';
import { mergeTracks } from '@sonantica/shared';

/**
 * Hook to get merged tracks from the library based on user settings.
 */
export function useVirtualTracks() {
  const tracks = useLibraryStore(state => state.tracks as Track[]);
  const { mergeTracks: shouldMerge, sourcePriority } = useSettingsStore();

  const virtualTracks = useMemo((): Track[] => {
    if (!shouldMerge) {
      // If not merging, just return tracks with themselves as the only source
      return tracks.map(t => ({ ...t, sources: [t] }));
    }
    return mergeTracks(tracks, sourcePriority);
  }, [tracks, shouldMerge, sourcePriority]);

  return virtualTracks;
}

/**
 * Hook to get filtered virtual tracks.
 */
export function useFilteredVirtualTracks() {
  // We use the store's filter state
  const searchQuery = useLibraryStore(state => state.searchQuery);
  const selectedArtist = useLibraryStore(state => state.selectedArtist);
  const selectedAlbum = useLibraryStore(state => state.selectedAlbum);
  
  const allVirtualTracks = useVirtualTracks();

  const filteredTracks = useMemo(() => {
    let filtered = allVirtualTracks;
    
    // Filter by selected artist
    if (selectedArtist) {
      filtered = filtered.filter(t => t.artist === selectedArtist.name);
    }
    
    // Filter by selected album
    if (selectedAlbum) {
      filtered = filtered.filter(t => 
        t.album === selectedAlbum.title && t.artist === selectedAlbum.artist
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.artist?.toLowerCase().includes(query) ||
        t.album?.toLowerCase().includes(query) ||
        t.genre?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allVirtualTracks, searchQuery, selectedArtist, selectedAlbum]);

  return filteredTracks;
}
