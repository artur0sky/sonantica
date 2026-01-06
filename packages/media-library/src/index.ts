/**
 * @sonantica/media-library
 * 
 * Media library management for server-based architecture.
 * 
 * "Every file has an intention."
 */

export * from './types';
export * from './stores/libraryStore';
export * from './contracts';

// Adapters
export { RemoteLibraryAdapter } from './adapters/RemoteLibraryAdapter';
export type { RemoteLibraryConfig } from './adapters/RemoteLibraryAdapter';

// Contracts
export type { ILibraryAdapter, LibraryStats, ScanProgress } from './contracts/ILibraryAdapter';

