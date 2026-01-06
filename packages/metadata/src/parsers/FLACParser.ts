/**
 * FLAC Parser
 * 
 * Parses FLAC metadata blocks including Vorbis comments and pictures
 * Supports STREAMINFO, VORBIS_COMMENT, and PICTURE blocks
 * 
 * Security: Hardened against buffer overflows and malformed blocks
 */

import type { MediaMetadata } from '@sonantica/shared';
import { LyricsExtractor } from '@sonantica/lyrics';
import type { IMetadataParser } from './contracts';
import { decodeText, parseMultipleValues, bytesToDataUrl } from '../utils/metadataUtils';

/**
 * Security constants for FLAC parsing
 */
const MAX_BLOCK_SIZE = 16 * 1024 * 1024; // 16MB max per block
const MAX_BLOCKS = 128; // Maximum number of blocks to parse
const MAX_COMMENT_LENGTH = 1024 * 1024; // 1MB max per comment
const MAX_COMMENTS = 1000; // Maximum number of comments
const MAX_PICTURE_SIZE = 10 * 1024 * 1024; // 10MB max picture size

/**
 * FLAC block types
 */
enum FLACBlockType {
  STREAMINFO = 0,
  PADDING = 1,
  APPLICATION = 2,
  SEEKTABLE = 3,
  VORBIS_COMMENT = 4,
  CUESHEET = 5,
  PICTURE = 6,
}

/**
 * Security utilities for FLAC parsing
 */
class FLACSecurityValidator {
  /**
   * Validates offset is within bounds
   */
  static validateOffset(offset: number, maxOffset: number, context: string): void {
    if (offset < 0 || offset > maxOffset) {
      throw new Error(`${context}: Offset ${offset} out of bounds (max: ${maxOffset})`);
    }
  }

  /**
   * Validates block size
   */
  static validateBlockSize(size: number, context: string): void {
    if (size < 0) {
      throw new Error(`${context}: Negative block size: ${size}`);
    }
    if (size > MAX_BLOCK_SIZE) {
      throw new Error(`${context}: Block size ${size} exceeds maximum ${MAX_BLOCK_SIZE}`);
    }
  }

  /**
   * Validates comment length
   */
  static validateCommentLength(length: number, context: string): void {
    if (length < 0) {
      throw new Error(`${context}: Negative comment length: ${length}`);
    }
    if (length > MAX_COMMENT_LENGTH) {
      throw new Error(`${context}: Comment length ${length} exceeds maximum ${MAX_COMMENT_LENGTH}`);
    }
  }

  /**
   * Validates picture size
   */
  static validatePictureSize(size: number): void {
    if (size < 0) {
      throw new Error('Invalid picture size: Negative value');
    }
    if (size > MAX_PICTURE_SIZE) {
      throw new Error(`Picture size ${size} exceeds maximum ${MAX_PICTURE_SIZE}`);
    }
  }

  /**
   * Safe 32-bit read with bounds checking
   */
  static safeGetUint32(view: DataView, offset: number, littleEndian: boolean, context: string): number {
    if (offset + 3 >= view.byteLength) {
      throw new Error(`${context}: Cannot read uint32 at offset ${offset}`);
    }
    return view.getUint32(offset, littleEndian);
  }

  /**
   * Safe 8-bit read with bounds checking
   */
  static safeGetUint8(view: DataView, offset: number, context: string): number {
    if (offset >= view.byteLength) {
      throw new Error(`${context}: Cannot read uint8 at offset ${offset}`);
    }
    return view.getUint8(offset);
  }
}

export class FLACParser implements IMetadataParser {
  canParse(view: DataView): boolean {
    try {
      if (view.byteLength < 4) {
        return false;
      }

      // Check for FLAC signature ('fLaC') at start
      if (view.getUint8(0) === 0x66 && // 'f'
          view.getUint8(1) === 0x4C && // 'L'
          view.getUint8(2) === 0x61 && // 'a'
          view.getUint8(3) === 0x43) { // 'C'
        return true;
      }

      // Heuristic: Check for ID3v2 tag at start, which might precede FLAC
      // Some legacy tools incorrectly prepend ID3v2 tags to FLAC files
      if (view.byteLength > 10 && 
          view.getUint8(0) === 0x49 && // 'I'
          view.getUint8(1) === 0x44 && // 'D'
          view.getUint8(2) === 0x33) { // '3'
        
        // Scan for 'fLaC' signature within a reasonable range (e.g., first 128KB)
        // ID3v2 tags can be large if they contain artwork
        const scanLimit = Math.min(view.byteLength, 131072); 
        for (let i = 10; i < scanLimit - 3; i++) {
             if (view.getUint8(i) === 0x66 && // 'f'
                 view.getUint8(i+1) === 0x4C && // 'L'
                 view.getUint8(i+2) === 0x61 && // 'a'
                 view.getUint8(i+3) === 0x43) { // 'C'
               return true; // Found FLAC signature embedded
             }
        }
      }

      return false;
    } catch (error) {
      console.warn('FLAC canParse check failed:', error);
      return false;
    }
  }

