/**
 * Decode text from bytes (supports ISO-8859-1 and UTF-8)
 */
export function decodeText(bytes: Uint8Array): string {
  try {
    // Try UTF-8 first
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    // Fallback to ISO-8859-1
    return new TextDecoder('iso-8859-1').decode(bytes);
  }
}

/**
 * Parse multiple values from a string (artists, genres, etc.)
 * Supports separators: ; / feat. ft. & and
 */
export function parseMultipleValues(text: string): string | string[] {
  if (!text) return text;
  
  // Common separators for multiple values
  const separators = /[;/]|\s+(?:feat\.?|ft\.?|&|and)\s+/gi;
  
  const values = text
    .split(separators)
    .map(v => v.trim())
    .filter(v => v.length > 0);
  
  // Return single string if only one value, array if multiple
  return values.length === 1 ? values[0] : values;
}

/**
 * Convert bytes to Base64 Data URL
 */
export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}
