import { useMemo } from 'react';
import {
  useEntityAnalytics,
  type AlbumMetrics,
  type TopTrack,
  type TimelineData
} from '@sonantica/analytics';
import { getServersConfig } from '../../../services/LibraryService';
import {
  StatCard,
  PlaybackLineChart,
  TopList
} from '@sonantica/ui';
import {
  IconHeadphones,
  IconClock,
  IconTrophy,
  IconChartPie
} from '@tabler/icons-react';

interface AlbumAnalyticsSectionProps {
  albumTitle: string;
  artistName: string;
  albumId?: string;
}

export function AlbumAnalyticsSection({ albumTitle, artistName, albumId }: AlbumAnalyticsSectionProps) {
  const serversConfig = useMemo(() => getServersConfig(), []);
  
  const { data, loading, error } = useEntityAnalytics<AlbumMetrics>(
    'album',
    albumTitle,
    serversConfig.servers,
    { artistName, albumId, period: 'all', limit: 20 }
  );

  if (!loading && !data && !error) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <IconChartPie className="text-accent" size={28} />
        <h2 className="text-2xl font-bold">Album Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Album Plays"
          value={data?.overview?.totalPlays || 0}
          icon={<IconHeadphones size={20} />}
          loading={loading}
        />
        <StatCard
          label="Total Time"
          value={data?.overview ? Math.round(data.overview.totalPlayTime / 60) : 0}
          unit="min"
          icon={<IconClock size={20} />}
          loading={loading}
        />
        <StatCard
          label="Average Completion"
          value={data?.overview?.completionRate || 0}
          unit="%"
          icon={<IconTrophy size={20} />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PlaybackLineChart 
          title="Streaming Trend"
          data={data?.playbackTimeline ? [{
            id: 'Plays',
            data: data.playbackTimeline.map((t: TimelineData) => ({
              x: t.date,
              y: t.playCount
            }))
          }] : []} 
          loading={loading}
        />

        <TopList 
          title="Track Retention"
          items={data?.trackPerformance.map((t: TopTrack) => ({
            id: t.trackId,
            title: t.trackTitle,
            subtitle: `${t.playCount} plays`,
            value: t.completionRate,
            percentage: t.completionRate,
            image: t.albumArt
          })) || []}
          itemTypeLabel="Completion"
          loading={loading}
        />
      </div>
    </div>
  );
}
