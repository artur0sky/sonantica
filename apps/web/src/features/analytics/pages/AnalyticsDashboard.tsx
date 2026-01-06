import { 
  StatCard, 
  DashboardGrid, 
  TopList, 
  PlaybackLineChart, 
  GenreBarChart, 
  PlatformPieChart,
  ActivityHeatmap,
  ListeningCalendar,
  PageHeader
} from '@sonantica/ui';
import { 
  IconHeadphones, 
  IconClock, 
  IconFlame, 
  IconDisc, 
  IconChartBar
} from '@tabler/icons-react';

/**
 * Analytics Dashboard Page
 * Showcases the listening habits and system telemetry.
 */
export const AnalyticsDashboard = () => {
  // Mock Data - In a real app, this would come from the analytics service
  const stats = [
    { label: 'Total Plays', value: '1,284', trend: 12.5, icon: <IconHeadphones size={18} /> },
    { label: 'Listening Time', value: '42.5', unit: 'hrs', trend: 8.2, icon: <IconClock size={18} /> },
    { label: 'Daily Streak', value: '14', unit: 'days', trend: 0, icon: <IconFlame size={18} /> },
    { label: 'Library Size', value: '856', unit: 'tracks', trend: 2.1, icon: <IconDisc size={18} /> },
  ];

  const playbackData = [
    {
      id: "Plays",
      color: "hsl(243, 75%, 59%)",
      data: [
        { x: "Mon", y: 12 },
        { x: "Tue", y: 18 },
        { x: "Wed", y: 15 },
        { x: "Thu", y: 22 },
        { x: "Fri", y: 35 },
        { x: "Sat", y: 42 },
        { x: "Sun", y: 38 },
      ]
    }
  ];

  const topTracks = [
    { id: '1', title: 'Weightless', subtitle: 'Marconi Union', value: 42, percentage: 85 },
    { id: '2', title: 'Luminescence', subtitle: 'Ólafur Arnalds', value: 38, percentage: 70 },
    { id: '3', title: 'Solaris', subtitle: 'Cliff Martinez', value: 25, percentage: 50 },
    { id: '4', title: 'Resonance', subtitle: 'Home', value: 18, percentage: 35 },
    { id: '5', title: 'Clair de Lune', subtitle: 'Claude Debussy', value: 12, percentage: 20 },
  ];

  const genreData = [
    { genre: 'Ambient', count: 120 },
    { genre: 'Classical', count: 85 },
    { genre: 'Electronic', count: 64 },
    { genre: 'Jazz', count: 32 },
    { genre: 'Rock', count: 18 },
  ];

  const platformData = [
    { id: 'Desktop', label: 'Desktop', value: 65 },
    { id: 'Mobile', label: 'Mobile', value: 30 },
    { id: 'Web', label: 'Web', value: 5 },
  ];

  const heatmapData = [
    { id: 'Mon', data: [{ x: '00:00', y: 5 }, { x: '04:00', y: 2 }, { x: '08:00', y: 15 }, { x: '12:00', y: 22 }, { x: '16:00', y: 18 }, { x: '20:00', y: 10 }] },
    { id: 'Wed', data: [{ x: '00:00', y: 8 }, { x: '04:00', y: 4 }, { x: '08:00', y: 12 }, { x: '12:00', y: 25 }, { x: '16:00', y: 32 }, { x: '20:00', y: 15 }] },
    { id: 'Fri', data: [{ x: '00:00', y: 12 }, { x: '04:00', y: 6 }, { x: '08:00', y: 10 }, { x: '12:00', y: 35 }, { x: '16:00', y: 45 }, { x: '20:00', y: 22 }] },
    { id: 'Sun', data: [{ x: '00:00', y: 15 }, { x: '04:00', y: 10 }, { x: '08:00', y: 8 }, { x: '12:00', y: 15 }, { x: '16:00', y: 28 }, { x: '20:00', y: 40 }] },
  ];

  const calendarData = [
    { day: '2025-01-01', value: 10 },
    { day: '2025-01-02', value: 15 },
    { day: '2025-01-05', value: 22 },
  ];

  const dashboardItems = [
    ...stats.map((s, i) => ({
      id: `stat-${i}`,
      colSpan: 1 as const,
      component: <StatCard {...s} />
    })),
    {
      id: 'playback-history',
      colSpan: 2 as const,
      component: <PlaybackLineChart title="Weekly Playback" data={playbackData} height={300} />
    },
    {
      id: 'top-tracks',
      colSpan: 2 as const,
      component: <TopList title="Top Tracks" items={topTracks} icon={<IconFlame size={18} />} />
    },
    {
      id: 'genres',
      colSpan: 2 as const,
      component: <GenreBarChart title="Genres" data={genreData} height={350} />
    },
    {
      id: 'platforms',
      colSpan: 2 as const,
      component: <PlatformPieChart title="Devices" data={platformData} height={350} />
    },
    {
      id: 'heatmap',
      colSpan: 4 as const,
      component: <ActivityHeatmap title="Listening Activity (By Hour)" data={heatmapData} />
    },
    {
      id: 'calendar',
      colSpan: 4 as const,
      component: <ListeningCalendar title="2025 Contributions" data={calendarData} from="2025-01-01" to="2025-12-31" height={200} />
    }
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
      <PageHeader 
        title="Listening Analytics" 
        subtitle={
          <div className="flex items-center gap-2">
            <IconChartBar size={16} className="text-accent" />
            <span>Explore your sound journey and technical metrics.</span>
          </div>
        }
      />

      <DashboardGrid items={dashboardItems} />
    </div>
  );
};
