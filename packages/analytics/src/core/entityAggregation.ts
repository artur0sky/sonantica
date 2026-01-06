/**
 * Artist and Album Analytics Aggregation Utilities
 */

import { ArtistMetrics, AlbumMetrics, OverviewStats, TopTrack, TimelineData } from '../types/metrics';
import { aggregateOverview, aggregateTopTracks, aggregateTimeline, aggregatePlatformStats } from './aggregation';

export function aggregateArtistMetrics(metrics: ArtistMetrics[]): ArtistMetrics {
  if (metrics.length === 0) {
    return {
      artistName: '',
      overview: aggregateOverview([]),
      topTracks: [],
      playbackTimeline: [],
      fanDemographics: []
    };
  }

  return {
    artistId: metrics[0].artistId,
    artistName: metrics[0].artistName,
    overview: aggregateOverview(metrics.map(m => m.overview)),
    topTracks: aggregateTopTracks(metrics.flatMap(m => m.topTracks || []), 10),
    playbackTimeline: aggregateTimeline(metrics.flatMap(m => m.playbackTimeline || [])),
    fanDemographics: aggregatePlatformStats(metrics.flatMap(m => m.fanDemographics || []))
  };
}

export function aggregateAlbumMetrics(metrics: AlbumMetrics[]): AlbumMetrics {
  if (metrics.length === 0) {
    return {
      albumTitle: '',
      artistName: '',
      overview: aggregateOverview([]),
      trackPerformance: [],
      playbackTimeline: []
    };
  }

  return {
    albumId: metrics[0].albumId,
    albumTitle: metrics[0].albumTitle,
    artistName: metrics[0].artistName,
    overview: aggregateOverview(metrics.map(m => m.overview)),
    trackPerformance: aggregateTopTracks(metrics.flatMap(m => m.trackPerformance || []), 20),
    playbackTimeline: aggregateTimeline(metrics.flatMap(m => m.playbackTimeline || []))
  };
}
