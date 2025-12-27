/**
 * Metadata Extractor
 * 
 * Lightweight ID3 tag reader for browser environments.
 * Supports MP3 (ID3v2), FLAC, and basic formats.
 * 
 * "Every file has an intention."
 * 
 * Security: Hardened against buffer overflows, DoS, and malformed files
 */

import type { MediaMetadata } from '@sonantica/shared';
import type { IMetadataParser } from './parsers/contracts';
import { ID3v2Parser } from './parsers/ID3v2Parser';
import { FLACParser } from './parsers/FLACParser';

/**
 * Security constants
 */
const MAX_FETCH_SIZE = 64 * 1024 * 1024; // 64MB max for HQ artwork and large FLAC files
const MIN_FETCH_SIZE = 128 * 1024; // 128KB minimum
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:'];

/**
 * Security validator for metadata extraction
 */
class MetadataSecurityValidator {
  /**
   * Validates a URL for metadata extraction
   * @throws {Error} If URL is invalid or potentially malicious
   */
  static validateURL(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: Must be a non-empty string');
    }

    if (url.length > 2048) {
      throw new Error('Invalid URL: Exceeds maximum length');
    }

    try {
      const urlObj = new URL(url, window.location.origin);
      
      if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        throw new Error(`Invalid URL protocol: ${urlObj.protocol}`);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Malformed URL: ${url}`);
      }
      throw error;
    }
  }

  /**
   * Validates fetch response
   * @throws {Error} If response is invalid
   */
  static validateResponse(response: Response): void {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FETCH_SIZE) {
        throw new Error(`File too large: ${size} bytes (max: ${MAX_FETCH_SIZE})`);
      }
    }
  }

  /**
   * Validates ArrayBuffer size
   * @throws {Error} If buffer is invalid or too large
   */
  static validateBuffer(buffer: ArrayBuffer): void {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new Error('Invalid buffer: Must be an ArrayBuffer');
    }

    if (buffer.byteLength === 0) {
      throw new Error('Invalid buffer: Empty buffer');
    }

    if (buffer.byteLength > MAX_FETCH_SIZE) {
      throw new Error(`Buffer too large: ${buffer.byteLength} bytes`);
    }
  }
}

// Register parsers
const parsers: IMetadataParser[] = [
  new ID3v2Parser(),
  new FLACParser(),
];

/**
 * Extract metadata from an audio file URL
 * @param url - URL of the audio file
 * @returns Partial metadata object
 * @throws {Error} If URL is invalid or extraction fails critically
 */
export async function extractMetadata(url: string): Promise<Partial<MediaMetadata>> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

  try {
    // Validate URL
    MetadataSecurityValidator.validateURL(url);

    // Fetch the file with range request (first 16MB for HQ artwork support)
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=0-${MAX_FETCH_SIZE - 1}`,
      },
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    // Validate response
    MetadataSecurityValidator.validateResponse(response);

    const buffer = await response.arrayBuffer();
    
    // Validate buffer
    MetadataSecurityValidator.validateBuffer(buffer);

    const view = new DataView(buffer);

    const filename = url.split('/').pop() || 'unknown';
    console.log(`📊 Metadata extraction for ${filename}: ${buffer.byteLength} bytes`);

    // Detect format and extract metadata using strategies
    for (const parser of parsers) {
      try {
        if (parser.canParse(view)) {
          console.log(`✅ Parser found: ${parser.constructor.name}`);
          const metadata = await parser.parse(view);
          
          console.log('✅ Metadata extracted:', { 
            title: metadata.title, 
            artist: metadata.artist,
            hasArtwork: !!metadata.coverArt 
          });
          
          return metadata;
        }
      } catch (parserError) {
        console.warn(`⚠️ Parser ${parser.constructor.name} failed:`, parserError);
        // Continue to next parser
      }
    }

    // Fallback: return empty metadata
    console.warn('⚠️ Unknown format, no metadata extracted');
    return {};
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('❌ Metadata extraction timeout');
        throw new Error('Metadata extraction timeout');
      }
      console.warn('❌ Metadata extraction failed:', error.message);
    } else {
      console.warn('❌ Metadata extraction failed:', error);
    }
    
    // Return empty metadata on error (graceful degradation)
    return {};
  }
}

/**
 * PERFORMANCE: Extract metadata from multiple files with batching
 * Yields to main thread between batches to prevent UI freezing
 * 
 * @param urls - Array of file URLs
 * @param batchSize - Number of files to process before yielding (default: 5)
 * @param onProgress - Optional callback for progress updates
 * @returns Array of metadata objects (same order as input URLs)
 * 
 * Example:
 * const results = await extractMetadataBatch(fileUrls, 5, (current, total) => {
 *   console.log(`Processing ${current}/${total}`);
 * });
 */
export async function extractMetadataBatch(
  urls: string[],
  batchSize: number = 5,
  onProgress?: (current: number, total: number) => void
): Promise<Array<Partial<MediaMetadata>>> {
  const results: Array<Partial<MediaMetadata>> = [];
  const total = urls.length;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    // Process batch in parallel (up to batchSize concurrent requests)
    const batchResults = await Promise.all(
      batch.map(url => extractMetadata(url).catch(err => {
        console.warn(`Failed to extract metadata for ${url}:`, err);
        return {}; // Return empty metadata on error
      }))
    );
    
    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }

    // Yield to main thread between batches (React Native compatible)
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}
