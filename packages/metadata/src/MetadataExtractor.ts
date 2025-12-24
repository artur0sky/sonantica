/**
 * Metadata Extractor
 * 
 * Lightweight ID3 tag reader for browser environments.
 * Supports MP3 (ID3v2), FLAC, and basic formats.
 * 
 * "Every file has an intention."
 */

import type { MediaMetadata, Lyrics } from '@sonantica/shared';
import { LyricsExtractor } from '@sonantica/lyrics';

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

    // Detect format and extract metadata
    if (isID3v2(view)) {
      const metadata = extractID3v2(view);
      console.log('✅ ID3v2 metadata extracted:', { 
        title: metadata.title, 
        artist: metadata.artist,
        hasArtwork: !!metadata.coverArt 
      });
      return metadata;
    } else if (isFLAC(view)) {
      return extractFLAC(view);
    }

    // Fallback: return empty metadata
    console.warn('⚠️ Unknown format, no metadata extracted');
    return {};
  } catch (error) {
    console.warn('Metadata extraction failed:', error);
    return {};
  }
}

/**
 * Check if buffer starts with ID3v2 tag
 */
function isID3v2(view: DataView): boolean {
  return view.byteLength >= 3 &&
         view.getUint8(0) === 0x49 && // 'I'
         view.getUint8(1) === 0x44 && // 'D'
         view.getUint8(2) === 0x33;   // '3'
}

/**
 * Check if buffer starts with FLAC marker
 */
function isFLAC(view: DataView): boolean {
  return view.byteLength >= 4 &&
         view.getUint8(0) === 0x66 && // 'f'
         view.getUint8(1) === 0x4C && // 'L'
         view.getUint8(2) === 0x61 && // 'a'
         view.getUint8(3) === 0x43;   // 'C'
}

/**
 * Extract ID3v2 metadata
 */
function extractID3v2(view: DataView): Partial<MediaMetadata> {
  const metadata: Partial<MediaMetadata> = {};
  const tags: any = {}; // Collect all tags for lyrics extraction

  try {
    // ID3v2 header: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes)
    const version = view.getUint8(3);
    const flags = view.getUint8(5);
    
    // Size is stored as synchsafe integer (7 bits per byte)
    const size = 
      (view.getUint8(6) << 21) |
      (view.getUint8(7) << 14) |
      (view.getUint8(8) << 7) |
      view.getUint8(9);

    let offset = 10;

    // Skip extended header if present
    if (flags & 0x40) {
      const extSize = 
        (view.getUint8(offset) << 21) |
        (view.getUint8(offset + 1) << 14) |
        (view.getUint8(offset + 2) << 7) |
        view.getUint8(offset + 3);
      offset += extSize + 4;
    }

    // Parse frames
    while (offset < size + 10 && offset < view.byteLength - 10) {
      // Frame header: ID (4 bytes) + size (4 bytes) + flags (2 bytes)
      const frameId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );

      if (frameId === '\0\0\0\0') break; // Padding

      let frameSize: number;
      if (version === 4) {
        // ID3v2.4: synchsafe integer
        frameSize =
          (view.getUint8(offset + 4) << 21) |
          (view.getUint8(offset + 5) << 14) |
          (view.getUint8(offset + 6) << 7) |
          view.getUint8(offset + 7);
      } else {
        // ID3v2.3: regular integer
        frameSize =
          (view.getUint8(offset + 4) << 24) |
          (view.getUint8(offset + 5) << 16) |
          (view.getUint8(offset + 6) << 8) |
          view.getUint8(offset + 7);
      }

      if (frameSize === 0 || offset + 10 + frameSize > view.byteLength) break;

      const frameData = new Uint8Array(view.buffer, offset + 10, frameSize);
      
      // Extract text from frame (skip encoding byte)
      const text = decodeText(frameData.slice(1));

      // Map frame IDs to metadata
      switch (frameId) {
        case 'TIT2': metadata.title = text; break;
        case 'TPE1': 
          // Support multiple artists (separated by ; / feat. & etc.)
          metadata.artist = parseMultipleValues(text);
          break;
        case 'TPE2': 
          // Album artist
          metadata.albumArtist = text;
          break;
        case 'TALB': metadata.album = text; break;
        case 'TYER': 
        case 'TDRC': metadata.year = parseInt(text) || undefined; break;
        case 'TRCK': metadata.trackNumber = parseInt(text.split('/')[0]) || undefined; break;
        case 'TCON': 
          // Support multiple genres
          metadata.genre = parseMultipleValues(text);
          break;
        case 'APIC': 
          // Album art
          const artUrl = extractAPIC(frameData);
          if (artUrl) {
            metadata.coverArt = artUrl;
            console.log('✅ Album art extracted successfully');
          }
          break;
        case 'USLT':
          // Unsynchronized lyrics
          tags.USLT = { data: { text } };
          break;
        case 'SYLT':
          // Synchronized lyrics
          tags.SYLT = { data: text };
          break;
      }

      offset += 10 + frameSize;
    }

    // Extract lyrics using LyricsExtractor
    console.log('🔍 Checking for lyrics tags:', Object.keys(tags));
    const lyrics = LyricsExtractor.extractFromTags(tags);
    if (lyrics) {
      metadata.lyrics = lyrics;
      console.log(`✅ Lyrics extracted from ID3v2:`, {
        type: lyrics.isSynchronized ? 'synchronized' : 'unsynchronized',
        hasText: !!lyrics.text,
        hasSynced: !!lyrics.synced,
        lines: lyrics.synced?.length || 0,
        source: lyrics.source
      });
    } else {
      console.log('ℹ️ No lyrics found in ID3v2 tags');
    }
  } catch (error) {
    console.warn('ID3v2 parsing error:', error);
  }

  return metadata;
}

