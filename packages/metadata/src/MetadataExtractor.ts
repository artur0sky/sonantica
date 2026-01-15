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
const DEFAULT_MAX_FETCH_SIZE = 64 * 1024 * 1024; // 64MB max for HQ artwork and large FLAC files
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:', 'asset:'];

export interface MetadataOptions {
  maxFileSize?: number; // 0 or undefined for default limit, -1 for unlimited
  coverArtSizeLimit?: number; // Not yet implemented in parsers, but passed for future
}

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
  static validateResponse(response: Response, maxSize: number): void {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && maxSize > 0) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        throw new Error(`File too large: ${size} bytes (max: ${maxSize})`);
      }
    }
  }

  /**
   * Validates ArrayBuffer size
   * @throws {Error} If buffer is invalid or too large
   */
  static validateBuffer(buffer: ArrayBuffer, maxSize: number): void {
    if (!buffer || !(buffer instanceof ArrayBuffer)) {
      throw new Error('Invalid buffer: Must be an ArrayBuffer');
    }

    if (buffer.byteLength === 0) {
      throw new Error('Invalid buffer: Empty buffer');
    }

    if (maxSize > 0 && buffer.byteLength > maxSize) {
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
 * @param options - Configuration options
 * @returns Partial metadata object
 * @throws {Error} If URL is invalid or extraction fails critically
 */
export async function extractMetadata(url: string, options: MetadataOptions = {}): Promise<Partial<MediaMetadata>> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
  
  // Determine max size (use default if not specified, -1 or 0 -> Unlimited logic handled inside validator)
  // Actually, let's normalize options.maxFileSize
  // If undefined: use DEFAULT
  // If 0 or -1: use Infinity (Unlimited)
  // Else: use provided value
  let maxFetchSize = DEFAULT_MAX_FETCH_SIZE;
  if (options.maxFileSize !== undefined) {
    maxFetchSize = (options.maxFileSize <= 0) ? Number.MAX_SAFE_INTEGER : options.maxFileSize;
  }

  try {
    // Validate URL
    MetadataSecurityValidator.validateURL(url);

    // Fetch the file with range request (first chunk for HQ artwork support)
    // We request up to maxFetchSize. usage of range header depends on server support.
    const fetchHeaders: any = {};
    if (maxFetchSize < Number.MAX_SAFE_INTEGER) {
        fetchHeaders['Range'] = `bytes=0-${maxFetchSize - 1}`;
    } else {
        // If unlimited, we might still want to limit to a reasonable huge chunk or just get standard logic
        // But typically we still want a Range request to avoid downloading 100MB wav if we just need header.
        // However, user "unlimited" request implies we should try hard.
        // Let's keep range 0- to download everything if unlimited? or just skip Range and use standard fetch?
        // Standard fetch streams. We want arraybuffer.
        // Safest is to still use a large range if "unlimited" is requested for "size check", 
        // but for reading metadata typically we don't need the whole file unless it's at the end (ID3v1).
        // Let's stick to a very large range if unlimited.
        fetchHeaders['Range'] = 'bytes=0-';
    }

    let response = await fetch(url, {
      headers: fetchHeaders,
      signal: abortController.signal,
    });

    // Fallback for 416 Range Not Satisfiable (e.g. file smaller than requested range)
    if (response.status === 416) {
      console.warn('⚠️ 416 Range Not Satisfiable, retrying with open range bytes=0-');
      response = await fetch(url, {
        headers: {
          'Range': 'bytes=0-',
        },
        signal: abortController.signal,
      });
    }

    clearTimeout(timeoutId);

    // Validate response
    MetadataSecurityValidator.validateResponse(response, maxFetchSize);

    const buffer = await response.arrayBuffer();
    
    // Validate buffer
    MetadataSecurityValidator.validateBuffer(buffer, maxFetchSize);

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
 * @param options - Metadata extraction options
 * @returns Array of metadata objects (same order as input URLs)
 */
export async function extractMetadataBatch(
  urls: string[],
  batchSize: number = 5,
  onProgress?: (current: number, total: number) => void,
  options: MetadataOptions = {}
): Promise<Array<Partial<MediaMetadata>>> {
  const results: Array<Partial<MediaMetadata>> = [];
  const total = urls.length;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    // Process batch in parallel (up to batchSize concurrent requests)
    const batchResults = await Promise.all(
      batch.map(url => extractMetadata(url, options).catch(err => {
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
