

import { Track } from '@sonantica/shared';

export interface ExternalRecommendationRequest {
  track_id?: string;
  artist_id?: string;
  limit: number;
  diversity?: number;
  context?: string[];
  weights?: {
      audio: number;
      lyrics: number;
      visual: number;
      stems: number;
  };
}

export interface ExternalRecommendationResponse {
    id: string;
    type: string;
    score: number;
    reason: string;
    track?: Track;
    album?: any;
    artist?: any;
}

export type ExternalFetcher = (req: ExternalRecommendationRequest) => Promise<ExternalRecommendationResponse[]>;