/**
 * Extract FLAC metadata (basic Vorbis comments)
 */
function extractFLAC(view: DataView): Partial<MediaMetadata> {
  const metadata: Partial<MediaMetadata> = {};
  const tags: any = {}; // Collect all tags for lyrics extraction

  try {
    let offset = 4; // Skip "fLaC"

    // Read metadata blocks
    while (offset < view.byteLength) {
      const blockHeader = view.getUint8(offset);
      const isLast = (blockHeader & 0x80) !== 0;
      const blockType = blockHeader & 0x7F;
      
      const blockSize =
        (view.getUint8(offset + 1) << 16) |
        (view.getUint8(offset + 2) << 8) |
        view.getUint8(offset + 3);

      offset += 4;

      // STREAMINFO block (type 0) - contains audio specs and duration
      if (blockType === 0 && blockSize >= 34) {
        // Sample rate (20 bits, starting at bit 80)
        // In StreamInfo: 
        // offset 10-12 (3 bytes) contain sample rate, channels, bits per sample
        const b10_12 = (view.getUint8(offset + 10) << 16) | (view.getUint8(offset + 11) << 8) | view.getUint8(offset + 12);
        const sampleRate = b10_12 >> 4;
        const channels = ((b10_12 >> 1) & 0x07) + 1;
        const bitsPerSample = ((view.getUint8(offset + 12) & 0x01) << 4) | (view.getUint8(offset + 13) >> 4) + 1;
        
        // Total samples (36 bits, starting at bit 138)
        // offset 13-17
        const b13_17_high = view.getUint8(offset + 13) & 0x0F;
        const b14 = view.getUint8(offset + 14);
        const b15 = view.getUint8(offset + 15);
        const b16 = view.getUint8(offset + 16);
        const b17 = view.getUint8(offset + 17);
        
        const totalSamples = (b13_17_high * Math.pow(2, 32)) + (b14 << 24 | b15 << 16 | b16 << 8 | b17);

        metadata.sampleRate = sampleRate;
        metadata.bitsPerSample = bitsPerSample;
        
        if (sampleRate > 0) {
          metadata.duration = totalSamples / sampleRate;
          
          // Estimate bitrate (very rough for FLAC, it's variable)
          // Average Bitrate = (File Size * 8) / Duration
          // But we don't have total file size easily here if it's a stream, 
          // though we might have it from the fetch.
          // For now, let's just use the duration.
        }
      }

      // Vorbis comment block (type 4)
      if (blockType === 4) {
        // Parse Vorbis comments
        const vendorLength = view.getUint32(offset, true);
        offset += 4 + vendorLength;

        const commentCount = view.getUint32(offset, true);
        offset += 4;

        for (let i = 0; i < commentCount && offset < view.byteLength; i++) {
          const commentLength = view.getUint32(offset, true);
          offset += 4;

          if (offset + commentLength > view.byteLength) break;

          const comment = decodeText(new Uint8Array(view.buffer, offset, commentLength));
          const [key, value] = comment.split('=');

          switch (key.toUpperCase()) {
            case 'TITLE': metadata.title = value; break;
            case 'ARTIST': 
              metadata.artist = parseMultipleValues(value);
              break;
            case 'ALBUMARTIST': 
              metadata.albumArtist = value;
              break;
            case 'ALBUM': metadata.album = value; break;
            case 'DATE': metadata.year = parseInt(value) || undefined; break;
            case 'TRACKNUMBER': metadata.trackNumber = parseInt(value) || undefined; break;
            case 'GENRE': 
              metadata.genre = parseMultipleValues(value);
              break;
            case 'LYRICS':
            case 'UNSYNCEDLYRICS':
              tags.LYRICS = value;
              break;
            case 'SYNCEDLYRICS':
              tags.SYNCEDLYRICS = value;
              break;
          }

          offset += commentLength;
        }
      } 
      // PICTURE block (type 6) - Album art
      else if (blockType === 6) {
        try {
          // Check if the entire block is within our buffer
          const availableBytes = view.byteLength - offset;
          if (blockSize > availableBytes) {
            console.warn(`⚠️ FLAC PICTURE block (${blockSize} bytes) extends beyond buffer (${availableBytes} bytes available). Skipping.`);
            offset += availableBytes; // Skip what we can
            break; // Stop processing blocks
          }
          
          const pictureData = new Uint8Array(view.buffer, view.byteOffset + offset, blockSize);
          const artUrl = extractFLACPicture(pictureData);
          if (artUrl) {
            metadata.coverArt = artUrl;
            console.log('✅ FLAC album art extracted successfully');
          }
        } catch (error) {
          console.warn('⚠️ FLAC picture extraction failed:', error);
        }
        offset += blockSize;
      } 
      else {
        offset += blockSize;
      }

      if (isLast) break;
    }

    // Extract lyrics using LyricsExtractor
    console.log('🔍 Checking for FLAC lyrics tags:', Object.keys(tags));
    const lyrics = LyricsExtractor.extractFromTags(tags);
    if (lyrics) {
      metadata.lyrics = lyrics;
      console.log(`✅ Lyrics extracted from FLAC:`, {
        type: lyrics.isSynchronized ? 'synchronized' : 'unsynchronized',
        hasText: !!lyrics.text,
        hasSynced: !!lyrics.synced,
        lines: lyrics.synced?.length || 0,
        source: lyrics.source
      });
    } else {
      console.log('ℹ️ No lyrics found in FLAC tags');
    }
  } catch (error) {
    console.warn('FLAC parsing error:', error);
  }

  return metadata;
}

