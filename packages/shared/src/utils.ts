/**
 * Utility functions for Sonántica
 * 
 * "Adjust. Listen. Decide."
 * 
 * Security: Hardened against massive inputs and low entropy.
 */

// Max safe limits
const MAX_TIME_SECONDS = 3600 * 24; // 24 hours max for display
const MAX_STRING_LENGTH = 1000;

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  // Cap at 24 hours to prevent formatting attacks or UI breaks
  if (seconds > MAX_TIME_SECONDS) {
      seconds = MAX_TIME_SECONDS;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Checks if a MIME type is supported
 */
export function isSupportedFormat(mimeType: string): boolean {
  if (!mimeType || typeof mimeType !== 'string' || mimeType.length > 100) return false;

  const SUPPORTED_FORMATS = [
    'audio/flac',
    'audio/x-flac',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/aiff',
    'audio/x-aiff',
    'audio/mpeg',
    'audio/mp3',
    'audio/aac',
    'audio/ogg',
    'audio/opus',
  ];
  
  return SUPPORTED_FORMATS.includes(mimeType.toLowerCase());
}

/**
 * Generates a unique ID
 * Uses crypto.getRandomValues if available for better entropy
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
  }
  // Fallback
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a stable ID from a string (hash)
 */
export function generateStableId(input: string): string {
  if (!input || typeof input !== 'string') return 'id-0';
  
  // Truncate input for performance on huge strings
  const safeInput = input.length > MAX_STRING_LENGTH ? input.slice(0, MAX_STRING_LENGTH) : input;

  let hash = 0;
  for (let i = 0; i < safeInput.length; i++) {
    const char = safeInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Convert to positive hex string and add prefix for clarity
  return `id-${Math.abs(hash).toString(16)}`;
}
