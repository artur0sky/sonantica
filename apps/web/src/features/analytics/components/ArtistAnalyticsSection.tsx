import { useMemo } from 'react';
import { 
  useEntityAnalytics, 
  type ArtistMetrics,
  type TopTrack,
  type TimelineData,
  type PlatformStats
} from '@sonantica/analytics';
import { getServersConfig } from '../../../services/LibraryService';
import { 
  StatCard, 
  PlaybackLineChart, 
  TopList,
  PlatformPieChart 
} from '@sonantica/ui';
import { 
  IconHeadphones, 
  IconClock, 
  IconTrophy,
  IconChartBar
} from '@tabler/icons-react';

interface ArtistAnalyticsSectionProps {
  artistName: string;
  artistId?: string;
}

export function ArtistAnalyticsSection({ artistName, artistId }: ArtistAnalyticsSectionProps) {
  const serversConfig = useMemo(() => getServersConfig(), []);
  
  const { data, loading, error } = useEntityAnalytics<ArtistMetrics>(
    'artist',
    artistName,
    serversConfig.servers,
    { artistId, period: 'all', limit: 10 }
  );

  if (!loading && !data && !error) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <IconChartBar className="text-accent" size={28} />
        <h2 className="text-2xl font-bold">Artist Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Plays"
          value={data?.overview?.totalPlays || 0}
          icon={<IconHeadphones size={20} />}
          loading={loading}
          trend={data?.overview?.playsChange}
        />
        <StatCard
          label="Listening Time"
          value={data?.overview ? Math.round(data.overview.totalPlayTime / 60) : 0}
          unit="min"
          icon={<IconClock size={20} />}
          loading={loading}
        />
        <StatCard
          label="Completion Rate"
          value={data?.overview?.completionRate || 0}
          unit="%"
          icon={<IconTrophy size={20} />}
          loading={loading}
        />
        <StatCard
          label="Sessions"
          value={data?.overview?.totalSessions || 0}
          icon={<IconChartBar size={20} />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PlaybackLineChart 
          title="Listening History"
          data={data?.playbackTimeline ? [{
            id: 'Plays',
            data: data.playbackTimeline.map((t: TimelineData) => ({
              x: t.date,
              y: t.playCount
            }))
          }] : []} 
          loading={loading}
        />

        <PlatformPieChart 
          title="Fan Demographics"
          data={data?.fanDemographics.map((p: PlatformStats) => ({
            id: p.platform,
            label: p.platform,
            value: p.sessionCount
          })) || []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <TopList 
          title="Most Played Tracks"
          items={data?.topTracks.map((t: TopTrack) => ({
            id: t.trackId,
            title: t.trackTitle,
            subtitle: t.albumTitle,
            value: t.playCount,
            image: t.albumArt,
            percentage: data.overview.totalPlays > 0 ? (t.playCount / data.overview.totalPlays) * 100 : 0
          })) || []}
          loading={loading}
        />
      </div>
    </div>
  );
}
