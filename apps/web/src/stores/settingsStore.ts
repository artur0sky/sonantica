import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Audio
  playbackBufferSize: number; // in bytes
  
  // Library
  autoScan: boolean;
  watchFolders: boolean;
  parallelScanning: boolean;
  scanFileSizeLimit: number; // in bytes, 0 = unlimited
  coverArtSizeLimit: number; // in bytes, 0 = unlimited
  
  // Interface
  animations: boolean;
  crossfadeDuration: number; // in seconds
  fadeOutDuration: number; // in seconds

  // Offline
  offlineMode: boolean;
  hideUnavailableOffline: boolean;
  downloadQuality: 'original' | 'high' | 'normal' | 'low';
  
  // Actions
  toggle: (key: keyof Omit<SettingsState, 'toggle' | 'setTheme' | 'setNumber' | 'setDownloadQuality'>) => void;
  setNumber: (key: 'playbackBufferSize' | 'scanFileSizeLimit' | 'coverArtSizeLimit' | 'crossfadeDuration' | 'fadeOutDuration', value: number) => void;
  setDownloadQuality: (quality: 'original' | 'high' | 'normal' | 'low') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      playbackBufferSize: 50 * 1024 * 1024, // 50MB
      
      autoScan: false,
      watchFolders: true,
      parallelScanning: true,
      scanFileSizeLimit: 0, // Unlimited default (standard)
      coverArtSizeLimit: 10 * 1024 * 1024, // 10MB default
      
      animations: true,
      crossfadeDuration: 0, // Disabled by default
      fadeOutDuration: 0, // Disabled by default

      offlineMode: false,
      hideUnavailableOffline: false,
      downloadQuality: 'original',
      
      toggle: (key) => set((state) => ({ [key]: !state[key as keyof SettingsState] })),
      setNumber: (key, value) => set({ [key]: value }),
      setDownloadQuality: (quality) => set({ downloadQuality: quality }),
    }),
    {
      name: 'sonantica:settings',
    }
  )
);
