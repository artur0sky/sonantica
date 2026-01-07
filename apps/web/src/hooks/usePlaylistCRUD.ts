/**
 * Playlist CRUD Hook
 * 
 * Manages playlist creation, modification, and deletion.
 * Communicates with the active server and updates local store.
 */

import { useCallback } from 'react';
import { useLibraryStore, type Playlist, type PlaylistType } from '@sonantica/media-library';
import { createLibraryAdapter } from '../services/LibraryService';

export function usePlaylistCRUD() {
  const { addPlaylist, updatePlaylist, deletePlaylist: storeDeletePlaylist } = useLibraryStore();

  const createPlaylist = useCallback(async (name: string, type: PlaylistType = 'MANUAL', trackIds: string[] = []) => {
    const adapter = createLibraryAdapter();
    if (!adapter) throw new Error('No active server');

    try {
      const playlist: Playlist = await adapter.createPlaylist(name, type, trackIds);
      addPlaylist(playlist);
      return playlist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }, [addPlaylist]);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    const adapter = createLibraryAdapter();
    if (!adapter) throw new Error('No active server');

    try {
      const updated = await adapter.updatePlaylist(id, { name });
      updatePlaylist(id, { name: updated.name });
      return updated;
    } catch (error) {
      console.error('Failed to rename playlist:', error);
      throw error;
    }
  }, [updatePlaylist]);

  const addTracksToPlaylist = useCallback(async (id: string, trackIds: string[]) => {
    const adapter = createLibraryAdapter();
    if (!adapter) throw new Error('No active server');

    try {
      // The backend endpoint might handle adding tracks differently, but use updatePlaylist for now
      // assuming the adapter.updatePlaylist takes the full trackIds or a delta.
      // Based on RemoteLibraryAdapter, it takes Partial<Omit<Playlist, ...>>
      
      const currentPlaylist = useLibraryStore.getState().getPlaylistById(id);
      if (!currentPlaylist) throw new Error('Playlist not found localy');

      const updatedTrackIds = [...(currentPlaylist.trackIds || []), ...trackIds];
      const updated = await adapter.updatePlaylist(id, { trackIds: updatedTrackIds });
      
      updatePlaylist(id, { 
        trackIds: updated.trackIds,
        trackCount: updated.trackCount,
        coverArts: updated.coverArts 
      });
      return updated;
    } catch (error) {
      console.error('Failed to add tracks to playlist:', error);
      throw error;
    }
  }, [updatePlaylist]);

  const removeTrackFromPlaylist = useCallback(async (id: string, trackId: string) => {
    const adapter = createLibraryAdapter();
    if (!adapter) throw new Error('No active server');

    try {
      const currentPlaylist = useLibraryStore.getState().getPlaylistById(id);
      if (!currentPlaylist) throw new Error('Playlist not found localy');

      const updatedTrackIds = (currentPlaylist.trackIds || []).filter(tid => tid !== trackId);
      const updated = await adapter.updatePlaylist(id, { trackIds: updatedTrackIds });
      
      updatePlaylist(id, { 
        trackIds: updated.trackIds,
        trackCount: updated.trackCount,
        coverArts: updated.coverArts 
      });
      return updated;
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
      throw error;
    }
  }, [updatePlaylist]);

  const deletePlaylist = useCallback(async (id: string) => {
    const adapter = createLibraryAdapter();
    if (!adapter) throw new Error('No active server');

    try {
      await adapter.deletePlaylist(id);
      storeDeletePlaylist(id);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  }, [storeDeletePlaylist]);

  return {
    createPlaylist,
    renamePlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist
  };
}
