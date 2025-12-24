/**
 * LRC Parser - Synchronized Lyrics Parser
 * 
 * "Sound is language."
 * 
 * Parses LRC (Lyric) format for synchronized lyrics.
 * Supports standard LRC format with timestamps.
 * 
 * Format: [mm:ss.xx]Lyric text
 * Example: [00:12.00]First line of lyrics
 */

import type { LyricsLine } from '@sonantica/shared';

/**
 * Parse LRC format lyrics into structured data
 */
export class LRCParser {
  /**
   * Parse LRC text into synchronized lyrics lines
   * @param lrcText - Raw LRC format text
   * @returns Array of synchronized lyrics lines
   */
  static parse(lrcText: string): LyricsLine[] {
    if (!lrcText || typeof lrcText !== 'string') {
      return [];
    }

    const lines: LyricsLine[] = [];
    const lrcLines = lrcText.split('\n');

    // LRC timestamp regex: [mm:ss.xx] or [mm:ss]
    const timestampRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (const line of lrcLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Extract all timestamps from the line
      const timestamps: number[] = [];
      let match;
      let lastIndex = 0;

      while ((match = timestampRegex.exec(trimmedLine)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

        // Convert to milliseconds
        const timeMs = (minutes * 60 + seconds) * 1000 + centiseconds;
        timestamps.push(timeMs);
        lastIndex = match.index + match[0].length;
      }

      // Extract the lyric text (everything after the last timestamp)
      const text = trimmedLine.substring(lastIndex).trim();

      // Skip metadata lines (e.g., [ar:Artist], [ti:Title])
      if (timestamps.length === 0 || !text) continue;

      // Add a line for each timestamp (some LRC files have multiple timestamps for the same text)
      for (const time of timestamps) {
        lines.push({ time, text });
      }
    }

    // Sort by time
    return lines.sort((a, b) => a.time - b.time);
  }

  /**
   * Check if text is in LRC format
   * @param text - Text to check
   * @returns True if text appears to be LRC format
   */
  static isLRC(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    // Check for at least one timestamp pattern
    const timestampRegex = /\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/;
    return timestampRegex.test(text);
  }

  /**
   * Extract metadata from LRC file
   * @param lrcText - Raw LRC format text
   * @returns Metadata object
   */
  static extractMetadata(lrcText: string): Record<string, string> {
    if (!lrcText || typeof lrcText !== 'string') {
      return {};
    }

    const metadata: Record<string, string> = {};
    const metadataRegex = /\[([a-z]{2}):(.*?)\]/gi;
    let match;

    while ((match = metadataRegex.exec(lrcText)) !== null) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      
      // Common LRC metadata tags
      const knownTags = ['ar', 'ti', 'al', 'au', 'by', 'offset', 're', 've'];
      if (knownTags.includes(key)) {
        metadata[key] = value;
      }
    }

    return metadata;
  }

  /**
   * Get the current lyric line for a given time
   * @param lines - Synchronized lyrics lines
   * @param currentTimeMs - Current playback time in milliseconds
   * @returns Current lyric line or null
   */
  static getCurrentLine(lines: LyricsLine[], currentTimeMs: number): LyricsLine | null {
    if (!lines || lines.length === 0) return null;

    // Find the last line that has passed
    let currentLine: LyricsLine | null = null;
    
    for (const line of lines) {
      if (line.time <= currentTimeMs) {
        currentLine = line;
      } else {
        break;
      }
    }

    return currentLine;
  }

  /**
   * Get the next lyric line for a given time
   * @param lines - Synchronized lyrics lines
   * @param currentTimeMs - Current playback time in milliseconds
   * @returns Next lyric line or null
   */
  static getNextLine(lines: LyricsLine[], currentTimeMs: number): LyricsLine | null {
    if (!lines || lines.length === 0) return null;

    for (const line of lines) {
      if (line.time > currentTimeMs) {
        return line;
      }
    }

    return null;
  }

  /**
   * Convert synchronized lyrics back to LRC format
   * @param lines - Synchronized lyrics lines
   * @param metadata - Optional metadata
   * @returns LRC format text
   */
  static serialize(lines: LyricsLine[], metadata?: Record<string, string>): string {
    let lrc = '';

    // Add metadata
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        lrc += `[${key}:${value}]\n`;
      }
      lrc += '\n';
    }

    // Add lyrics lines
    for (const line of lines) {
      const minutes = Math.floor(line.time / 60000);
      const seconds = Math.floor((line.time % 60000) / 1000);
      const centiseconds = Math.floor((line.time % 1000) / 10);
      
      lrc += `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]${line.text}\n`;
    }

    return lrc;
  }
}
