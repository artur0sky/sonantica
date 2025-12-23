/**
 * UI Store
 * 
 * Manages UI state (view mode, modals, etc.)
 */

import { create } from 'zustand';

type ViewMode = 'player' | 'library';
type LibraryView = 'artists' | 'albums' | 'tracks';

interface UIState {
  // View state
  currentView: ViewMode;
  libraryView: LibraryView;
  
  // UI state
  sidebarOpen: boolean;
  
  // Actions
  setView: (view: ViewMode) => void;
  setLibraryView: (view: LibraryView) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'player',
  libraryView: 'artists',
  sidebarOpen: false,

  setView: (view: ViewMode) => {
    set({ currentView: view });
  },

  setLibraryView: (view: LibraryView) => {
    set({ libraryView: view });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
}));
