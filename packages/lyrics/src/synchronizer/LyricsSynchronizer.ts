/**
 * Lyrics Synchronizer - Synchronize unsynchronized lyrics
 * 
 * "Listening is an active act."
 * 
 * Provides utilities to help synchronize lyrics with audio playback.
 * This is a foundation for future manual or AI-assisted synchronization.
 * 
 * Security: Hardened against infinite loops and invalid array operations.
 */

import type { LyricsLine, Lyrics } from '@sonantica/shared';

// Security constraints
const MAX_LINES = 5000;
const MAX_TEXT_LENGTH = 100 * 1024; // 100 KB
const MAX_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Lyrics synchronization utilities
 */
export class LyricsSynchronizer {
  
  /**
   * Split unsynchronized lyrics into lines
   * @param text - Unsynchronized lyrics text
   * @returns Array of lyric text lines
   */
  static splitIntoLines(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    // Length check
    if (text.length > MAX_TEXT_LENGTH) {
        text = text.slice(0, MAX_TEXT_LENGTH);
    }

    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    // Limit line count
    if (lines.length > MAX_LINES) {
        return lines.slice(0, MAX_LINES);
    }
    return lines;
  }

  /**
   * Create synchronized lyrics from text and timestamps
   * @param lines - Array of lyric text lines
   * @param timestamps - Array of timestamps in milliseconds
   * @returns Synchronized lyrics lines
   */
  static createSynchronized(lines: string[], timestamps: number[]): LyricsLine[] {
    if (!lines || !timestamps) {
        throw new Error('Invalid input: lines or timestamps missing');
    }
    
    // Bounds checking
    if (lines.length > MAX_LINES) lines = lines.slice(0, MAX_LINES);
    if (timestamps.length > MAX_LINES) timestamps = timestamps.slice(0, MAX_LINES);

    // Ensure matched lengths safely
    const count = Math.min(lines.length, timestamps.length);
    const safeLines = lines.slice(0, count);
    const safeTimestamps = timestamps.slice(0, count);

    const syncedLines: LyricsLine[] = safeLines.map((text, index) => {
        // Validate inputs
        let time = safeTimestamps[index];
        if (typeof time !== 'number' || !isFinite(time)) time = 0;
        time = Math.max(0, Math.min(time, MAX_DURATION_MS));
        
        let safeText = text;
        if (typeof safeText !== 'string') safeText = '';
        
        return {
            time,
            text: safeText,
        };
    });

    // Sort by time
    return syncedLines.sort((a, b) => a.time - b.time);
  }

  /**
   * Convert unsynchronized lyrics to synchronized format
   * @param lyrics - Unsynchronized lyrics
   * @param timestamps - Array of timestamps in milliseconds
   * @returns Synchronized lyrics
   */
  static synchronize(lyrics: Lyrics, timestamps: number[]): Lyrics {
    if (!lyrics || typeof lyrics !== 'object') {
        throw new Error('Invalid lyrics object');
    }
    // Prevent re-syncing if already synced (logic from original, but hardened check)
    if (lyrics.isSynchronized) {
      // Not actually an error for security, but logic. 
      // Original threw error, so we keep that behavior but ensure types exist.
      throw new Error('Lyrics must be unsynchronized text');
    }

    if (!lyrics.text) {
         throw new Error('No lyrics text provided');
    }

    const lines = this.splitIntoLines(lyrics.text);
    const syncedLines = this.createSynchronized(lines, timestamps);

    return {
      ...lyrics,
      synced: syncedLines,
      isSynchronized: true,
      source: lyrics.source || 'user',
    };
  }

  /**
   * Auto-distribute timestamps evenly across duration
   * This is a simple fallback for when no timing data is available
   * @param text - Unsynchronized lyrics text
   * @param durationMs - Total duration in milliseconds
   * @returns Synchronized lyrics with evenly distributed timestamps
   */
  static autoDistribute(text: string, durationMs: number): LyricsLine[] {
    if (typeof durationMs !== 'number' || !isFinite(durationMs) || durationMs < 0) {
        durationMs = 0;
    }
    // Capping duration
    durationMs = Math.min(durationMs, MAX_DURATION_MS);

    const lines = this.splitIntoLines(text);
    if (lines.length === 0) return [];

    const interval = durationMs / lines.length;
    
    return lines.map((text, index) => ({
      time: Math.floor(interval * index),
      text,
    }));
  }

  /**
   * Validate synchronized lyrics
   * @param lines - Synchronized lyrics lines
   * @returns True if valid
   */
  static validate(lines: LyricsLine[]): boolean {
    if (!Array.isArray(lines) || lines.length === 0) return false;
    
    // Bounds check
    if (lines.length > MAX_LINES) return false;

    // Check that all lines have time and text
    for (const line of lines) {
      if (!line || typeof line !== 'object') return false;
      if (typeof line.time !== 'number' || !isFinite(line.time) || line.time < 0) return false;
      if (typeof line.text !== 'string') return false;
    }

    // Check that times are in ascending order
    for (let i = 1; i < lines.length; i++) {
        // Allow Equal times (duplicates), but generally should be increasing
      if (lines[i].time < lines[i - 1].time) return false;
    }

    return true;
  }

  /**
   * Adjust timing offset for all lyrics lines
   * @param lines - Synchronized lyrics lines
   * @param offsetMs - Offset in milliseconds (positive or negative)
   * @returns Adjusted lyrics lines
   */
  static adjustOffset(lines: LyricsLine[], offsetMs: number): LyricsLine[] {
    if (!Array.isArray(lines)) return [];
    if (typeof offsetMs !== 'number' || !isFinite(offsetMs)) return lines;

    return lines.map(line => ({
      ...line,
      time: Math.max(0, Math.min(line.time + offsetMs, MAX_DURATION_MS)),
    }));
  }

  /**
   * Merge multiple synchronized lyrics (for multi-language support)
   * @param primaryLines - Primary language lyrics
   * @param secondaryLines - Secondary language lyrics
   * @returns Merged lyrics with both languages
   */
  static merge(primaryLines: LyricsLine[], secondaryLines: LyricsLine[]): LyricsLine[] {
    // Input validation
    if (!Array.isArray(primaryLines) || !Array.isArray(secondaryLines)) {
        return [];
    }

    const merged: LyricsLine[] = [];
    let i = 0, j = 0;
    let loops = 0;
    // Max iterations safety to prevent infinite loops logic errors
    const MAX_LOOPS = (primaryLines.length + secondaryLines.length) * 2; 

    while ((i < primaryLines.length || j < secondaryLines.length) && loops < MAX_LOOPS) {
      loops++;
      if (i >= primaryLines.length) {
        merged.push(secondaryLines[j++]);
      } else if (j >= secondaryLines.length) {
        merged.push(primaryLines[i++]);
      } else if (primaryLines[i].time <= secondaryLines[j].time) {
        merged.push(primaryLines[i++]);
      } else {
        merged.push(secondaryLines[j++]);
      }
    }
    
    // Truncate if too long
    if (merged.length > MAX_LINES) {
        merged.length = MAX_LINES;
    }

    return merged;
  }
}
