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
  isVisualizationEnabled: boolean;
  
  // Sidebar state
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isMetadataPanelOpen: boolean;
  
  // Sidebar widths
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  
  // Actions
  togglePlayerExpanded: () => void;
  toggleQueue: () => void;
  toggleVisualization: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleMetadataPanel: () => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setMetadataPanelOpen: (open: boolean) => void;
  setVisualizationEnabled: (enabled: boolean) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPlayerExpanded: false,
  isQueueOpen: false,
  isVisualizationEnabled: false,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  isMetadataPanelOpen: false,
  leftSidebarWidth: 280,
  rightSidebarWidth: 320,

  togglePlayerExpanded: () => {
    set((state) => ({ isPlayerExpanded: !state.isPlayerExpanded }));
  },

  toggleQueue: () => {
    set((state) => ({ 
      isQueueOpen: !state.isQueueOpen,
      isRightSidebarOpen: !state.isQueueOpen, // Sync with sidebar
    }));
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
}));
