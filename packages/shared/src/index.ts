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
export * from './constants';
export * from './utils';

// Additional utilities
export * from './utils/cn';
export * from './utils/metadata';
