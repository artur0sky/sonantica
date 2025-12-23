/**
 * UI Store
 * 
 * Manages UI state (layout, player visibility, queue, etc.)
 */

import { create } from 'zustand';

interface UIState {
  // Player UI state
  isPlayerExpanded: boolean;
  isQueueOpen: boolean;
  
  // Sidebar state
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isMetadataPanelOpen: boolean;
  
  // Actions
  togglePlayerExpanded: () => void;
  toggleQueue: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleMetadataPanel: () => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setMetadataPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPlayerExpanded: false,
  isQueueOpen: false,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  isMetadataPanelOpen: false,

  togglePlayerExpanded: () => {
    set((state) => ({ isPlayerExpanded: !state.isPlayerExpanded }));
  },

  toggleQueue: () => {
    set((state) => ({ 
      isQueueOpen: !state.isQueueOpen,
      isRightSidebarOpen: !state.isQueueOpen, // Sync with sidebar
    }));
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

  setMetadataPanelOpen: (open: boolean) => {
    set({ isMetadataPanelOpen: open });
  },
}));
