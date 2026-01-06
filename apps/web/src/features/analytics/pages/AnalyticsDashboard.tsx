import { useMemo } from 'react';
import { 
  StatCard, 
  DashboardGrid, 
  TopList, 
  PlaybackLineChart, 
  GenreBarChart, 
  PlatformPieChart,
  ActivityHeatmap,
  ListeningCalendar,
  PageHeader,
  EmptyState
} from '@sonantica/ui';
import { 
  IconHeadphones, 
  IconClock, 
  IconFlame, 
  IconDisc, 
  IconChartBar,
  IconAlertCircle,
  IconRefresh
} from '@tabler/icons-react';
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard';

/**
 * Analytics Dashboard Page
 * Showcases the listening habits and system telemetry using real data.
 */
export const AnalyticsDashboard = () => {
  const { data, loading, error, refresh } = useAnalyticsDashboard({
    period: 'week',
    limit: 20
  });

  // Map Data to UI Components
  const stats = useMemo(() => {
    if (!data) return [];
    
    // Format duration to hours/minutes
    const formatDuration = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      return hrs.toString();
    };

    return [
      { label: 'Total Plays', value: data.overview.totalPlays.toLocaleString(), trend: data.overview.playsChange, icon: <IconHeadphones size={18} /> },
      { label: 'Listening Time', value: formatDuration(data.overview.totalPlayTime), unit: 'hrs', trend: data.overview.playTimeChange, icon: <IconClock size={18} /> },
      { label: 'Daily Streak', value: data.listeningStreak.currentStreak.toString(), unit: 'days', trend: 0, icon: <IconFlame size={18} /> },
      { label: 'Library Size', value: data.overview.uniqueTracks.toLocaleString(), unit: 'tracks', trend: 0, icon: <IconDisc size={18} /> },
    ];
  }, [data]);

  const playbackData = useMemo(() => {
    if (!data?.playbackTimeline || data.playbackTimeline.length === 0) return [];
    
    return [
      {
        id: "Plays",
        color: "hsl(243, 75%, 59%)",
        data: data.playbackTimeline.map(point => ({
          x: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
          y: point.playCount || 0
        }))
      }
    ];
  }, [data]);

  const topTracks = useMemo(() => {
    if (!data?.topTracks || data.topTracks.length === 0) return [];
    
    const maxPlays = data.topTracks.length > 0 ? data.topTracks[0].playCount : 1;

    return data.topTracks.map(track => ({
      id: track.trackId,
      title: track.trackTitle || 'Unknown Track',
      subtitle: track.artistName || 'Unknown Artist',
      value: track.playCount || 0,
      image: track.albumArt,
      percentage: (track.playCount / maxPlays) * 100
    }));
  }, [data]);

  const genreData = useMemo(() => {
    if (!data?.genreDistribution || data.genreDistribution.length === 0) return [];
    
    return data.genreDistribution.map(g => ({
      genre: g.genre || 'Unknown',
      count: g.playCount || 0
    }));
  }, [data]);

  const platformData = useMemo(() => {
    if (!data?.platformStats || data.platformStats.length === 0) return [];
    
    return data.platformStats.map(p => ({
      id: p.platform || 'unknown',
      label: (p.platform || 'unknown').charAt(0).toUpperCase() + (p.platform || 'unknown').slice(1),
      value: p.sessionCount || 0
    }));
  }, [data]);

  const heatmapData = useMemo(() => {
    if (!data?.listeningHeatmap || data.listeningHeatmap.length === 0) return [];
    
    // Nivo Heatmap expects rows as ID with data array
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: any[] = days.map(day => ({ id: day, data: [] }));

    // Grouping by day of week
    data.listeningHeatmap.forEach(item => {
      if (!item) return;
      const dayIndex = item.dayOfWeek ?? 0;
      const hourStr = item.hour !== undefined ? `${item.hour.toString().padStart(2, '0')}:00` : '00:00';
      
      if (result[dayIndex]) {
        result[dayIndex].data.push({
          x: hourStr,
          y: item.value || 0
        });
      }
    });

    return result.filter((d: any) => d.data.length > 0);
  }, [data]);

  const calendarData = useMemo(() => {
    if (!data?.listeningHeatmap || data.listeningHeatmap.length === 0) return [];
    
    return data.listeningHeatmap.map(item => ({
      day: item.date,
      value: item.value || 0
    }));
  }, [data]);

  const dashboardItems = useMemo(() => {
    if (!data) return [];

    return [
      ...stats.map((s, i) => ({
        id: `stat-${i}`,
        colSpan: 1 as const,
        component: <StatCard {...s} loading={loading} />
      })),
      {
        id: 'playback-history',
        colSpan: 2 as const,
        component: <PlaybackLineChart title="Playback Volume" data={playbackData} height={300} loading={loading} />
      },
      {
        id: 'top-tracks',
        colSpan: 2 as const,
        component: <TopList title="Most Played" items={topTracks} icon={<IconFlame size={18} />} loading={loading} />
      },
      {
        id: 'genres',
        colSpan: 2 as const,
        component: <GenreBarChart title="Genre Breakdown" data={genreData} height={350} loading={loading} />
      },
      {
        id: 'platforms',
        colSpan: 2 as const,
        component: <PlatformPieChart title="Device Usage" data={platformData} height={350} loading={loading} />
      },
      {
        id: 'heatmap',
        colSpan: 4 as const,
        component: <ActivityHeatmap title="Listening Times (Heatmap)" data={heatmapData} loading={loading} />
      },
      {
        id: 'calendar',
        colSpan: 4 as const,
        component: <ListeningCalendar 
          title="Consistency Calendar" 
          data={calendarData} 
          from={new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]} 
          to={new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]} 
          height={200} 
          loading={loading}
        />
      }
    ];
  }, [data, loading, stats, playbackData, topTracks, genreData, platformData, heatmapData, calendarData]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <EmptyState
          icon={<IconAlertCircle size={48} className="text-red-500" />}
          title="Telemetry Connection Failed"
          description="We couldn't reach the analytics service. Please check if the core service is running."
          action={
            <button 
              onClick={refresh}
              className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-full hover:bg-accent/80 transition-colors"
            >
              <IconRefresh size={18} />
              <span>Try Again</span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
      <PageHeader 
        title="Listening Analytics" 
        subtitle={
          <div className="flex items-center gap-2">
            <IconChartBar size={16} className="text-accent" />
            <span>Real-time technical metrics and listening history.</span>
          </div>
        }
      />

      {!data && loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-surface/40 rounded-2xl border border-border/50" />
          ))}
        </div>
      ) : (
        <DashboardGrid items={dashboardItems} />
      )}
    </div>
  );
};
