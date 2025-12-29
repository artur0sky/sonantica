import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Audio
  exclusiveMode: boolean;
  gaplessPlayback: boolean;
  replayGain: boolean;
  soxResampler: boolean;
  playbackBufferSize: number; // in bytes
  
  // Library
  autoScan: boolean;
  watchFolders: boolean;
  parallelScanning: boolean;
  fetchMissingMetadata: boolean;
  embeddedCoversPriority: boolean;
  scanFileSizeLimit: number; // in bytes, 0 = unlimited
  coverArtSizeLimit: number; // in bytes, 0 = unlimited
  
  // Interface
  theme: 'dark' | 'light' | 'system';
  animations: boolean;
  showSidebarOnStartup: boolean;
  minimizeToTray: boolean;
  
  // Actions
  toggle: (key: keyof Omit<SettingsState, 'theme' | 'toggle' | 'setTheme' | 'setNumber'>) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setNumber: (key: 'playbackBufferSize' | 'scanFileSizeLimit' | 'coverArtSizeLimit', value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      exclusiveMode: false,
      gaplessPlayback: true,
      replayGain: false,
      soxResampler: false,
      playbackBufferSize: 50 * 1024 * 1024, // 50MB
      
      autoScan: false,
      watchFolders: true,
      parallelScanning: true,
      fetchMissingMetadata: false,
      embeddedCoversPriority: true,
      scanFileSizeLimit: 0, // Unlimited default (standard)
      coverArtSizeLimit: 10 * 1024 * 1024, // 10MB default
      
      theme: 'dark',
      animations: true,
      showSidebarOnStartup: true,
      minimizeToTray: false,
      
      toggle: (key) => set((state) => ({ [key]: !state[key as keyof SettingsState] })),
      setTheme: (theme) => set({ theme }),
      setNumber: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'sonantica:settings',
    }
  )
);
