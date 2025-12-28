/**
 * Library Scanner
 * 
 * Scans directories for media files with change detection
 * 
 * Security: Hardened against path traversal, ReDoS, and infinite recursion
 */

import { isSupportedFormat } from '@sonantica/shared';
import type { Track } from '../types';
import { MetadataFactory } from './MetadataFactory';

/**
 * Security constants
 */
const MAX_PATH_LENGTH = 4096;
const MAX_FILENAME_LENGTH = 255;
const MAX_RECURSION_DEPTH = 50;
const MAX_FILES_PER_DIRECTORY = 10000;
const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB max HTML
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Security validator for library scanning
 */
class LibraryScannerSecurityValidator {
  /**
   * Validates a path for scanning
   * @throws {Error} If path is invalid or potentially malicious
   */
  static validatePath(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid path: Must be a non-empty string');
    }

    if (path.length > MAX_PATH_LENGTH) {
      throw new Error(`Path too long: ${path.length} characters (max: ${MAX_PATH_LENGTH})`);
    }

    // Validate URL
    try {
      const url = new URL(path, window.location.origin);
      
      if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
        throw new Error(`Invalid protocol: ${url.protocol}`);
      }

      // Prevent path traversal
      if (url.pathname.includes('..')) {
        throw new Error('Path traversal detected: ".." not allowed');
      }