/**
 * Extract APIC (Attached Picture) frame
 */
function extractAPIC(data: Uint8Array): string | undefined {
  try {
    let offset = 1; // Skip encoding

    // Skip MIME type (null-terminated)
    while (offset < data.length && data[offset] !== 0) offset++;
    offset++; // Skip null

    // Skip picture type (1 byte)
    offset++;

    // Skip description (null-terminated)
    while (offset < data.length && data[offset] !== 0) offset++;
    offset++; // Skip null

    // Remaining data is the image
    const imageData = data.slice(offset);
    
    if (imageData.length === 0) {
      console.warn('⚠️ APIC frame has no image data');
      return undefined;
    }

    console.log(`🖼️ Extracting artwork: ${imageData.length} bytes`);
    
    // Detect MIME type from magic bytes
    let mimeType = 'image/jpeg'; // Default
    if (imageData[0] === 0x89 && imageData[1] === 0x50) {
      mimeType = 'image/png';
    } else if (imageData[0] === 0xFF && imageData[1] === 0xD8) {
      mimeType = 'image/jpeg';
    }

    // Convert to base64 using a more robust method
    let binary = '';
    const len = imageData.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(imageData[i]);
    }
    const base64 = btoa(binary);
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log(`✅ Artwork extracted: ${mimeType}, ${dataUrl.length} chars`);
    
    return dataUrl;
  } catch (error) {
    console.warn('APIC extraction failed:', error);
    return undefined;
  }
}

