/**
 * useLocalLibrary Hook
 * 
 * Manages local directory scanning for Tauri desktop app.
 * Allows users to add music folders and scan them without server dependency.
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useLibraryStore } from '@sonantica/media-library';

interface ScanProgress {
  current: number;
  total: number;
  current_file: string;
}

interface LocalFolder {
  path: string;
  lastScanned?: Date;
  trackCount: number;
}

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

  // Listen to scan progress events
  useEffect(() => {
    const unlistenProgress = listen<ScanProgress>('scan-progress', (event) => {
      setScanProgress(event.payload);
    });

    const unlistenComplete = listen<ScanProgress>('scan-complete', (event) => {
      setScanProgress(event.payload);
      setIsScanning(false);
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, []);

  /**
   * Open folder picker dialog
   */
  const selectFolder = useCallback(async (): Promise<string | null> => {
    try {
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
    setIsScanning(true);
    setError(null);
    setScanProgress(null);

    try {
      // Get list of audio files from Tauri
      const audioFiles = await invoke<string[]>('scan_directory', { path: folderPath });
      
      console.log(`Found ${audioFiles.length} audio files in ${folderPath}`);

      // Update folder info
      setFolders(prev => prev.map(f => 
        f.path === folderPath 
          ? { ...f, trackCount: audioFiles.length, lastScanned: new Date() }
          : f
      ));

      // TODO: Process files with MetadataFactory and add to library
      // For now, we'll just log the files
      // In a future implementation, we'll:
      // 1. Read metadata from each file
      // 2. Create Track objects
      // 3. Add to useLibraryStore

      return audioFiles;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder');
      setIsScanning(false);
      return [];
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
  };
}
