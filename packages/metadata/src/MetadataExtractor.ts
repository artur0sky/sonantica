/**
 * Metadata Extractor
 * 
 * Lightweight ID3 tag reader for browser environments.
 * Supports MP3 (ID3v2), FLAC, and basic formats.
 * 
 * "Every file has an intention."
 */

import type { MediaMetadata } from '@sonantica/shared';
import type { IMetadataParser } from './parsers/contracts';
import { ID3v2Parser } from './parsers/ID3v2Parser';
import { FLACParser } from './parsers/FLACParser';

// Register parsers
const parsers: IMetadataParser[] = [
  new ID3v2Parser(),
  new FLACParser(),
];

/**
 * Extract metadata from an audio file URL
 */
export async function extractMetadata(url: string): Promise<Partial<MediaMetadata>> {
  try {
    // Fetch the file with range request (first 1MB for better artwork support)
    const response = await fetch(url, {
      headers: {
        'Range': 'bytes=0-16777215', // First 16MB to support HQ artwork (User requested no limits)
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);

    console.log(`📊 Metadata extraction for ${url.split('/').pop()}: ${buffer.byteLength} bytes`);

    // Detect format and extract metadata using strategies
    for (const parser of parsers) {
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
    }

    // Fallback: return empty metadata
    console.warn('⚠️ Unknown format, no metadata extracted');
    return {};
  } catch (error) {
    console.warn('Metadata extraction failed:', error);
    return {};
  }
}
