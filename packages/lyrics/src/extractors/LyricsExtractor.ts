/**
 * Lyrics Extractor - Extract lyrics from audio file metadata
 * 
 * "Every file has an intention."
 * 
 * Extracts embedded lyrics from audio files using jsmediatags.
 * Supports ID3v2 (MP3), Vorbis Comments (FLAC, OGG), and other formats.
 * 
 * Security: Hardened against malicious tags and extensive resource usage.
 */

import type { Lyrics } from '@sonantica/shared';
import { LRCParser } from '../parsers/LRCParser';

// Security constants
const MAX_LYRICS_LENGTH = 100 * 1024; // 100KB Limit for lyrics text
const EXPECTED_TAG_TYPES = ['string', 'object'];

/**
 * Extract lyrics from audio file metadata tags
 */
export class LyricsExtractor {
  
  /**
   * Validate tag object to prevent type confusion attacks
   */
  private static validateTags(tags: any): boolean {
    if (!tags || typeof tags !== 'object') return false;
    return true;
  }

  /**
   * Extract lyrics from jsmediatags metadata
   * @param tags - Tags object from jsmediatags
   * @returns Lyrics object or null
   */
  static extractFromTags(tags: any): Lyrics | null {
    try {
      if (!this.validateTags(tags)) return null;

      // Extract raw text
      let lyricsText: string | null = null;
      let syncedLyricsText: any = null;

      try {
        // ID3v2: USLT (Unsynchronized lyrics)
        if (tags.USLT?.data?.text && typeof tags.USLT.data.text === 'string') {
          lyricsText = tags.USLT.data.text;
        } 
        // Vorbis/Common: LYRICS
        else if (typeof tags.LYRICS === 'string') {
          lyricsText = tags.LYRICS;
        }
        else if (typeof tags.UNSYNCEDLYRICS === 'string') {
          lyricsText = tags.UNSYNCEDLYRICS;
        }
        else if (typeof tags['unsynced lyrics'] === 'string') {
          lyricsText = tags['unsynced lyrics'];
        }
        else if (typeof tags.lyrics === 'string') {
          lyricsText = tags.lyrics;
        }

        // SYLT (Synchronized)
        if (tags.SYLT?.data) {
          syncedLyricsText = tags.SYLT.data;
        } else if (tags.SYNCEDLYRICS) {
          syncedLyricsText = tags.SYNCEDLYRICS;
        } else if (tags['synced lyrics']) {
          syncedLyricsText = tags['synced lyrics'];
        }

      } catch (e) {
        console.warn('Error accessing tag properties:', e);
        return null;
      }

      // Length Validation
      if (lyricsText && lyricsText.length > MAX_LYRICS_LENGTH) {
        console.warn(`Truncating lyrics text > ${MAX_LYRICS_LENGTH}`);
        lyricsText = lyricsText.slice(0, MAX_LYRICS_LENGTH);
      }

      // If no lyrics found
      if (!lyricsText && !syncedLyricsText) {
        return null;
      }

      // Check if we have synchronized lyrics (embedded object or complex structure)
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
    } catch (error) {
      console.error('Unexpected error extracting lyrics:', error);
      return null;
    }
  }

  /**
   * Parse synchronized lyrics from SYLT tag
   * @param syltData - SYLT tag data
   * @returns Array of synchronized lyrics lines
   */
  private static parseSynchronizedLyrics(syltData: any): any[] | null {
    try {
      if (!syltData) return null;

      // SYLT format varies, try to handle common cases
      
      // Case 1: String (LRC or raw)
      if (typeof syltData === 'string') {
        if (syltData.length > MAX_LYRICS_LENGTH) {
            syltData = syltData.slice(0, MAX_LYRICS_LENGTH);
        }
        // If it's a string, try to parse as LRC
        return LRCParser.parse(syltData);
      }

      // Case 2: Array of objects
      if (Array.isArray(syltData)) {
        if (syltData.length > 5000) { // Limit number of lines
            syltData = syltData.slice(0, 5000);
        }

        const cleanData: any[] = [];
        
        for (const item of syltData) {
            if (!item || typeof item !== 'object') continue;

            let time = 0;
            // Validate time
            if (typeof item.time === 'number') {
                time = item.time;
            } else if (typeof item.time === 'string') {
                time = parseInt(item.time, 10) || 0;
            }

            // Bound time
            if (time < 0 || time > 86400000) continue;

            // Validate text
            let text = '';
            const rawText = item.text || item.lyrics || '';
            if (typeof rawText === 'string') {
                text = rawText.slice(0, 500); // 500 chars limit per line
            }

            cleanData.push({ time, text });
        }
        return cleanData;
      }

      return null;
    } catch (error) {
      console.error('Error parsing SYLT:', error);
      return null;
    }
  }

  /**
   * Extract plain text from synchronized lyrics
   * @param lines - Synchronized lyrics lines
   * @returns Plain text lyrics
   */
  private static extractPlainText(lines: any[]): string {
    if (!Array.isArray(lines) || lines.length === 0) return '';
    // Security limit
    const safeLines = lines.slice(0, 1000); 
    
    return safeLines
        .map(line => line.text)
        .filter(t => typeof t === 'string')
        .join('\n')
        .slice(0, MAX_LYRICS_LENGTH);
  }

  /**
   * Clean lyrics text (remove extra whitespace, normalize line breaks)
   * @param text - Raw lyrics text
   * @returns Cleaned lyrics text
   */
  private static cleanLyricsText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    if (text.length > MAX_LYRICS_LENGTH) text = text.slice(0, MAX_LYRICS_LENGTH);

    // Limit line cleaning steps
    const lines = text.split(/\r?\n/).slice(0, 1000);
    
    return lines
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
    if (!this.validateTags(tags)) return false;

    // Safe existence check
    try {
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
    } catch {
        return false;
    }
  }

  /**
   * Detect lyrics language from tags
   * @param tags - Tags object from jsmediatags
   * @returns Language code or undefined
   */
  static detectLanguage(tags: any): string | undefined {
    if (!this.validateTags(tags)) return undefined;

    try {
        let lang: unknown;
        // Try to get language from USLT tag
        if (tags.USLT?.data?.language) {
            lang = tags.USLT.data.language;
        } else {
            // Try common language tags
            lang = tags.LANGUAGE || tags.language;
        }

        if (typeof lang === 'string') {
            // Validate language code format (ISO 639-1/2 typically 2 or 3 chars)
            // Allow simplified check: 2-3 alpha chars
            const cleanLang = lang.trim().toLowerCase().slice(0, 3);
            if (/^[a-z]{2,3}$/.test(cleanLang)) {
                return cleanLang;
            }
        }
    } catch {
        // ignore errors
    }
    return undefined;
  }
}
