/**
 * LRC Parser - Synchronized Lyrics Parser
 * 
 * "Sound is language."
 * 
 * Security: Hardened against ReDoS, resource exhaustion, and malformed inputs
 */

import type { LyricsLine } from '@sonantica/shared';

/**
 * Security constants
 */
const MAX_LRC_SIZE = 1024 * 1024; // 1MB max LRC file size
const MAX_LINES = 5000; // Max lines per file
const MAX_LINE_LENGTH = 1024; // Max chars per line
const MAX_TIMESTAMPS_PER_LINE = 10; // Max timestamps per single line

export class LRCParser {
  /**
   * Parse LRC text into synchronized lyrics lines
   * @param lrcText - Raw LRC format text
   * @returns Array of synchronized lyrics lines
   */
  static parse(lrcText: string): LyricsLine[] {
    try {
      if (!lrcText || typeof lrcText !== 'string') {
        return [];
      }

      // Size validation
      if (lrcText.length > MAX_LRC_SIZE) {
        console.warn(`LRC text too large (${lrcText.length} bytes), truncating`);
        lrcText = lrcText.slice(0, MAX_LRC_SIZE);
      }

      // Extract offset metadata if present
      const meta = this.extractMetadata(lrcText);
      const globalOffset = meta.offset ? parseInt(meta.offset, 10) : 0;

      const lines: LyricsLine[] = [];
      // Split safely
      const lrcLines = lrcText.split(/\r?\n/);

      if (lrcLines.length > MAX_LINES) {
        console.warn(`Too many lines in LRC (${lrcLines.length}), limiting to ${MAX_LINES}`);
        lrcLines.length = MAX_LINES;
      }

      // Safe regex with minimal backtracking
      const timestampRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;

      for (const line of lrcLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Skip overlong lines
        if (trimmedLine.length > MAX_LINE_LENGTH) continue;

        const timestamps: number[] = [];
        let match;
        let lastIndex = 0;
        let timestampCount = 0;

        // Reset regex state
        timestampRegex.lastIndex = 0;

        while ((match = timestampRegex.exec(trimmedLine)) !== null) {
          timestampCount++;
          if (timestampCount > MAX_TIMESTAMPS_PER_LINE) break;

          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

          // Safe math
          // Apply global offset: Positive offset means lyrics are delayed (timestamps should be smaller)
          // or lyrics are early (timestamps should be larger)?
          // Standard: offset = (LRC time) - (Audio time)
          // So Audio time = LRC time - offset.
          // We want the lyrics to trigger at (LRC time - offset) relative to audio context.
          const timeMs = (minutes * 60 + seconds) * 1000 + centiseconds - globalOffset;
          
          // Basic sanity check for timestamp (max 24 hours)
          if (timeMs >= -86400000 && timeMs < 86400000) {
            timestamps.push(Math.max(0, timeMs));
          }
          
          lastIndex = match.index + match[0].length;
        }

        // Extract the lyric text (everything after the last timestamp)
        const text = trimmedLine.substring(lastIndex).trim();

        if (timestamps.length === 0 || !text) continue;

        for (const time of timestamps) {
          lines.push({ time, text });
        }
      }

      // Sort by time
      return lines.sort((a, b) => a.time - b.time);

    } catch (error) {
      console.error('Error parsing LRC:', error);
      return [];
    }
  }

  /**
   * Check if text is in LRC format
   */
  static isLRC(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    if (text.length > MAX_LRC_SIZE) return false;
    
    // Check for at least one timestamp pattern (safe implementation)
    // Avoids scanning the whole file
    const sampleInfo = text.slice(0, 1024);
    const timestampRegex = /\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/;
    return timestampRegex.test(sampleInfo);
  }

  /**
   * Extract metadata from LRC file
   */
  static extractMetadata(lrcText: string): Record<string, string> {
    try {
      if (!lrcText || typeof lrcText !== 'string') {
        return {};
      }

      if (lrcText.length > MAX_LRC_SIZE) {
        lrcText = lrcText.slice(0, MAX_LRC_SIZE);
      }

      const metadata: Record<string, string> = {};
      
      // Use limit on matches to prevent DoS
      let limit = 100;
      const metadataRegex = /\[([a-z]{2}):(.*?)\]/gi;
      let match;

      while ((match = metadataRegex.exec(lrcText)) !== null && limit-- > 0) {
        const key = match[1].toLowerCase();
        // Limit value length
        const value = match[2].trim().slice(0, 256);
        
        const knownTags = ['ar', 'ti', 'al', 'au', 'by', 'offset', 're', 've', 'la'];
        if (knownTags.includes(key)) {
          metadata[key] = value;
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error extracted metadata:', error);
      return {};
    }
  }

  static getCurrentLine(lines: LyricsLine[], currentTimeMs: number): LyricsLine | null {
    if (!lines || !Array.isArray(lines) || lines.length === 0) return null;
    if (typeof currentTimeMs !== 'number') return null;

    let currentLine: LyricsLine | null = null;
    
    // Optimization: Binary search could be used here for very large files, 
    // but linear scan is fine for typical lyrics size (50-100 lines)
    // Loop limited by line count which is already parsed securely
    for (const line of lines) {
      if (line.time <= currentTimeMs) {
        currentLine = line;
      } else {
        break;
      }
    }

    return currentLine;
  }

  static getNextLine(lines: LyricsLine[], currentTimeMs: number): LyricsLine | null {
    if (!lines || !Array.isArray(lines) || lines.length === 0) return null;

    for (const line of lines) {
      if (line.time > currentTimeMs) {
        return line;
      }
    }

    return null;
  }

  static serialize(lines: LyricsLine[], metadata?: Record<string, string>): string {
    try {
      if (!Array.isArray(lines) || lines.length > MAX_LINES) {
        throw new Error('Invalid lines array');
      }

      let lrc = '';
      let outputSize = 0;

      // Add metadata
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          // Sanitization
          const cleanKey = key.replace(/[^a-z]/gi, '').slice(0, 2);
          const cleanValue = String(value).replace(/[\r\n]/g, '').slice(0, 256);
          const line = `[${cleanKey}:${cleanValue}]\n`;
          lrc += line;
          outputSize += line.length;
        }
        lrc += '\n';
      }

      // Add lyrics lines
      for (const line of lines) {
        if (outputSize > MAX_LRC_SIZE) break;

        // Validations
        if (typeof line.time !== 'number' || typeof line.text !== 'string') continue;

        const minutes = Math.floor(Math.max(0, line.time) / 60000);
        const seconds = Math.floor((Math.max(0, line.time) % 60000) / 1000);
        const centiseconds = Math.floor((Math.max(0, line.time) % 1000) / 10);
        
        // Clean text - prevent control characters
        const cleanText = line.text.replace(/[\0-\x1F\x7F]/g, '').slice(0, MAX_LINE_LENGTH);

        const strLine = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]${cleanText}\n`;
        lrc += strLine;
        outputSize += strLine.length;
      }

      return lrc;
    } catch (error) {
      console.error('Error serializing lyrics:', error);
      return '';
    }
  }
}