  async parse(view: DataView): Promise<Partial<MediaMetadata>> {
    const metadata: Partial<MediaMetadata> = {};
    const tags: Record<string, any> = {}; // Collect all tags for lyrics extraction
    let blocksProcessed = 0;

    try {
      if (view.byteLength < 4) {
        throw new Error('Buffer too small for FLAC header');
      }

      let offset = 0;
      
      // Find start of FLAC stream
      if (view.getUint8(0) === 0x66 && view.getUint8(1) === 0x4C && view.getUint8(2) === 0x61 && view.getUint8(3) === 0x43) {
        offset = 4;
      } else {
        // Search for fLaC signature
        const scanLimit = Math.min(view.byteLength, 131072);
        let found = false;
        for (let i = 0; i < scanLimit - 3; i++) {
          if (view.getUint8(i) === 0x66 && 
              view.getUint8(i+1) === 0x4C && 
              view.getUint8(i+2) === 0x61 && 
              view.getUint8(i+3) === 0x43) {
            offset = i + 4;
            found = true;
            console.warn(`⚠️ FLAC signature found at offset ${i} (preceded by ID3/garbage)`);
            break;
          }
        }
        
        if (!found) {
           throw new Error('FLAC signature not found');
        }
      }

      // Read metadata blocks
      while (offset < view.byteLength && blocksProcessed < MAX_BLOCKS) {
        try {
          if (offset + 4 > view.byteLength) {
            console.warn('⚠️ Incomplete block header, stopping');
            break;
          }

          const blockHeader = FLACSecurityValidator.safeGetUint8(view, offset, 'Block header');
          const isLast = (blockHeader & 0x80) !== 0;
          const blockType = blockHeader & 0x7F;
          
          const blockSize = this.readBlockSize(view, offset);
          FLACSecurityValidator.validateBlockSize(blockSize, `Block type ${blockType}`);

          offset += 4;

          // Validate block doesn't extend beyond buffer
          if (offset + blockSize > view.byteLength) {
            console.warn(`⚠️ Block type ${blockType} extends beyond buffer, stopping`);
            break;
          }

          // Process block based on type
          switch (blockType) {
            case FLACBlockType.STREAMINFO:
              this.parseStreamInfo(view, offset, blockSize, metadata);
              break;
            case FLACBlockType.VORBIS_COMMENT:
              this.parseVorbisComment(view, offset, blockSize, metadata, tags);
              break;
            case FLACBlockType.PICTURE:
              this.parsePicture(view, offset, blockSize, metadata);
              break;
            default:
              // Skip unknown block types
              console.log(`ℹ️ Skipping FLAC block type ${blockType}`);
          }

          offset += blockSize;
          blocksProcessed++;

          if (isLast) {
            break;
          }
        } catch (blockError) {
          console.warn(`⚠️ Error processing FLAC block at offset ${offset}:`, blockError);
          break; // Stop on block error
        }
      }

      if (blocksProcessed >= MAX_BLOCKS) {
        console.warn(`⚠️ Maximum block limit (${MAX_BLOCKS}) reached, stopping parse`);
      }

      // Extract lyrics using LyricsExtractor
      try {
        console.log('🔍 Checking for FLAC lyrics tags:', Object.keys(tags));
        const lyrics = LyricsExtractor.extractFromTags(tags);
        if (lyrics) {
          metadata.lyrics = lyrics;
          console.log(`✅ Lyrics extracted from FLAC:`, {
            type: lyrics.isSynchronized ? 'synchronized' : 'unsynchronized',
            source: lyrics.source
          });
        } else {
          console.log('ℹ️ No lyrics found in FLAC tags');
        }
      } catch (lyricsError) {
        console.warn('⚠️ Lyrics extraction failed:', lyricsError);
      }
    } catch (error) {
      console.warn('❌ FLAC parsing error:', error);
      // Return partial metadata on error
    }

    return metadata;
  }

