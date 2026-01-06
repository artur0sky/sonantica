/**
 * UI Store
 * 
 * Manages UI state (layout, player visibility, queue, etc.)
 */

import { create } from 'zustand';

export interface UIState {
  // Player UI state
  isPlayerExpanded: boolean;
  isQueueOpen: boolean;
  isQueueExpanded: boolean; // Controls if queue shows all tracks or just next one
  lyricsOpen: boolean;
  eqOpen: boolean;
  recommendationsOpen: boolean;
  isVisualizationEnabled: boolean;
  
  // Sidebar state
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isMetadataPanelOpen: boolean;
  
  // Sidebar widths
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  lyricsSidebarWidth: number;
  eqSidebarWidth: number;
  recommendationsSidebarWidth: number;
  isCramped: boolean;
  
  // Actions
  togglePlayerExpanded: () => void;
  toggleQueue: () => void;
  toggleQueueExpanded: () => void;
  toggleLyrics: () => void;
  toggleEQ: () => void;
  toggleRecommendations: () => void;
  toggleVisualization: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleMetadataPanel: () => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setQueueExpanded: (expanded: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setEQOpen: (open: boolean) => void;
  setRecommendationsOpen: (open: boolean) => void;
  setMetadataPanelOpen: (open: boolean) => void;
  setVisualizationEnabled: (enabled: boolean) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setLyricsSidebarWidth: (width: number) => void;
  setEQSidebarWidth: (width: number) => void;
  setRecommendationsSidebarWidth: (width: number) => void;
  setIsCramped: (isCramped: boolean) => void;
  closeLeftSidebarOnPlay: () => void; // Auto-close left sidebar when playing
}

export const useUIStore = create<UIState>((set) => ({
  isPlayerExpanded: false,
  isQueueOpen: false,
  isQueueExpanded: false,
  lyricsOpen: false,
  eqOpen: false,
  recommendationsOpen: false,
  isVisualizationEnabled: false,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  isMetadataPanelOpen: false,
  leftSidebarWidth: 280,
  rightSidebarWidth: 320,
  lyricsSidebarWidth: 320,
  eqSidebarWidth: 320,
  recommendationsSidebarWidth: 320,
  isCramped: false,

  togglePlayerExpanded: () => {
    set((state) => ({ isPlayerExpanded: !state.isPlayerExpanded }));
  },

  toggleQueue: () => {
    set((state) => ({ 
      isQueueOpen: !state.isQueueOpen,
      isRightSidebarOpen: !state.isQueueOpen, // Sync with sidebar
    }));
  },

  toggleQueueExpanded: () => {
    set((state) => ({ isQueueExpanded: !state.isQueueExpanded }));
  },

  toggleLyrics: () => {
    set((state) => ({ lyricsOpen: !state.lyricsOpen }));
  },

  toggleEQ: () => {
    set((state) => ({ eqOpen: !state.eqOpen }));
  },

  toggleRecommendations: () => {
    set((state) => ({ recommendationsOpen: !state.recommendationsOpen }));
  },

  toggleVisualization: () => {
    set((state) => ({ isVisualizationEnabled: !state.isVisualizationEnabled }));
  },

  toggleLeftSidebar: () => {
    set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen }));
  },

  toggleRightSidebar: () => {
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }));
  },

  toggleMetadataPanel: () => {
    set((state) => ({ isMetadataPanelOpen: !state.isMetadataPanelOpen }));
  },

  setPlayerExpanded: (expanded: boolean) => {
    set({ isPlayerExpanded: expanded });
  },

  setQueueOpen: (open: boolean) => {
    set({ 
      isQueueOpen: open,
      isRightSidebarOpen: open,
    });
  },

  setQueueExpanded: (expanded: boolean) => {
    set({ isQueueExpanded: expanded });
  },

  setLyricsOpen: (open: boolean) => {
    set({ lyricsOpen: open });
  },

  setEQOpen: (open: boolean) => {
    set({ eqOpen: open });
  },

  setRecommendationsOpen: (open: boolean) => {
    set({ recommendationsOpen: open });
  },

  setMetadataPanelOpen: (open: boolean) => {
    set({ isMetadataPanelOpen: open });
  },

  setVisualizationEnabled: (enabled: boolean) => {
    set({ isVisualizationEnabled: enabled });
  },

  setLeftSidebarWidth: (width: number) => {
    set({ leftSidebarWidth: width });
  },

  setRightSidebarWidth: (width: number) => {
    set({ rightSidebarWidth: width });
  },

  setLyricsSidebarWidth: (width: number) => {
    set({ lyricsSidebarWidth: width });
  },

  setEQSidebarWidth: (width: number) => {
    set({ eqSidebarWidth: width });
  },

  setRecommendationsSidebarWidth: (width: number) => {
    set({ recommendationsSidebarWidth: width });
  },
  setIsCramped: (isCramped: boolean) => {
    set({ isCramped });
  },

  closeLeftSidebarOnPlay: () => {
    set({ isLeftSidebarOpen: false });
  },
}));
