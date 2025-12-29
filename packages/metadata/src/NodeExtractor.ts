/**
 * Node.js File System Metadata Extractor
 * 
 * Server-side adapter for extracting metadata from local files.
 * Uses the same contracts as the browser version but with Node.js APIs.
 */

import { promises as fs } from 'fs';
import type { MediaMetadata } from '@sonantica/shared';

// Import parsers (we'll reuse the browser parsers since they work with DataView)
import type { IMetadataParser } from './parsers/contracts';
import { ID3v2Parser } from './parsers/ID3v2Parser';
import { FLACParser } from './parsers/FLACParser';

const MAX_READ_SIZE = 64 * 1024 * 1024; // 64MB max
const parsers: IMetadataParser[] = [
  new ID3v2Parser(),
  new FLACParser(),
];

/**
 * Extract metadata from a local file path (Node.js only)
 * @param filePath - Absolute path to the audio file
 * @returns Partial metadata object
 */
export async function extractMetadataFromFile(filePath: string): Promise<Partial<MediaMetadata>> {
  try {
    // Read file into buffer
    const buffer = await fs.readFile(filePath);
    
    if (buffer.byteLength > MAX_READ_SIZE) {
      console.warn(`File too large: ${filePath} (${buffer.byteLength} bytes)`);
      return {};
    }

    // Convert Node.js Buffer to ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    
    const view = new DataView(arrayBuffer);

    // Try each parser
    for (const parser of parsers) {
      try {
        if (parser.canParse(view)) {
          const metadata = await parser.parse(view);
          return metadata;
        }
      } catch (parserError) {
        console.warn(`Parser ${parser.constructor.name} failed:`, parserError);
      }
    }

    return {};
  } catch (error) {
    console.warn(`Failed to extract metadata from ${filePath}:`, error);
    return {};
  }
}

/**
 * Batch extract metadata from multiple files
 * @param filePaths - Array of file paths
 * @param onProgress - Optional progress callback
 * @returns Array of metadata objects
 */
export async function extractMetadataBatchFromFiles(
  filePaths: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Array<Partial<MediaMetadata>>> {
  const results: Array<Partial<MediaMetadata>> = [];
  const total = filePaths.length;

  for (let i = 0; i < filePaths.length; i++) {
    const metadata = await extractMetadataFromFile(filePaths[i]);
    results.push(metadata);

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}
