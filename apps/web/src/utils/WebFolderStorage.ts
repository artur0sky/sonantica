/**
 * Web Platform Folder Storage Adapter
 * 
 * Implements folder configuration persistence using localStorage.
 */

import type { LibraryConfig } from '@sonantica/shared';
import type { IFolderConfigStorage } from '@sonantica/media-library';

const STORAGE_KEY = 'sonantica:library-config';

/**
 * LocalStorage-based folder configuration storage
 */
export class WebFolderStorage implements IFolderConfigStorage {
  async load(): Promise<LibraryConfig | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const config = JSON.parse(stored) as LibraryConfig;
      return config;
    } catch (error) {
      console.error('Failed to load folder configuration:', error);
      return null;
    }
  }

  async save(config: LibraryConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save folder configuration:', error);
      throw new Error('Failed to save configuration');
    }
  }
}
