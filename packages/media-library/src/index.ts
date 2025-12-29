/**
 * @sonantica/media-library
 * 
 * Media library indexing and metadata management.
 * 
 * "Every file has an intention."
 */

export * from './types';
export * from './MediaLibrary';
export * from './contracts';
export * from './stores/libraryStore';

// Folder Management
export * from './services/FolderManager';
export type { IFolderConfigStorage, IFolderValidator } from './services/FolderManager';

// Remote Adapter
export { RemoteLibraryAdapter } from './adapters/RemoteLibraryAdapter';
