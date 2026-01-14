/**
 * Selection Store
 * 
 * Manages multi-selection state for batch operations on library items
 */

import { create } from 'zustand';

export type SelectableItemType = 'track' | 'album' | 'artist' | 'playlist';

interface SelectionState {
  // Selection mode
  isSelectionMode: boolean;
  itemType: SelectableItemType | null;
  
  // Selected items
  selectedIds: Set<string>;
  
  // Actions
  enterSelectionMode: (type: SelectableItemType, initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  isSelectionMode: false,
  itemType: null,
  selectedIds: new Set(),

  enterSelectionMode: (type, initialId) => {
    const newSelection = new Set<string>();
    if (initialId) {
      newSelection.add(initialId);
    }
    set({
      isSelectionMode: true,
      itemType: type,
      selectedIds: newSelection,
    });
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      itemType: null,
      selectedIds: new Set(),
    });
  },

  toggleSelection: (id) => {
    const { selectedIds } = get();
    const newSelection = new Set(selectedIds);
    
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    
    set({ selectedIds: newSelection });
    
    // Auto-exit if no items selected
    if (newSelection.size === 0) {
      get().exitSelectionMode();
    }
  },

  selectAll: (ids) => {
    set({ selectedIds: new Set(ids) });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  isSelected: (id) => {
    return get().selectedIds.has(id);
  },
}));
