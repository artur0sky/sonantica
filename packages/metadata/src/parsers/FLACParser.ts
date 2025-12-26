import type { MediaMetadata } from '@sonantica/shared';
import { LyricsExtractor } from '@sonantica/lyrics';
import type { IMetadataParser } from './contracts';
import { decodeText, parseMultipleValues, bytesToDataUrl } from '../utils/metadataUtils';

export class FLACParser implements IMetadataParser {
  canParse(view: DataView): boolean {
    return view.byteLength >= 4 &&
           view.getUint8(0) === 0x66 && // 'f'
           view.getUint8(1) === 0x4C && // 'L'
           view.getUint8(2) === 0x61 && // 'a'
           view.getUint8(3) === 0x43;   // 'C'
  }

  async parse(view: DataView): Promise<Partial<MediaMetadata>> {
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
          const b10_12 = (view.getUint8(offset + 10) << 16) | (view.getUint8(offset + 11) << 8) | view.getUint8(offset + 12);
          const sampleRate = b10_12 >> 4;
          const bitsPerSample = ((view.getUint8(offset + 12) & 0x01) << 4) | (view.getUint8(offset + 13) >> 4) + 1;
          
          // Total samples (36 bits)
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
          }
        }

        // Vorbis comment block (type 4)
        if (blockType === 4) {
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
            const availableBytes = view.byteLength - offset;
            if (blockSize > availableBytes) {
              console.warn(`⚠️ FLAC PICTURE block (${blockSize} bytes) extends beyond buffer. Skipping.`);
              offset += availableBytes;
              break;
            }
            
            const pictureData = new Uint8Array(view.buffer, view.byteOffset + offset, blockSize);
            const artUrl = this.extractFLACPicture(pictureData);
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
   * Extract FLAC PICTURE block
   * Format: https://xiph.org/flac/format.html#metadata_block_picture
   */
  private extractFLACPicture(data: Uint8Array): string | undefined {
    try {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      let offset = 0;

      // Picture type (4 bytes)
      const pictureType = view.getUint32(offset, false);
      offset += 4;

      // MIME type length (4 bytes)
      const mimeLength = view.getUint32(offset, false);
      offset += 4;

      // MIME type string
      const mimeBytes = data.slice(offset, offset + mimeLength);
      const mimeType = decodeText(mimeBytes);
      offset += mimeLength;

      // Description length (4 bytes)
      const descLength = view.getUint32(offset, false);
      offset += 4;
      offset += descLength; // Skip description

      // Width, height, depth, colors (16 bytes)
      offset += 16;

      // Picture data length (4 bytes)
      const dataLength = view.getUint32(offset, false);
      offset += 4;

      // Picture data
      const imageData = data.slice(offset, offset + dataLength);

      if (imageData.length === 0) {
        console.warn('⚠️ FLAC PICTURE block has no image data');
        return undefined;
      }

      return bytesToDataUrl(imageData, mimeType);
    } catch (error) {
      console.warn('FLAC PICTURE extraction failed:', error);
      return undefined;
    }
  }
}
