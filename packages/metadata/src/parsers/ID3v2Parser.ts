/**
 * ID3v2 Parser
 * 
 * Parses ID3v2 tags from MP3 files
 * Supports ID3v2.3 and ID3v2.4
 * 
 * Security: Hardened against buffer overflows and malformed tags
 */

import type { MediaMetadata } from '@sonantica/shared';
import { LyricsExtractor } from '@sonantica/lyrics';
import type { IMetadataParser } from './contracts';
import { decodeText, parseMultipleValues, bytesToDataUrl } from '../utils/metadataUtils';

/**
 * Security constants for ID3v2 parsing
 */
const MAX_FRAME_SIZE = 10 * 1024 * 1024; // 10MB max per frame
const MAX_TAG_SIZE = 16 * 1024 * 1024; // 16MB max total tag size
const MAX_FRAMES = 1000; // Maximum number of frames to parse
const SUPPORTED_VERSIONS = [3, 4]; // ID3v2.3 and ID3v2.4

/**
 * Security utilities for ID3v2 parsing
 */
class ID3v2SecurityValidator {
  /**
   * Validates DataView has minimum required size
   */
  static validateMinimumSize(view: DataView, required: number, context: string): void {
    if (view.byteLength < required) {
      throw new Error(`${context}: Insufficient data (need ${required} bytes, have ${view.byteLength})`);
    }
  }

  /**
   * Validates offset is within bounds
   */
  static validateOffset(offset: number, view: DataView, context: string): void {
    if (offset < 0 || offset >= view.byteLength) {
      throw new Error(`${context}: Offset ${offset} out of bounds (max: ${view.byteLength})`);
    }
  }

  /**
   * Validates frame size
   */
  static validateFrameSize(size: number, context: string): void {
    if (size < 0) {
      throw new Error(`${context}: Negative frame size: ${size}`);
    }
    if (size > MAX_FRAME_SIZE) {
      throw new Error(`${context}: Frame size ${size} exceeds maximum ${MAX_FRAME_SIZE}`);
    }
  }

  /**
   * Validates tag size
   */
  static validateTagSize(size: number): void {
    if (size < 0) {
      throw new Error('Invalid tag size: Negative value');
    }
    if (size > MAX_TAG_SIZE) {
      throw new Error(`Tag size ${size} exceeds maximum ${MAX_TAG_SIZE}`);
    }
  }

  /**
   * Safe byte read with bounds checking
   */
  static safeGetUint8(view: DataView, offset: number, context: string): number {
    this.validateOffset(offset, view, context);
    return view.getUint8(offset);
  }

  /**
   * Validates ID3v2 version
   */
  static validateVersion(version: number): void {
    if (!SUPPORTED_VERSIONS.includes(version)) {
      throw new Error(`Unsupported ID3v2 version: 2.${version}`);
    }
  }
}

export class ID3v2Parser implements IMetadataParser {
  canParse(view: DataView): boolean {
    try {
      if (view.byteLength < 10) {
        return false;
      }

      return view.getUint8(0) === 0x49 && // 'I'
             view.getUint8(1) === 0x44 && // 'D'
             view.getUint8(2) === 0x33;   // '3'
    } catch (error) {
      console.warn('ID3v2 canParse check failed:', error);
      return false;
    }
  }

