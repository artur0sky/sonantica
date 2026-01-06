/**
 * Analytics Data Aggregation Utilities
 * 
 * Shared logic for merging data from multiple servers.
 * Part of @sonantica/analytics core.
 */

import type { 
  OverviewStats, 
  TopTrack, 
  HeatmapData, 
  TimelineData, 
  PlatformStats, 
  GenreStats, 
  StreakData 
} from '../types/metrics';

export function aggregateOverview(stats: OverviewStats[]): OverviewStats {
  const result: OverviewStats = {
    totalPlays: 0,
    totalPlayTime: 0,
    averageSessionDuration: 0,
    completionRate: 0,
    uniqueTracks: 0,
    uniqueAlbums: 0,
    uniqueArtists: 0,
    totalSessions: 0,
    averageTracksPerSession: 0,
    skipRate: 0,
    playsChange: 0,
    playTimeChange: 0,
    sessionsChange: 0,
    totalTracksInLibrary: 0,
    totalAlbumsInLibrary: 0,
    totalArtistsInLibrary: 0,
    formats: [],
    coverArtStats: { withCover: 0, withoutCover: 0, percentage: 0 }
  };

  let totalSessionTime = 0;
  let totalTracksPlayed = 0;

  stats.forEach(s => {
    if (!s) return;
    result.totalPlays += (s.totalPlays || 0);
    result.totalPlayTime += (s.totalPlayTime || 0);
    result.totalSessions += (s.totalSessions || 0);
    result.uniqueTracks += (s.uniqueTracks || 0);
    result.uniqueAlbums += (s.uniqueAlbums || 0);
    result.uniqueArtists += (s.uniqueArtists || 0);
    
    totalSessionTime += ((s.averageSessionDuration || 0) * (s.totalSessions || 0));
    totalTracksPlayed += ((s.averageTracksPerSession || 0) * (s.totalSessions || 0));
    
    result.completionRate += (s.completionRate || 0);
    result.skipRate += (s.skipRate || 0);

    result.totalTracksInLibrary += (s.totalTracksInLibrary || 0);
    result.totalAlbumsInLibrary += (s.totalAlbumsInLibrary || 0);
    result.totalArtistsInLibrary += (s.totalArtistsInLibrary || 0);
    result.coverArtStats.withCover += (s.coverArtStats?.withCover || 0);
    result.coverArtStats.withoutCover += (s.coverArtStats?.withoutCover || 0);

    if (s.formats && Array.isArray(s.formats)) {
       s.formats.forEach(f => {
         const existing = result.formats.find(rf => rf.format === f.format);
         if (existing) {
           existing.count += f.count;
         } else {
           result.formats.push({ ...f });
         }
       });
    }
  });

  const validStats = stats.filter(Boolean);

  if (result.totalSessions > 0) {
    result.averageSessionDuration = Math.round(totalSessionTime / result.totalSessions);
    result.averageTracksPerSession = Number((totalTracksPlayed / result.totalSessions).toFixed(2));
  }

  const totalAlbums = result.coverArtStats.withCover + result.coverArtStats.withoutCover;
  if (totalAlbums > 0) {
    result.coverArtStats.percentage = (result.coverArtStats.withCover / totalAlbums) * 100;
  }

  if (validStats.length > 0) {
    result.completionRate = (result.completionRate || 0) / validStats.length;
    result.skipRate = (result.skipRate || 0) / validStats.length;
    result.playsChange = validStats.reduce((acc, s) => acc + (s.playsChange || 0), 0) / validStats.length;
    result.playTimeChange = validStats.reduce((acc, s) => acc + (s.playTimeChange || 0), 0) / validStats.length;
    result.sessionsChange = validStats.reduce((acc, s) => acc + (s.sessionsChange || 0), 0) / validStats.length;
  }

  return result;
}

export function aggregateTopTracks(tracks: TopTrack[], limit = 10): TopTrack[] {
  const map = new Map<string, TopTrack>();
  
  tracks.forEach(t => {
    if (!t) return;
    const key = `${(t.trackTitle || '').toLowerCase()}||${(t.artistName || '').toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (t.playCount || 0);
      existing.playTime += (t.playTime || 0);
      existing.completionRate = (existing.completionRate + (t.completionRate || 0)) / 2;
    } else {
      map.set(key, { ...t });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit)
    .map((t, idx) => ({ ...t, rank: idx + 1 }));
}

export function aggregateHeatmap(data: HeatmapData[]): HeatmapData[] {
  const map = new Map<string, HeatmapData>();
  
  data.forEach(d => {
    if (!d) return;
    const key = `${d.date}||${d.hour || 'none'}`;
    const existing = map.get(key);
    if (existing) {
      existing.value += (d.value || 0);
    } else {
      map.set(key, { ...d });
    }
  });

  return Array.from(map.values());
}

export function aggregateTimeline(data: TimelineData[]): TimelineData[] {
  const map = new Map<string, TimelineData>();
  
  data.forEach(d => {
    if (!d) return;
    const key = d.date;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (d.playCount || 0);
      existing.playTime += (d.playTime || 0);
      existing.uniqueTracks += (d.uniqueTracks || 0);
      existing.uniqueArtists += (d.uniqueArtists || 0);
    } else {
      map.set(key, { ...d });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregatePlatformStats(stats: PlatformStats[]): PlatformStats[] {
  const map = new Map<string, PlatformStats>();
  let totalSessions = 0;

  stats.forEach(s => {
    if (!s) return;
    const key = s.platform;
    const existing = map.get(key);
    if (existing) {
      existing.sessionCount += (s.sessionCount || 0);
      existing.playCount += (s.playCount || 0);
      existing.playTime += (s.playTime || 0);
    } else {
      map.set(key, { ...s });
    }
    totalSessions += (s.sessionCount || 0);
  });

  return Array.from(map.values()).map(s => ({
    ...s,
    percentage: totalSessions > 0 ? (s.sessionCount / totalSessions) * 100 : 0
  }));
}

export function aggregateGenres(stats: GenreStats[]): GenreStats[] {
  const map = new Map<string, GenreStats>();
  let totalPlays = 0;

  stats.forEach(s => {
    if (!s) return;
    const key = s.genre;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (s.playCount || 0);
      existing.playTime += (s.playTime || 0);
    } else {
      map.set(key, { ...s });
    }
    totalPlays += (s.playCount || 0);
  });

  return Array.from(map.values()).map(s => ({
    ...s,
    percentage: totalPlays > 0 ? (s.playCount / totalPlays) * 100 : 0
  })).sort((a, b) => b.playCount - a.playCount);
}

export function aggregateStreak(streaks: StreakData[]): StreakData {
  const emptyStreak = { currentStreak: 0, longestStreak: 0, totalDaysActive: 0, totalWeeksActive: 0, streakStartDate: "" };
  if (streaks.length === 0) return emptyStreak;
  
  const validStreaks = streaks.filter(Boolean);
  if (validStreaks.length === 0) return emptyStreak;

  return {
    currentStreak: Math.max(...validStreaks.map(s => s.currentStreak || 0)),
    longestStreak: Math.max(...validStreaks.map(s => s.longestStreak || 0)),
    totalDaysActive: Math.max(...validStreaks.map(s => s.totalDaysActive || 0)),
    totalWeeksActive: Math.max(...validStreaks.map(s => s.totalWeeksActive || 0)),
    streakStartDate: validStreaks[0].streakStartDate || ""
  };
}
