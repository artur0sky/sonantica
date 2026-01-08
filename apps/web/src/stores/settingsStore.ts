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
  
  // Interface - Animations
  animations: boolean; // Master toggle
  animationSpeed: 'slow' | 'normal' | 'fast'; // Animation speed preset
  reducedMotion: boolean; // Respect accessibility preference
  hoverAnimations: boolean; // Hover effects
  transitionAnimations: boolean; // Page/component transitions
  listAnimations: boolean; // List item animations
  
  // Interface - Other
  crossfadeDuration: number; // in seconds
  fadeOutDuration: number; // in seconds

  // Offline
  offlineMode: boolean;
  hideUnavailableOffline: boolean;
  downloadQuality: 'original' | 'high' | 'normal' | 'low';
  
  // Analytics
  analyticsDashboardRefreshRate: number; // in ms
  
  // Actions
  toggle: (key: keyof Omit<SettingsState, 'toggle' | 'setTheme' | 'setNumber' | 'setDownloadQuality' | 'setAnimationSpeed'>) => void;
  setNumber: (key: 'playbackBufferSize' | 'scanFileSizeLimit' | 'coverArtSizeLimit' | 'crossfadeDuration' | 'fadeOutDuration' | 'analyticsDashboardRefreshRate', value: number) => void;
  setDownloadQuality: (quality: 'original' | 'high' | 'normal' | 'low') => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
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
      
      // Animation defaults
      animations: true,
      animationSpeed: 'normal',
      reducedMotion: false, // Auto-detected on init
      hoverAnimations: true,
      transitionAnimations: true,
      listAnimations: true,
      
      crossfadeDuration: 0, // Disabled by default
      fadeOutDuration: 0, // Disabled by default

      // Analytics
      analyticsDashboardRefreshRate: 10000, // 10s default

      offlineMode: false,
      hideUnavailableOffline: false,
      downloadQuality: 'original',
      
      toggle: (key) => set((state) => ({ [key]: !state[key as keyof SettingsState] })),
      setNumber: (key, value) => set({ [key]: value }),
      setDownloadQuality: (quality) => set({ downloadQuality: quality }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
    }),
    {
      name: 'sonantica:settings',
    }
  )
);