  async parse(view: DataView): Promise<Partial<MediaMetadata>> {
    const metadata: Partial<MediaMetadata> = {};
    const tags: Record<string, any> = {}; // Collect all tags for lyrics extraction
    let framesProcessed = 0;

    try {
      // Validate minimum header size
      ID3v2SecurityValidator.validateMinimumSize(view, 10, 'ID3v2 header');

      // ID3v2 header: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes)
      const version = ID3v2SecurityValidator.safeGetUint8(view, 3, 'ID3v2 version');
      ID3v2SecurityValidator.validateVersion(version);

      const flags = ID3v2SecurityValidator.safeGetUint8(view, 5, 'ID3v2 flags');
      
      // Size is stored as synchsafe integer (7 bits per byte)
      const size = this.readSynchsafeInt(view, 6, 'ID3v2 tag size');
      ID3v2SecurityValidator.validateTagSize(size);

      let offset = 10;

      // Skip extended header if present
      if (flags & 0x40) {
        try {
          const extSize = this.readSynchsafeInt(view, offset, 'Extended header size');
          ID3v2SecurityValidator.validateFrameSize(extSize, 'Extended header');
          offset += extSize + 4;
          
          if (offset > view.byteLength) {
            throw new Error('Extended header extends beyond buffer');
          }
        } catch (error) {
          console.warn('⚠️ Extended header parsing failed:', error);
          // Continue without extended header
        }
      }

      const endOffset = Math.min(size + 10, view.byteLength);

      // Parse frames
      while (offset < endOffset && offset < view.byteLength - 10 && framesProcessed < MAX_FRAMES) {
        try {
          // Check for padding
          if (offset + 4 > view.byteLength) {
            break;
          }

          // Frame header: ID (4 bytes) + size (4 bytes) + flags (2 bytes)
          const frameId = this.readFrameId(view, offset);

          if (frameId === '\0\0\0\0' || frameId === '') {
            break; // Padding reached
          }

          // Validate frame ID contains only printable ASCII
          if (!this.isValidFrameId(frameId)) {
            console.warn(`⚠️ Invalid frame ID at offset ${offset}, skipping`);
            break;
          }

          let frameSize: number;
          if (version === 4) {
            // ID3v2.4: synchsafe integer
            frameSize = this.readSynchsafeInt(view, offset + 4, `Frame ${frameId} size`);
          } else {
            // ID3v2.3: regular integer
            frameSize = this.readRegularInt(view, offset + 4, `Frame ${frameId} size`);
          }

          ID3v2SecurityValidator.validateFrameSize(frameSize, `Frame ${frameId}`);

          if (frameSize === 0) {
            offset += 10;
            continue;
          }

          if (offset + 10 + frameSize > view.byteLength) {
            console.warn(`⚠️ Frame ${frameId} extends beyond buffer, stopping`);
            break;
          }

          const frameData = new Uint8Array(view.buffer, view.byteOffset + offset + 10, frameSize);
          
          // Extract and process frame
          this.processFrame(frameId, frameData, metadata, tags);

          offset += 10 + frameSize;
          framesProcessed++;
        } catch (frameError) {
          console.warn(`⚠️ Error processing frame at offset ${offset}:`, frameError);
          // Try to continue with next frame
          offset += 10;
        }
      }

      if (framesProcessed >= MAX_FRAMES) {
        console.warn(`⚠️ Maximum frame limit (${MAX_FRAMES}) reached, stopping parse`);
      }

      // Extract lyrics using LyricsExtractor
      try {
        console.log('🔍 Checking for lyrics tags:', Object.keys(tags));
        const lyrics = LyricsExtractor.extractFromTags(tags);
        if (lyrics) {
          metadata.lyrics = lyrics;
          console.log(`✅ Lyrics extracted from ID3v2:`, {
            type: lyrics.isSynchronized ? 'synchronized' : 'unsynchronized',
            source: lyrics.source
          });
        } else {
          console.log('ℹ️ No lyrics found in ID3v2 tags');
        }
      } catch (lyricsError) {
        console.warn('⚠️ Lyrics extraction failed:', lyricsError);
      }
    } catch (error) {
      console.warn('❌ ID3v2 parsing error:', error);
      // Return partial metadata on error
    }

    return metadata;
  }

  /**
   * Read synchsafe integer (7 bits per byte)
   */
  private readSynchsafeInt(view: DataView, offset: number, context: string): number {
    try {
      ID3v2SecurityValidator.validateOffset(offset + 3, view, context);
      
      const b0 = view.getUint8(offset);
      const b1 = view.getUint8(offset + 1);
      const b2 = view.getUint8(offset + 2);
      const b3 = view.getUint8(offset + 3);

      // Validate synchsafe format (MSB should be 0)
      if ((b0 & 0x80) || (b1 & 0x80) || (b2 & 0x80) || (b3 & 0x80)) {
        throw new Error('Invalid synchsafe integer: MSB set');
      }

      return (b0 << 21) | (b1 << 14) | (b2 << 7) | b3;
    } catch (error) {
      throw new Error(`${context}: Failed to read synchsafe integer - ${error}`);
    }
  }

  /**
   * Read regular 32-bit integer
   */
  private readRegularInt(view: DataView, offset: number, context: string): number {
    try {
      ID3v2SecurityValidator.validateOffset(offset + 3, view, context);
      
      return (view.getUint8(offset) << 24) |
             (view.getUint8(offset + 1) << 16) |
             (view.getUint8(offset + 2) << 8) |
             view.getUint8(offset + 3);
    } catch (error) {
      throw new Error(`${context}: Failed to read integer - ${error}`);
    }
  }