/**
 * Extract FLAC PICTURE block
 * Format: https://xiph.org/flac/format.html#metadata_block_picture
 */
function extractFLACPicture(data: Uint8Array): string | undefined {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;

    // Picture type (4 bytes, big-endian)
    const pictureType = view.getUint32(offset, false);
    offset += 4;

    // MIME type length (4 bytes, big-endian)
    const mimeLength = view.getUint32(offset, false);
    offset += 4;

    // MIME type string
    const mimeBytes = data.slice(offset, offset + mimeLength);
    const mimeType = decodeText(mimeBytes);
    offset += mimeLength;

    // Description length (4 bytes, big-endian)
    const descLength = view.getUint32(offset, false);
    offset += 4;

    // Skip description
    offset += descLength;

    // Width, height, depth, colors (4 bytes each)
    offset += 16;

    // Picture data length (4 bytes, big-endian)
    const dataLength = view.getUint32(offset, false);
    offset += 4;

    // Picture data
    const imageData = data.slice(offset, offset + dataLength);

    if (imageData.length === 0) {
      console.warn('⚠️ FLAC PICTURE block has no image data');
      return undefined;
    }

    console.log(`🖼️ Extracting FLAC artwork: ${imageData.length} bytes, type: ${mimeType}`);

    // Convert to base64 using a more robust method
    let binary = '';
    const len = imageData.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(imageData[i]);
    }
    const base64 = btoa(binary);
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log(`✅ FLAC artwork extracted: ${mimeType}, ${dataUrl.length} chars`);
    console.log(`🔍 Data URL preview: ${dataUrl.substring(0, 100)}...`);
    
    // Validate Data URL format
    if (!dataUrl.startsWith('data:')) {
      console.error('❌ Invalid Data URL format');
      return undefined;
    }
    
    return dataUrl;
  } catch (error) {
    console.warn('FLAC PICTURE extraction failed:', error);
    return undefined;
  }
}

/**
 * Decode text from bytes (supports ISO-8859-1 and UTF-8)
 */
function decodeText(bytes: Uint8Array): string {
  try {
    // Try UTF-8 first
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    // Fallback to ISO-8859-1
    return new TextDecoder('iso-8859-1').decode(bytes);
  }
}

/**
 * Parse multiple values from a string (artists, genres, etc.)
 * Supports separators: ; / feat. ft. & and
 */
function parseMultipleValues(text: string): string | string[] {
  if (!text) return text;
  
  // Common separators for multiple values
  const separators = /[;/]|\s+(?:feat\.?|ft\.?|&|and)\s+/gi;
  
  const values = text
    .split(separators)
    .map(v => v.trim())
    .filter(v => v.length > 0);
  
  // Return single string if only one value, array if multiple
  return values.length === 1 ? values[0] : values;
}
