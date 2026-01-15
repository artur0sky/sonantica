/**
 * @sonantica/shared
 * 
 * Shared types, utilities, and constants ONLY.
 * NO state management - stores belong to their domain packages.
 * NO dependencies - this is the foundation layer.
 * 
 * Philosophy: "Sound is a form of language."
 * Architecture: shared ───▶ (nothing)
 */

// Core exports
export * from './types';
export type { AudioDevice, IFileEntry, IFileProvider } from './types/plugins';
export * from './constants';

export * from './utils/index';
export { isSmartTV } from './utils/common';
export * from './hooks/index';

// Additional utilities
export * from './utils/cn';
export * from './utils/metadata';
