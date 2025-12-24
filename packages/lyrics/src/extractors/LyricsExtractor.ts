/**
 * Lyrics Extractor - Extract lyrics from audio file metadata
 * 
 * "Every file has an intention."
 * 
 * Extracts embedded lyrics from audio files using jsmediatags.
 * Supports ID3v2 (MP3), Vorbis Comments (FLAC, OGG), and other formats.
 */

import type { Lyrics } from '@sonantica/shared';
import { LRCParser } from '../parsers/LRCParser';

/**
 * Extract lyrics from audio file metadata tags
 */
export class LyricsExtractor {
  /**
   * Extract lyrics from jsmediatags metadata
   * @param tags - Tags object from jsmediatags
   * @returns Lyrics object or null
   */
  static extractFromTags(tags: any): Lyrics | null {
    if (!tags) return null;

    // Try different tag fields for lyrics
    // ID3v2: USLT (Unsynchronized lyrics), SYLT (Synchronized lyrics)
    // Vorbis: LYRICS, UNSYNCEDLYRICS
    const lyricsText = 
      tags.USLT?.data?.text ||
      tags.LYRICS ||
      tags.UNSYNCEDLYRICS ||
      tags['unsynced lyrics'] ||
      tags.lyrics ||
      null;

    const syncedLyricsText = 
      tags.SYLT?.data ||
      tags.SYNCEDLYRICS ||
      tags['synced lyrics'] ||
      null;

    // If no lyrics found
    if (!lyricsText && !syncedLyricsText) {
      return null;
    }

    // Check if we have synchronized lyrics
    if (syncedLyricsText) {
      const syncedLines = this.parseSynchronizedLyrics(syncedLyricsText);
      if (syncedLines && syncedLines.length > 0) {
        return {
          text: this.extractPlainText(syncedLines),
          synced: syncedLines,
          isSynchronized: true,
          source: 'embedded',
        };
      }
    }

    // Check if the text is in LRC format
    if (lyricsText && LRCParser.isLRC(lyricsText)) {
      const syncedLines = LRCParser.parse(lyricsText);
      if (syncedLines.length > 0) {
        return {
          text: this.extractPlainText(syncedLines),
          synced: syncedLines,
          isSynchronized: true,
          source: 'embedded',
        };
      }
    }

    // Unsynchronized lyrics
    if (lyricsText) {
      return {
        text: this.cleanLyricsText(lyricsText),
        isSynchronized: false,
        source: 'embedded',
      };
    }

    return null;
  }

  /**
   * Parse synchronized lyrics from SYLT tag
   * @param syltData - SYLT tag data
   * @returns Array of synchronized lyrics lines
   */
  private static parseSynchronizedLyrics(syltData: any): any[] | null {
    if (!syltData) return null;

    // SYLT format varies, try to handle common cases
    if (typeof syltData === 'string') {
      // If it's a string, try to parse as LRC
      return LRCParser.parse(syltData);
    }

    if (Array.isArray(syltData)) {
      // If it's already an array of {time, text} objects
      return syltData.map((item: any) => ({
        time: typeof item.time === 'number' ? item.time : parseInt(item.time, 10) || 0,
        text: item.text || item.lyrics || '',
      }));
    }

    return null;
  }

  /**
   * Extract plain text from synchronized lyrics
   * @param lines - Synchronized lyrics lines
   * @returns Plain text lyrics
   */
  private static extractPlainText(lines: any[]): string {
    if (!lines || lines.length === 0) return '';
    return lines.map(line => line.text).filter(Boolean).join('\n');
  }

  /**
   * Clean lyrics text (remove extra whitespace, normalize line breaks)
   * @param text - Raw lyrics text
   * @returns Cleaned lyrics text
   */
  private static cleanLyricsText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Check if metadata contains lyrics
   * @param tags - Tags object from jsmediatags
   * @returns True if lyrics are present
   */
  static hasLyrics(tags: any): boolean {
    if (!tags) return false;

    return !!(
      tags.USLT?.data?.text ||
      tags.LYRICS ||
      tags.UNSYNCEDLYRICS ||
      tags['unsynced lyrics'] ||
      tags.lyrics ||
      tags.SYLT?.data ||
      tags.SYNCEDLYRICS ||
      tags['synced lyrics']
    );
  }

  /**
   * Detect lyrics language from tags
   * @param tags - Tags object from jsmediatags
   * @returns Language code or undefined
   */
  static detectLanguage(tags: any): string | undefined {
    if (!tags) return undefined;

    // Try to get language from USLT tag
    if (tags.USLT?.data?.language) {
      return tags.USLT.data.language;
    }

    // Try common language tags
    return tags.LANGUAGE || tags.language || undefined;
  }
}
