import type { MediaMetadata } from '@sonantica/shared';
import { LyricsExtractor } from '@sonantica/lyrics';
import type { IMetadataParser } from './contracts';
import { decodeText, parseMultipleValues, bytesToDataUrl } from '../utils/metadataUtils';

export class ID3v2Parser implements IMetadataParser {
  canParse(view: DataView): boolean {
    return view.byteLength >= 3 &&
           view.getUint8(0) === 0x49 && // 'I'
           view.getUint8(1) === 0x44 && // 'D'
           view.getUint8(2) === 0x33;   // '3'
  }

  async parse(view: DataView): Promise<Partial<MediaMetadata>> {
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
            metadata.artist = parseMultipleValues(text);
            break;
          case 'TPE2': 
            metadata.albumArtist = text;
            break;
          case 'TALB': metadata.album = text; break;
          case 'TYER': 
          case 'TDRC': metadata.year = parseInt(text) || undefined; break;
          case 'TRCK': metadata.trackNumber = parseInt(text.split('/')[0]) || undefined; break;
          case 'TCON': 
            metadata.genre = parseMultipleValues(text);
            break;
          case 'APIC': 
            const artUrl = this.extractAPIC(frameData);
            if (artUrl) {
              metadata.coverArt = artUrl;
              console.log('✅ Album art extracted successfully');
            }
            break;
          case 'USLT':
            tags.USLT = { data: { text } };
            break;
          case 'SYLT':
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
   * Extract APIC (Attached Picture) frame
   */
  private extractAPIC(data: Uint8Array): string | undefined {
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

      return bytesToDataUrl(imageData, mimeType);
    } catch (error) {
      console.warn('APIC extraction failed:', error);
      return undefined;
    }
  }
}