  /**
   * Read block size (24-bit big-endian)
   */
  private readBlockSize(view: DataView, offset: number): number {
    try {
      return (FLACSecurityValidator.safeGetUint8(view, offset + 1, 'Block size byte 1') << 16) |
             (FLACSecurityValidator.safeGetUint8(view, offset + 2, 'Block size byte 2') << 8) |
             FLACSecurityValidator.safeGetUint8(view, offset + 3, 'Block size byte 3');
    } catch (error) {
      throw new Error(`Failed to read block size: ${error}`);
    }
  }

  /**
   * Parse STREAMINFO block
   */
  private parseStreamInfo(view: DataView, offset: number, blockSize: number, metadata: Partial<MediaMetadata>): void {
    try {
      if (blockSize < 34) {
        console.warn('⚠️ STREAMINFO block too small');
        return;
      }

      // Sample rate (20 bits starting at byte 10)
      const b10_12 = (FLACSecurityValidator.safeGetUint8(view, offset + 10, 'Sample rate byte 1') << 16) |
                     (FLACSecurityValidator.safeGetUint8(view, offset + 11, 'Sample rate byte 2') << 8) |
                     FLACSecurityValidator.safeGetUint8(view, offset + 12, 'Sample rate byte 3');
      const sampleRate = b10_12 >> 4;

      // Bits per sample (5 bits)
      const bitsPerSample = ((FLACSecurityValidator.safeGetUint8(view, offset + 12, 'BPS byte 1') & 0x01) << 4) |
                           (FLACSecurityValidator.safeGetUint8(view, offset + 13, 'BPS byte 2') >> 4) + 1;
      
      // Total samples (36 bits)
      const b13_17_high = FLACSecurityValidator.safeGetUint8(view, offset + 13, 'Samples high') & 0x0F;
      const b14 = FLACSecurityValidator.safeGetUint8(view, offset + 14, 'Samples byte 1');
      const b15 = FLACSecurityValidator.safeGetUint8(view, offset + 15, 'Samples byte 2');
      const b16 = FLACSecurityValidator.safeGetUint8(view, offset + 16, 'Samples byte 3');
      const b17 = FLACSecurityValidator.safeGetUint8(view, offset + 17, 'Samples byte 4');
      
      const totalSamples = (b13_17_high * Math.pow(2, 32)) + (b14 << 24 | b15 << 16 | b16 << 8 | b17);

      // Validate values
      if (sampleRate > 0 && sampleRate <= 655350) {
        metadata.sampleRate = sampleRate;
      }
      
      if (bitsPerSample > 0 && bitsPerSample <= 32) {
        metadata.bitsPerSample = bitsPerSample;
      }
      
      if (sampleRate > 0 && totalSamples > 0) {
        metadata.duration = totalSamples / sampleRate;
      }
    } catch (error) {
      console.warn('⚠️ STREAMINFO parsing failed:', error);
    }
  }

  /**
   * Parse VORBIS_COMMENT block
   */
  private parseVorbisComment(
    view: DataView,
    startOffset: number,
    blockSize: number,
    metadata: Partial<MediaMetadata>,
    tags: Record<string, any>
  ): void {
    try {
      let offset = startOffset;
      const endOffset = startOffset + blockSize;

      // Vendor string length
      const vendorLength = FLACSecurityValidator.safeGetUint32(view, offset, true, 'Vendor length');
      FLACSecurityValidator.validateCommentLength(vendorLength, 'Vendor string');
      offset += 4 + vendorLength;

      if (offset + 4 > endOffset) {
        console.warn('⚠️ Vorbis comment block truncated');
        return;
      }

      // Comment count
      const commentCount = FLACSecurityValidator.safeGetUint32(view, offset, true, 'Comment count');
      offset += 4;

      if (commentCount > MAX_COMMENTS) {
        console.warn(`⚠️ Too many comments (${commentCount}), limiting to ${MAX_COMMENTS}`);
      }

      const maxComments = Math.min(commentCount, MAX_COMMENTS);

      for (let i = 0; i < maxComments && offset < endOffset; i++) {
        try {
          if (offset + 4 > endOffset) {
            break;
          }

          const commentLength = FLACSecurityValidator.safeGetUint32(view, offset, true, `Comment ${i} length`);
          FLACSecurityValidator.validateCommentLength(commentLength, `Comment ${i}`);
          offset += 4;

          if (offset + commentLength > endOffset) {
            console.warn(`⚠️ Comment ${i} extends beyond block, skipping`);
            break;
          }

          const commentBytes = new Uint8Array(view.buffer, view.byteOffset + offset, commentLength);
          const comment = decodeText(commentBytes);
          
          const equalIndex = comment.indexOf('=');
          if (equalIndex === -1) {
            offset += commentLength;
            continue;
          }

          const key = comment.substring(0, equalIndex);
          const value = comment.substring(equalIndex + 1);

          this.processVorbisComment(key, value, metadata, tags);

          offset += commentLength;
        } catch (commentError) {
          console.warn(`⚠️ Failed to parse comment ${i}:`, commentError);
          break;
        }
      }
    } catch (error) {
      console.warn('⚠️ Vorbis comment parsing failed:', error);
    }
  }

