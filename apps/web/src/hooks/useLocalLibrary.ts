/**
 * useLocalLibrary Hook
 * 
 * Manages local directory scanning for Tauri desktop app.
 * Allows users to add music folders and scan them without server dependency.
 * 
 * This is a web-compatible version that checks if Tauri is available.
 */

import { useState, useCallback, useEffect } from 'react';

interface ScanProgress {
  current: number;
  total: number;
  current_file: string;
}

export interface LocalFolder {
  path: string;
  lastScanned?: Date;
  trackCount: number;
}

// Check if we're running in Tauri - type-safe detection
const isTauri = typeof window !== 'undefined' && 
  ((window as any).__TAURI__ !== undefined || (window as any).__TAURI_INTERNALS__ !== undefined);

export function useLocalLibrary() {
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved folders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sonantica_local_folders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFolders(parsed.map((f: any) => ({
          ...f,
          lastScanned: f.lastScanned ? new Date(f.lastScanned) : undefined
        })));
      } catch (e) {
        console.error('Failed to load saved folders:', e);
      }
    }
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sonantica_local_folders', JSON.stringify(folders));
  }, [folders]);

  // Listen to scan progress events (only in Tauri)
  useEffect(() => {
    if (!isTauri) return;

    let unlistenProgress: (() => void) | null = null;
    let unlistenComplete: (() => void) | null = null;

    const setupListeners = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      
      unlistenProgress = await listen<ScanProgress>('scan-progress', (event) => {
        setScanProgress(event.payload);
      });

      unlistenComplete = await listen<ScanProgress>('scan-complete', (event) => {
        setScanProgress(event.payload);
        setIsScanning(false);
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenComplete) unlistenComplete();
    };
  }, []);

  /**
   * Open folder picker dialog
   */
  const selectFolder = useCallback(async (): Promise<string | null> => {
    if (!isTauri) {
      setError('This feature is only available in the desktop app');
      return null;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<string | null>('select_folder');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder');
      return null;
    }
  }, []);

  /**
   * Add a folder to the library
   */
  const addFolder = useCallback(async () => {
    const folderPath = await selectFolder();
    if (!folderPath) return;

    // Check if folder already exists
    if (folders.some(f => f.path === folderPath)) {
      setError('This folder is already in your library');
      return;
    }

    // Add folder
    const newFolder: LocalFolder = {
      path: folderPath,
      trackCount: 0,
    };

    setFolders(prev => [...prev, newFolder]);
    
    // Automatically scan the new folder
    await scanFolder(folderPath);
  }, [folders, selectFolder]);

  /**
   * Remove a folder from the library
   */
  const removeFolder = useCallback((path: string) => {
    setFolders(prev => prev.filter(f => f.path !== path));
  }, []);

  /**
   * Scan a specific folder
   */
  const scanFolder = useCallback(async (folderPath: string) => {
    if (!isTauri) {
      setError('This feature is only available in the desktop app');
      return [];
    }

    setIsScanning(true);
    setError(null);
    setScanProgress(null);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      
      // Get list of audio files from Tauri
      const audioFiles = await invoke<string[]>('scan_directory', { path: folderPath });
      
      console.log(`Found ${audioFiles.length} audio files in ${folderPath}`);

      // Update folder info
      setFolders(prev => prev.map(f => 
        f.path === folderPath 
          ? { ...f, trackCount: audioFiles.length, lastScanned: new Date() }
          : f
      ));

      // Process files and add to library
      if (audioFiles.length > 0) {
        // Dynamically import library utilities
        const { useLibraryStore } = await import('@sonantica/media-library');
        
        const tracks = [];
        const artists = new Map();

        // Process each file
        for (let i = 0; i < audioFiles.length; i++) {
          const filePath = audioFiles[i];
          
          try {
            // Convert file path to Tauri asset URL
            const assetUrl = convertFileSrc(filePath);
            
            // Extract metadata (simplified - in production we'd use MetadataFactory)
            // For now, we'll create basic track objects
            const fileName = filePath.split(/[\\/]/).pop() || 'Unknown';
            const trackId = `local-${Date.now()}-${i}`;
            
            // Parse basic info from filename (artist - title.ext format)
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            const parts = nameWithoutExt.split(' - ');
            const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
            const title = parts.length > 1 ? parts[1].trim() : nameWithoutExt;
            const album = 'Local Files';
            
            // Create comprehensive track object with all metadata fields
            const track = {
              id: trackId,
              title,
              artist,
              album,
              albumId: 'local-files-album',
              duration: 0,
              filePath: assetUrl, // Use Tauri asset URL
              source: 'local' as const,
              addedAt: new Date(),
              year: new Date().getFullYear(),
              genre: 'Unknown',
              trackNumber: i + 1,
              // Comprehensive metadata object for UI components
              metadata: {
                title,
                artist,
                album,
                albumArtist: artist,
                year: new Date().getFullYear(),
                genre: 'Unknown',
                trackNumber: i + 1,
                duration: 0,
                // Cover art will be enriched by library store if available
                coverArt: undefined,
              }
            };

            tracks.push(track);

            // Collect artists
            if (!artists.has(artist)) {
              artists.set(artist, {
                id: `artist-${artist.toLowerCase().replace(/\s+/g, '-')}`,
                name: artist,
                trackCount: 0,
                albumCount: 0,
              });
            }
            const artistObj = artists.get(artist)!;
            artistObj.trackCount++;

            // Update progress
            if ((i + 1) % 10 === 0) {
              setScanProgress({
                current: i + 1,
                total: audioFiles.length,
                current_file: fileName,
              });
            }
          } catch (err) {
            console.error(`Failed to process file ${filePath}:`, err);
          }
        }

        // Add to library store
        const libraryStore = useLibraryStore.getState();
        
        // Append tracks (deduplication handled by store)
        if (tracks.length > 0) {
          libraryStore.setTracks([...libraryStore.tracks, ...tracks]);
        }
        
        // Append artists
        const artistArray = Array.from(artists.values());
        if (artistArray.length > 0) {
          libraryStore.setArtists([...libraryStore.artists, ...artistArray]);
        }

        // Create/update "Local Files" album
        const existingAlbums = libraryStore.albums;
        const localFilesAlbum = existingAlbums.find(a => a.id === 'local-files-album');
        
        if (!localFilesAlbum) {
          const newAlbum = {
            id: 'local-files-album',
            title: 'Local Files',
            artist: 'Various Artists',
            trackCount: tracks.length,
            year: new Date().getFullYear(),
            addedAt: new Date(),
          };
          libraryStore.setAlbums([...existingAlbums, newAlbum]);
        } else {
          // Update track count
          const updatedAlbums = existingAlbums.map(a => 
            a.id === 'local-files-album' 
              ? { ...a, trackCount: (a.trackCount || 0) + tracks.length }
              : a
          );
          libraryStore.setAlbums(updatedAlbums);
        }

        console.log(`✅ Added ${tracks.length} tracks to library`);
      }

      return audioFiles;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder');
      setIsScanning(false);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Scan all folders
   */
  const scanAllFolders = useCallback(async () => {
    for (const folder of folders) {
      await scanFolder(folder.path);
    }
  }, [folders, scanFolder]);

  return {
    folders,
    isScanning,
    scanProgress,
    error,
    addFolder,
    removeFolder,
    scanFolder,
    scanAllFolders,
    isTauriAvailable: isTauri,
  };
}
