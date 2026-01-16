import { Track } from '../types/library';

/**
 * Merges a list of tracks based on metadata matching.
 */
export function mergeTracks<T extends Track>(tracks: T[], priority: string[] = ['local']): T[] {
  if (tracks.length === 0) return [];
  
  const mergedMap = new Map<string, T[]>();

  tracks.forEach(track => {
    if (!track) return;
    const title = (track.title || '').toLowerCase().trim();
    const artist = (track.artist || '').toLowerCase().trim();
    const album = (track.album || '').toLowerCase().trim();
    
    if (!title && !artist) return;
    
    const key = `${title}|${artist}|${album}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, [track]);
    } else {
      mergedMap.get(key)!.push(track);
    }
  });

  return Array.from(mergedMap.values()).map(group => {
    if (group.length === 1) {
      return { ...group[0], sources: [group[0]] };
    }

    const sortedGroup = [...group].sort((a, b) => {
      const aId = a.source === 'local' ? 'local' : (a.serverId || '');
      const bId = b.source === 'local' ? 'local' : (b.serverId || '');
      
      let aIndex = priority.indexOf(aId);
      let bIndex = priority.indexOf(bId);
      
      if (aIndex === -1) aIndex = 999;
      if (bIndex === -1) bIndex = 999;
      
      return aIndex - bIndex;
    });

    const representative = sortedGroup[0];
    
    return {
      ...representative,
      sources: sortedGroup
    };
  });
}

/**
 * Checks if a track is available locally among its sources.
 */
export function hasLocalSource(track: Track): boolean {
  if (track.source === 'local') return true;
  return track.sources?.some(s => s.source === 'local') ?? false;
}

/**
 * Gets the best source for playback based on priority.
 */
export function getBestSource<T extends Track>(track: T, priority: string[] = []): T {
  if (!track.sources || track.sources.length <= 1) return track;

  const sortedByPriority = [...track.sources].sort((a, b) => {
    const aId = a.source === 'local' ? 'local' : (a.serverId || '');
    const bId = b.source === 'local' ? 'local' : (b.serverId || '');
    
    let aIndex = priority.indexOf(aId);
    let bIndex = priority.indexOf(bId);
    
    if (aIndex === -1) aIndex = 999;
    if (bIndex === -1) bIndex = 999;
    
    return aIndex - bIndex;
  }) as T[];

  return sortedByPriority[0];
}

/**
 * Gets the best server to download from based on priority.
 */
export function getBestDownloadSource(track: Track, priority: string[] = [], defaultServerId: string | null = null): Track | null {
  if (!track.sources) return null;
  
  // Only consider remote sources
  const remoteSources = track.sources.filter(s => s.source === 'remote');
  if (remoteSources.length === 0) return null;

  // 1. If we have a default download server and it's available, use it
  if (defaultServerId) {
    const defaultSource = remoteSources.find(s => s.serverId === defaultServerId);
    if (defaultSource) return defaultSource;
  }

  // 2. Otherwise use the priority list
  if (priority.length > 0) {
    const sortedByPriority = [...remoteSources].sort((a, b) => {
        let aIndex = priority.indexOf(a.serverId || '');
        let bIndex = priority.indexOf(b.serverId || '');
        if (aIndex === -1) aIndex = 999;
        if (bIndex === -1) bIndex = 999;
        return aIndex - bIndex;
    });
    return sortedByPriority[0];
  }

  // 3. Fallback to first available remote source
  return remoteSources[0];
}