  /**
   * Process individual Vorbis comment
   */
  private processVorbisComment(
    key: string,
    value: string,
    metadata: Partial<MediaMetadata>,
    tags: Record<string, any>
  ): void {
    try {
      switch (key.toUpperCase()) {
        case 'TITLE':
          metadata.title = value;
          break;
        case 'ARTIST':
          metadata.artist = parseMultipleValues(value);
          break;
        case 'ALBUMARTIST':
          metadata.albumArtist = value;
          break;
        case 'ALBUM':
          metadata.album = value;
          break;
        case 'DATE':
          const year = parseInt(value);
          if (!isNaN(year) && year > 0 && year < 3000) {
            metadata.year = year;
          }
          break;
        case 'TRACKNUMBER':
          const trackNum = parseInt(value);
          if (!isNaN(trackNum) && trackNum > 0) {
            metadata.trackNumber = trackNum;
          }
          break;
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
    } catch (error) {
      console.warn(`⚠️ Failed to process comment ${key}:`, error);
    }
  }

  /**
   * Parse PICTURE block
   */
  private parsePicture(view: DataView, offset: number, blockSize: number, metadata: Partial<MediaMetadata>): void {
    try {
      const pictureData = new Uint8Array(view.buffer, view.byteOffset + offset, blockSize);
      const artUrl = this.extractFLACPicture(pictureData);
      if (artUrl) {
        metadata.coverArt = artUrl;
        console.log('✅ FLAC album art extracted successfully');
      }
    } catch (error) {
      console.warn('⚠️ FLAC picture extraction failed:', error);
    }
  }

  /**
   * Extract FLAC PICTURE block
   * Format: https://xiph.org/flac/format.html#metadata_block_picture
   */
  private extractFLACPicture(data: Uint8Array): string | undefined {
    try {
      if (data.length < 32) {
        console.warn('⚠️ PICTURE block too small');
        return undefined;
      }

      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      let offset = 0;

      // Picture type (4 bytes)
      const pictureType = FLACSecurityValidator.safeGetUint32(view, offset, false, 'Picture type');
      offset += 4;

      // MIME type length (4 bytes)
      const mimeLength = FLACSecurityValidator.safeGetUint32(view, offset, false, 'MIME length');
      offset += 4;

      if (mimeLength > 256) {
        console.warn('⚠️ MIME type too long');
        return undefined;
      }

      if (offset + mimeLength > data.length) {
        console.warn('⚠️ MIME type extends beyond block');
        return undefined;
      }

      // MIME type string
      const mimeBytes = data.slice(offset, offset + mimeLength);
      const mimeType = decodeText(mimeBytes);
      offset += mimeLength;

      // Description length (4 bytes)
      if (offset + 4 > data.length) {
        console.warn('⚠️ Description length missing');
        return undefined;
      }

      const descLength = FLACSecurityValidator.safeGetUint32(view, offset, false, 'Description length');
      offset += 4;

      if (descLength > 1024) {
        console.warn('⚠️ Description too long');
        return undefined;
      }

      offset += descLength; // Skip description

      // Width, height, depth, colors (16 bytes)
      if (offset + 16 > data.length) {
        console.warn('⚠️ Picture metadata incomplete');
        return undefined;
      }
      offset += 16;

      // Picture data length (4 bytes)
      if (offset + 4 > data.length) {
        console.warn('⚠️ Picture data length missing');
        return undefined;
      }

      const dataLength = FLACSecurityValidator.safeGetUint32(view, offset, false, 'Picture data length');
      FLACSecurityValidator.validatePictureSize(dataLength);
      offset += 4;

      // Picture data
      if (offset + dataLength > data.length) {
        console.warn('⚠️ Picture data extends beyond block');
        return undefined;
      }

      const imageData = data.slice(offset, offset + dataLength);

      if (imageData.length === 0) {
        console.warn('⚠️ FLAC PICTURE block has no image data');
        return undefined;
      }

      console.log(`🖼️ Extracting FLAC artwork: ${imageData.length} bytes`);

      return bytesToDataUrl(imageData, mimeType);
    } catch (error) {
      console.warn('❌ FLAC PICTURE extraction failed:', error);
      return undefined;
    }
  }
}
