import { isSupportedFormat } from '@sonantica/shared';
import type { Track } from '../types';
import { MetadataFactory } from './MetadataFactory';

export interface ScannerCallbacks {
  shouldCancel: () => boolean;
  getExistingTrack: (path: string) => Track | undefined;
  onTrackFound: (track: Track) => void;
  onTrackUnchanged: (filename: string) => void;
  onProgress: (filename: string) => void;
}

export class LibraryScanner {
  private metadataFactory: MetadataFactory;

  constructor(metadataFactory: MetadataFactory) {
    this.metadataFactory = metadataFactory;
  }

  /**
   * Scan for media files
   */
  async scanPaths(paths: string[], scannedPaths: Set<string>, callbacks: ScannerCallbacks): Promise<void> {
    for (const path of paths) {
      if (callbacks.shouldCancel()) break;
      await this.scanPathRecursive(path, scannedPaths, callbacks);
    }
  }

  /**
   * Recursively scan a path
   */
  private async scanPathRecursive(
    path: string, 
    scannedPaths: Set<string>, 
    callbacks: ScannerCallbacks
  ): Promise<void> {
    try {
      const response = await fetch(path);

      if (!response.ok) {
        console.warn(`Failed to fetch ${path}: ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');

      // Check if it's JSON (nginx autoindex with autoindex_format json)
      if (contentType?.includes('application/json')) {
        const files = await response.json();
        await this.processFileListRecursive(files, path, scannedPaths, callbacks);
      } else {
        // Fallback: try to parse HTML directory listing
        const html = await response.text();
        await this.parseHtmlListingRecursive(html, path, scannedPaths, callbacks);
      }
    } catch (error) {
      console.error(`Error scanning ${path}:`, error);
    }
  }

  /**
   * Process file list from JSON response (recursive)
   */
  private async processFileListRecursive(
    files: any[],
    basePath: string,
    scannedPaths: Set<string>,
    callbacks: ScannerCallbacks
  ): Promise<void> {
    for (const file of files) {
      if (callbacks.shouldCancel()) return;
      if (file.type === 'file') {
        const filename = file.name;
        const fullPath = `${basePath}${filename}`;
        const ext = filename.split('.').pop()?.toLowerCase();
        
        // Use factory for mime type check
        const mimeType = this.metadataFactory.getMimeType(ext || '');
        if (mimeType && isSupportedFormat(mimeType)) {
          scannedPaths.add(fullPath);

          // Check if track already exists
          const existingTrack = callbacks.getExistingTrack(fullPath);
          
          // Basic change detection using mtime and size
          const fileModifiedTime = file.mtime ? new Date(file.mtime).getTime() : 0;
          const trackModifiedTime = existingTrack?.lastModified ? new Date(existingTrack.lastModified).getTime() : 0;
          const sizeChanged = existingTrack && existingTrack.size !== (file.size || 0);
          
          if (!existingTrack || (fileModifiedTime > trackModifiedTime && fileModifiedTime > 0) || sizeChanged) {
            // New or modified track - add it
            const track = await this.metadataFactory.createTrack(basePath, filename, file.size || 0, file.mtime);
            callbacks.onTrackFound(track);
          } else {
            // Track exists and is unchanged
            callbacks.onTrackUnchanged(filename);
          }
        }
      } else if (file.type === 'directory') {
        // Recursively scan subdirectories
        await this.scanPathRecursive(`${basePath}${file.name}/`, scannedPaths, callbacks);
      }
    }
  }

  /**
   * Parse HTML directory listing (fallback, recursive)
   */
  private async parseHtmlListingRecursive(
    html: string,
    basePath: string,
    scannedPaths: Set<string>,
    callbacks: ScannerCallbacks
  ): Promise<void> {
    const linkRegex = /href="([^"]+)"/g;
    const matches = html.matchAll(linkRegex);

    for (const match of matches) {
      if (callbacks.shouldCancel()) return;
      const href = match[1];

      // Skip parent directory and absolute URLs
      if (href === '../' || href.startsWith('http') || href.startsWith('/')) {
        continue;
      }

      // Check if it's a directory
      if (href.endsWith('/')) {
        await this.scanPathRecursive(`${basePath}${href}`, scannedPaths, callbacks);
      } else {
        // Check if it's an audio file
        const ext = href.split('.').pop()?.toLowerCase();
        const mimeType = this.metadataFactory.getMimeType(ext || '');

        if (mimeType && isSupportedFormat(mimeType)) {
          const fullPath = `${basePath}${href}`;
          scannedPaths.add(fullPath);

          const existingTrack = callbacks.getExistingTrack(fullPath);
          if (!existingTrack) {
            const track = await this.metadataFactory.createTrack(basePath, href, 0);
            callbacks.onTrackFound(track);
          } else {
            callbacks.onTrackUnchanged(href);
          }
        }
      }
    }
  }
}
