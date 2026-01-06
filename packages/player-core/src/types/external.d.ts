/**
 * Type declarations for optional peer dependencies
 * These packages may or may not be installed at runtime
 */

declare module '@sonantica/metadata' {
  export function extractMetadata(url: string): Promise<{
    title?: string;
    artist?: string | string[];
    album?: string;
    year?: number;
    genre?: string | string[];
    duration?: number;
    coverArt?: string;
  }>;
}
