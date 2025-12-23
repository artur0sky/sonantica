/**
 * Metadata Extractor
 * 
 * Lightweight ID3 tag reader for browser environments.
 * Supports MP3 (ID3v2), FLAC, and basic formats.
 */

import type { MediaMetadata } from '@sonantica/shared';

/**
 * Extract metadata from an audio file URL
 */
export async function extractMetadata(url: string): Promise<Partial<MediaMetadata>> {
  try {
    // Fetch the file with range request (first 256KB should contain metadata)
    const response = await fetch(url, {
      headers: {
        'Range': 'bytes=0-262143', // First 256KB
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);

    // Detect format and extract metadata
    if (isID3v2(view)) {
      return extractID3v2(view);
    } else if (isFLAC(view)) {
      return extractFLAC(view);
    }

    // Fallback: return empty metadata
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
        case 'TPE1': metadata.artist = text; break;
        case 'TALB': metadata.album = text; break;
        case 'TYER': 
        case 'TDRC': metadata.year = parseInt(text) || undefined; break;
        case 'TRCK': metadata.trackNumber = parseInt(text.split('/')[0]) || undefined; break;
        case 'TCON': metadata.genre = text; break;
        case 'APIC': 
          // Album art
          metadata.coverArt = extractAPIC(frameData);
          break;
      }

      offset += 10 + frameSize;
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
            case 'ARTIST': metadata.artist = value; break;
            case 'ALBUM': metadata.album = value; break;
            case 'DATE': metadata.year = parseInt(value) || undefined; break;
            case 'TRACKNUMBER': metadata.trackNumber = parseInt(value) || undefined; break;
            case 'GENRE': metadata.genre = value; break;
          }

          offset += commentLength;
        }
      } else {
        offset += blockSize;
      }

      if (isLast) break;
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
    
    // Detect MIME type from magic bytes
    let mimeType = 'image/jpeg'; // Default
    if (imageData[0] === 0x89 && imageData[1] === 0x50) {
      mimeType = 'image/png';
    }

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...Array.from(imageData)));
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn('APIC extraction failed:', error);
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