  /**
   * Read frame ID (4 ASCII characters)
   */
  private readFrameId(view: DataView, offset: number): string {
    try {
      if (offset + 3 >= view.byteLength) {
        return '';
      }

      return String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
    } catch (error) {
      console.warn('Failed to read frame ID:', error);
      return '';
    }
  }

  /**
   * Validate frame ID contains only valid characters
   */
  private isValidFrameId(frameId: string): boolean {
    if (frameId.length !== 4) return false;
    
    // Frame IDs should be uppercase letters and numbers
    return /^[A-Z0-9]{4}$/.test(frameId);
  }

  /**
   * Process individual frame
   */
  private processFrame(
    frameId: string,
    frameData: Uint8Array,
    metadata: Partial<MediaMetadata>,
    tags: Record<string, any>
  ): void {
    try {
      if (frameData.length === 0) {
        return;
      }

      // Special handling for APIC (picture) frame
      if (frameId === 'APIC') {
        const artUrl = this.extractAPIC(frameData);
        if (artUrl) {
          metadata.coverArt = artUrl;
          console.log('✅ Album art extracted successfully');
        }
        return;
      }

      // Text frames - skip encoding byte and decode
      if (frameData.length < 2) {
        return; // Not enough data
      }

      const text = decodeText(frameData.slice(1));

      // Map frame IDs to metadata
      switch (frameId) {
        case 'TIT2': 
          metadata.title = text;
          break;
        case 'TPE1': 
          metadata.artist = parseMultipleValues(text);
          break;
        case 'TPE2': 
          metadata.albumArtist = text;
          break;
        case 'TALB': 
          metadata.album = text;
          break;
        case 'TYER': 
        case 'TDRC': 
          const year = parseInt(text);
          if (!isNaN(year) && year > 0 && year < 3000) {
            metadata.year = year;
          }
          break;
        case 'TRCK': 
          const trackNum = parseInt(text.split('/')[0]);
          if (!isNaN(trackNum) && trackNum > 0) {
            metadata.trackNumber = trackNum;
          }
          break;
        case 'TCON': 
          metadata.genre = parseMultipleValues(text);
          break;
        case 'USLT':
          tags.USLT = { data: { text } };
          break;
        case 'SYLT':
          tags.SYLT = { data: text };
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to process frame ${frameId}:`, error);
    }
  }

  /**
   * Extract APIC (Attached Picture) frame
   */
  private extractAPIC(data: Uint8Array): string | undefined {
    try {
      if (data.length < 10) {
        return undefined; // Too small to contain valid image
      }

      let offset = 1; // Skip encoding

      // Skip MIME type (null-terminated)
      let nullCount = 0;
      while (offset < data.length && nullCount < 2) {
        if (data[offset] === 0) {
          nullCount++;
          if (nullCount === 1) {
            offset++; // Skip picture type
          }
        }
        offset++;
        
        // Prevent infinite loop
        if (offset > 256) {
          console.warn('⚠️ APIC: MIME type or description too long');
          return undefined;
        }
      }

      if (offset >= data.length) {
        console.warn('⚠️ APIC frame malformed: no image data');
        return undefined;
      }

      // Remaining data is the image
      const imageData = data.slice(offset);
      
      if (imageData.length === 0 || imageData.length > MAX_FRAME_SIZE) {
        console.warn(`⚠️ APIC frame has invalid image size: ${imageData.length}`);
        return undefined;
      }

      console.log(`🖼️ Extracting artwork: ${imageData.length} bytes`);
      
      // Detect MIME type from magic bytes
      let mimeType = 'image/jpeg'; // Default
      if (imageData.length >= 2) {
        if (imageData[0] === 0x89 && imageData[1] === 0x50) {
          mimeType = 'image/png';
        } else if (imageData[0] === 0xFF && imageData[1] === 0xD8) {
          mimeType = 'image/jpeg';
        } else if (imageData[0] === 0x47 && imageData[1] === 0x49) {
          mimeType = 'image/gif';
        } else if (imageData[0] === 0x42 && imageData[1] === 0x4D) {
          mimeType = 'image/bmp';
        }
      }

      return bytesToDataUrl(imageData, mimeType);
    } catch (error) {
      console.warn('❌ APIC extraction failed:', error);
      return undefined;
    }
  }
}
