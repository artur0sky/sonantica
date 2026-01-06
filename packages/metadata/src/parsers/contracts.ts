import type { MediaMetadata } from '@sonantica/shared';

export interface IMetadataParser {
  /**
   * Check if this parser can handle the given data view
   */
  canParse(view: DataView): boolean;

  /**
   * Parse metadata from the data view
   */
  parse(view: DataView): Promise<Partial<MediaMetadata>>;
}
