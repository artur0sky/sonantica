/**
 * @sonantica/lyrics
 * 
 * "Sound is a form of language."
 * 
 * Lyrics extraction, parsing, and synchronization for Sonántica.
 * Handles embedded lyrics from audio files and LRC format parsing.
 */

export { LyricsExtractor } from './extractors/LyricsExtractor';
export { LRCParser } from './parsers/LRCParser';
export { LyricsSynchronizer } from './synchronizer/LyricsSynchronizer';

// Re-export types from shared
export type { Lyrics, LyricsLine } from '@sonantica/shared';
