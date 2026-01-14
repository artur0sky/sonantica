// Main entry point for @sonantica/ui package
// Shared UI components for Sonántica multimedia player

// Utils
export * from './utils';

// Atoms - Basic UI primitives
export * from './components/atoms';

// Molecules - Composite components
export * from './components/molecules';
export * from './components/molecules/PlaylistCard';
export { ConfirmDialog } from './components/molecules/ConfirmDialog';
export type { ConfirmDialogProps } from './components/molecules/ConfirmDialog';
export { PromptDialog } from './components/molecules/PromptDialog';
export type { PromptDialogProps } from './components/molecules/PromptDialog';

export * from "./components/organisms";

// Context Menu
export { ContextMenu, useContextMenu } from './components/ContextMenu';
export type { ContextMenuItem } from './components/ContextMenu';

// Stores
export { useUIStore } from './stores/uiStore';
export type { UIState } from './stores/uiStore';

// Hooks
export * from './hooks/useSpatialNavigation';
