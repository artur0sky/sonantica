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
  const [foldersLoaded, setFoldersLoaded] = useState(false);

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
    setFoldersLoaded(true);
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    if (foldersLoaded) {
      localStorage.setItem('sonantica_local_folders', JSON.stringify(folders));
    }
  }, [folders, foldersLoaded]);

  // Auto-rescan saved folders on startup (only if they have tracks)
  useEffect(() => {
    if (!isTauri || !foldersLoaded || folders.length === 0) return;
    
    const rescanSavedFolders = async () => {
      // Only rescan folders that were previously scanned
      const foldersToRescan = folders.filter(f => f.trackCount > 0 && f.lastScanned);
      
      if (foldersToRescan.length > 0) {
        console.log(`🔄 Re-scanning ${foldersToRescan.length} saved folders...`);
        for (const folder of foldersToRescan) {
          await scanFolder(folder.path);
        }
      }
    };

    // Delay to avoid blocking initial render
    const timer = setTimeout(rescanSavedFolders, 1000);
    return () => clearTimeout(timer);
  }, [foldersLoaded]); // Only run when folders are loaded

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
        const albums = new Map();

        // Process each file with real metadata extraction
        for (let i = 0; i < audioFiles.length; i++) {
          const filePath = audioFiles[i];
          
          try {
            // Convert file path to Tauri asset URL
            const assetUrl = convertFileSrc(filePath);
            
            // Extract real metadata from file using Tauri command
            const metadata = await invoke<{
              title?: string;
              artist?: string;
              album?: string;
              album_artist?: string;
              year?: number;
              genre?: string;
              track_number?: number;
              duration?: number;
              cover_art?: string;
              bitrate?: number;
              sample_rate?: number;
            }>('extract_metadata', { filePath });
            
            // Fallback to filename if metadata is missing
            const fileName = filePath.split(/[\\/]/).pop() || 'Unknown';
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            const parts = nameWithoutExt.split(' - ');
            const fallbackArtist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
            const fallbackTitle = parts.length > 1 ? parts[1].trim() : nameWithoutExt;
            
            // Use metadata or fallback
            const title = metadata.title || fallbackTitle;
            const artist = metadata.artist || fallbackArtist;
            const album = metadata.album || 'Unknown Album';
            const albumArtist = metadata.album_artist || artist;
            const year = metadata.year || new Date().getFullYear();
            const genre = metadata.genre || 'Unknown';
            const trackNumber = metadata.track_number || (i + 1);
            const duration = metadata.duration || 0;
            const coverArt = metadata.cover_art;
            
            const trackId = `local-${Date.now()}-${i}`;
            
            // Create comprehensive track object with real metadata
            const track = {
              id: trackId,
              title,
              artist,
              album,
              albumId: `${artist.toLowerCase().replace(/\s+/g, '-')}-${album.toLowerCase().replace(/\s+/g, '-')}`,
              duration,
              filePath: assetUrl,
              source: 'local' as const,
              addedAt: new Date(),
              year,
              genre,
              trackNumber,
              coverArt, // Embedded cover art from file
              // Comprehensive metadata object for UI components
              metadata: {
                title,
                artist,
                album,
                albumArtist,
                year,
                genre,
                trackNumber,
                duration,
                coverArt,
                bitrate: metadata.bitrate,
                sampleRate: metadata.sample_rate,
              }
            };

            tracks.push(track);

            // Collect artists
            const artistKey = artist.toLowerCase();
            if (!artists.has(artistKey)) {
              artists.set(artistKey, {
                id: `artist-${artist.toLowerCase().replace(/\s+/g, '-')}`,
                name: artist,
                trackCount: 0,
                albumCount: 0,
              });
            }
            const artistObj = artists.get(artistKey)!;
            artistObj.trackCount++;

            // Collect albums (organize by real album names)
            const albumKey = `${artist}-${album}`;
            if (!albums.has(albumKey)) {
              albums.set(albumKey, {
                id: `${artist.toLowerCase().replace(/\s+/g, '-')}-${album.toLowerCase().replace(/\s+/g, '-')}`,
                title: album,
                artist: albumArtist,
                trackCount: 0,
                year,
                addedAt: new Date(),
                coverArt, // Use first track's cover art
              });
              // Increment album count for artist
              artistObj.albumCount++;
            }
            const albumObj = albums.get(albumKey)!;
            albumObj.trackCount++;
            // Update cover art if current track has one and album doesn't
            if (coverArt && !albumObj.coverArt) {
              albumObj.coverArt = coverArt;
            }

            // Update progress
            if ((i + 1) % 5 === 0 || i === audioFiles.length - 1) {
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

        // Append albums (real albums from metadata)
        const albumArray = Array.from(albums.values());
        if (albumArray.length > 0) {
          const existingAlbums = libraryStore.albums;
          const mergedAlbums = [...existingAlbums];
          
          // Merge or add albums
          for (const newAlbum of albumArray) {
            const existingIndex = mergedAlbums.findIndex(a => a.id === newAlbum.id);
            if (existingIndex >= 0) {
              // Update existing album
              mergedAlbums[existingIndex] = {
                ...mergedAlbums[existingIndex],
                trackCount: (mergedAlbums[existingIndex].trackCount || 0) + newAlbum.trackCount,
                coverArt: mergedAlbums[existingIndex].coverArt || newAlbum.coverArt,
              };
            } else {
              // Add new album
              mergedAlbums.push(newAlbum);
            }
          }
          
          libraryStore.setAlbums(mergedAlbums);
        }

        console.log(`✅ Added ${tracks.length} tracks, ${artistArray.length} artists, ${albumArray.length} albums to library`);
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