      // Prevent null bytes
      if (path.includes('\0')) {
        throw new Error('Null byte detected in path');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Malformed path: ${path}`);
      }
      throw error;
    }
  }

  /**
   * Validates filename
   * @throws {Error} If filename is invalid
   */
  static validateFilename(filename: string): void {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename: Must be a non-empty string');
    }

    if (filename.length > MAX_FILENAME_LENGTH) {
      throw new Error(`Filename too long: ${filename.length} characters`);
    }

    // Prevent path traversal in filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename: Path separators not allowed');
    }

    // Prevent null bytes
    if (filename.includes('\0')) {
      throw new Error('Null byte detected in filename');
    }
  }

  /**
   * Validates recursion depth
   * @throws {Error} If depth exceeds maximum
   */
  static validateRecursionDepth(depth: number): void {
    if (depth > MAX_RECURSION_DEPTH) {
      throw new Error(`Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded`);
    }
  }

  /**
   * Validates file list size
   * @throws {Error} If file list is too large
   */
  static validateFileListSize(fileCount: number): void {
    if (fileCount > MAX_FILES_PER_DIRECTORY) {
      throw new Error(`Too many files in directory: ${fileCount} (max: ${MAX_FILES_PER_DIRECTORY})`);
    }
  }

  /**
   * Validates HTML size
   * @throws {Error} If HTML is too large
   */
  static validateHtmlSize(html: string): void {
    if (html.length > MAX_HTML_SIZE) {
      throw new Error(`HTML too large: ${html.length} bytes (max: ${MAX_HTML_SIZE})`);
    }
  }

  /**
   * Sanitizes href from HTML
   */
  static sanitizeHref(href: string): string {
    // Decode URI component safely
    try {
      return decodeURIComponent(href);
    } catch (error) {
      // If decoding fails, return original (will be validated later)
      return href;
    }
  }
}

export interface ScannerCallbacks {
  shouldCancel: () => boolean;
  getExistingTrack: (path: string) => Track | undefined;
  onTrackFound: (track: Track) => void;
  onTrackUnchanged: (filename: string) => void;
  onProgress: (filename: string) => void;
}

export class LibraryScanner {
  private metadataFactory: MetadataFactory;
  private recursionDepth: number = 0;

  constructor(metadataFactory: MetadataFactory) {
    this.metadataFactory = metadataFactory;
  }

  /**
   * Scan for media files
   * @param paths - Array of paths to scan
   * @param scannedPaths - Set to track scanned paths
   * @param callbacks - Callbacks for scan events
   * @param parallel - Whether to scan paths in parallel (default: false)
   */
  async scanPaths(
    paths: string[], 
    scannedPaths: Set<string>, 
    callbacks: ScannerCallbacks,
    parallel: boolean = false
  ): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(paths)) {
        throw new Error('Invalid paths: Must be an array');
      }

      if (paths.length === 0) {
        console.warn('No paths to scan');
        return;
      }

      if (paths.length > 100) {
        console.warn(`Large number of paths to scan: ${paths.length}`);
      }

      if (parallel) {
        console.log(`🚀 Parallel scan mode: ${paths.length} paths with max 3 concurrent`);
        await this.scanPathsParallel(paths, scannedPaths, callbacks);
      } else {
        console.log(`📂 Sequential scan mode: ${paths.length} paths`);
        await this.scanPathsSequential(paths, scannedPaths, callbacks);
      }
    } catch (error) {
      console.error('Scan paths failed:', error);
      throw error;
    }
  }

  /**
   * Scan paths sequentially (one at a time)
   * @private
   */
  private async scanPathsSequential(
    paths: string[], 
    scannedPaths: Set<string>, 
    callbacks: ScannerCallbacks
  ): Promise<void> {
    for (const path of paths) {
      if (callbacks.shouldCancel()) {
        console.log('Scan cancelled by user');
        break;
      }

      try {
        LibraryScannerSecurityValidator.validatePath(path);
        this.recursionDepth = 0; // Reset depth for each root path
        await this.scanPathRecursive(path, scannedPaths, callbacks);
      } catch (error) {
        console.error(`Failed to scan path ${path}:`, error);
        // Continue with next path
      }
    }
  }

  /**
   * Scan paths in parallel with concurrency limit
   * @private
   */
  private async scanPathsParallel(
    paths: string[], 
    scannedPaths: Set<string>, 
    callbacks: ScannerCallbacks
  ): Promise<void> {
    const MAX_CONCURRENT = 3; // Limit concurrent scans to prevent resource exhaustion
    const results: Promise<void>[] = [];
    
    for (let i = 0; i < paths.length; i += MAX_CONCURRENT) {
      if (callbacks.shouldCancel()) {
        console.log('Scan cancelled by user');
        break;
      }

      // Process batch of paths
      const batch = paths.slice(i, i + MAX_CONCURRENT);
      const batchPromises = batch.map(async (path) => {
        if (callbacks.shouldCancel()) {
          return;
        }

        try {
          LibraryScannerSecurityValidator.validatePath(path);
          this.recursionDepth = 0; // Reset depth for each root path
          await this.scanPathRecursive(path, scannedPaths, callbacks);
        } catch (error) {
          console.error(`Failed to scan path ${path}:`, error);
          // Continue with next path
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }
  }

  /**
   * Recursively scan a path
   * @private
   */
  private async scanPathRecursive(
    path: string, 
    scannedPaths: Set<string>, 
    callbacks: ScannerCallbacks
  ): Promise<void> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

    try {
      // Check recursion depth
      this.recursionDepth++;
      LibraryScannerSecurityValidator.validateRecursionDepth(this.recursionDepth);

      // Validate path
      LibraryScannerSecurityValidator.validatePath(path);

      const response = await fetch(path, {
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');

      // Check if it's JSON (nginx autoindex with autoindex_format json)
      if (contentType?.includes('application/json')) {
        const files = await response.json();
        
        // Validate it's an array
        if (!Array.isArray(files)) {
          throw new Error('Invalid JSON response: Expected array');
        }

        await this.processFileListRecursive(files, path, scannedPaths, callbacks);
      } else {
        // Fallback: try to parse HTML directory listing
        const html = await response.text();
        LibraryScannerSecurityValidator.validateHtmlSize(html);
        await this.parseHtmlListingRecursive(html, path, scannedPaths, callbacks);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`Scan timeout for ${path}`);
        } else {
          console.error(`Error scanning ${path}:`, error.message);
        }
      } else {
        console.error(`Error scanning ${path}:`, error);
      }
    } finally {
      this.recursionDepth--;
    }
  }

  /**
   * Process file list from JSON response (recursive)
   * @private
   */
  private async processFileListRecursive(
    files: any[],
    basePath: string,
    scannedPaths: Set<string>,
    callbacks: ScannerCallbacks
  ): Promise<void> {
    try {
      // Validate file list size
      LibraryScannerSecurityValidator.validateFileListSize(files.length);

      let processedCount = 0;

      for (const file of files) {
        if (callbacks.shouldCancel()) {
          console.log('Scan cancelled during file processing');
          return;
        }

        // Validate file object
        if (!file || typeof file !== 'object') {
          console.warn('Invalid file object, skipping');
          continue;
        }

        processedCount++;

        if (file.type === 'file') {
          try {
            const filename = file.name;
            
            // Validate filename
            if (!filename || typeof filename !== 'string') {
              console.warn('Invalid filename, skipping');
              continue;
            }

            LibraryScannerSecurityValidator.validateFilename(filename);

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
              
              // Validate file size
              const fileSize = typeof file.size === 'number' && file.size >= 0 ? file.size : 0;
              const sizeChanged = existingTrack && existingTrack.size !== fileSize;
              
              if (!existingTrack || (fileModifiedTime > trackModifiedTime && fileModifiedTime > 0) || sizeChanged) {
                // New or modified track - add it
                const track = await this.metadataFactory.createTrack(basePath, filename, fileSize, file.mtime);
                callbacks.onTrackFound(track);
              } else {
                // Track exists and is unchanged
                callbacks.onTrackUnchanged(filename);
              }
            }
          } catch (fileError) {
            console.warn(`Error processing file ${file.name}:`, fileError);
            // Continue with next file
          }
        } else if (file.type === 'directory') {
          try {
            const dirname = file.name;
            
            // Validate directory name
            if (!dirname || typeof dirname !== 'string') {
              console.warn('Invalid directory name, skipping');
              continue;
            }

            LibraryScannerSecurityValidator.validateFilename(dirname);

            // Recursively scan subdirectories
            await this.scanPathRecursive(`${basePath}${dirname}/`, scannedPaths, callbacks);
          } catch (dirError) {
            console.warn(`Error processing directory ${file.name}:`, dirError);
            // Continue with next directory
          }
        }
      }

      console.log(`Processed ${processedCount} items in ${basePath}`);
    } catch (error) {
      console.error('Error processing file list:', error);
      throw error;
    }
  }

  /**
   * Parse HTML directory listing (fallback, recursive)
   * @private
   */
  private async parseHtmlListingRecursive(
    html: string,
    basePath: string,
    scannedPaths: Set<string>,
    callbacks: ScannerCallbacks
  ): Promise<void> {
    try {
      // Use a safer regex with limits to prevent ReDoS
      const linkRegex = /href="([^"]{1,2048})"/g;
      const matches = Array.from(html.matchAll(linkRegex));

      // Limit number of matches to prevent DoS
      if (matches.length > MAX_FILES_PER_DIRECTORY) {
        console.warn(`Too many links in HTML (${matches.length}), limiting to ${MAX_FILES_PER_DIRECTORY}`);
        matches.length = MAX_FILES_PER_DIRECTORY;
      }

      let processedCount = 0;

      for (const match of matches) {
        if (callbacks.shouldCancel()) {
          console.log('Scan cancelled during HTML parsing');
          return;
        }

        try {
          const href = LibraryScannerSecurityValidator.sanitizeHref(match[1]);

          // Skip parent directory and absolute URLs
          if (href === '../' || href.startsWith('http') || href.startsWith('/')) {
            continue;
          }

          // Additional validation
          if (href.includes('..') || href.includes('\0')) {
            console.warn(`Suspicious href detected: ${href}`);
            continue;
          }

          processedCount++;

          // Check if it's a directory
          if (href.endsWith('/')) {
            const dirname = href.slice(0, -1);
            LibraryScannerSecurityValidator.validateFilename(dirname);
            await this.scanPathRecursive(`${basePath}${href}`, scannedPaths, callbacks);
          } else {
            // Check if it's an audio file
            LibraryScannerSecurityValidator.validateFilename(href);
            
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
        } catch (hrefError) {
          console.warn(`Error processing href ${match[1]}:`, hrefError);
          // Continue with next link
        }
      }

      console.log(`Processed ${processedCount} links from HTML in ${basePath}`);
    } catch (error) {
      console.error('Error parsing HTML listing:', error);
      throw error;
    }
  }
}
