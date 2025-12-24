/**
 * Lyrics Synchronizer - Synchronize unsynchronized lyrics
 * 
 * "Listening is an active act."
 * 
 * Provides utilities to help synchronize lyrics with audio playback.
 * This is a foundation for future manual or AI-assisted synchronization.
 */

import type { LyricsLine, Lyrics } from '@sonantica/shared';

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

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }

  /**
   * Create synchronized lyrics from text and timestamps
   * @param lines - Array of lyric text lines
   * @param timestamps - Array of timestamps in milliseconds
   * @returns Synchronized lyrics lines
   */
  static createSynchronized(lines: string[], timestamps: number[]): LyricsLine[] {
    if (!lines || !timestamps || lines.length !== timestamps.length) {
      throw new Error('Lines and timestamps must have the same length');
    }

    const syncedLines: LyricsLine[] = lines.map((text, index) => ({
      time: timestamps[index],
      text,
    }));

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
    if (!lyrics.text || lyrics.isSynchronized) {
      throw new Error('Lyrics must be unsynchronized text');
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

    // Check that all lines have time and text
    for (const line of lines) {
      if (typeof line.time !== 'number' || line.time < 0) return false;
      if (typeof line.text !== 'string') return false;
    }

    // Check that times are in ascending order
    for (let i = 1; i < lines.length; i++) {
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
    return lines.map(line => ({
      ...line,
      time: Math.max(0, line.time + offsetMs),
    }));
  }

  /**
   * Merge multiple synchronized lyrics (for multi-language support)
   * @param primaryLines - Primary language lyrics
   * @param secondaryLines - Secondary language lyrics
   * @returns Merged lyrics with both languages
   */
  static merge(primaryLines: LyricsLine[], secondaryLines: LyricsLine[]): LyricsLine[] {
    const merged: LyricsLine[] = [];
    let i = 0, j = 0;

    while (i < primaryLines.length || j < secondaryLines.length) {
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

    return merged;
  }
}
