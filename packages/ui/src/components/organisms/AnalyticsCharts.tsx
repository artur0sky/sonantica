import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveCalendar } from '@nivo/calendar';
import { AnalyticsCard } from '../atoms/AnalyticsAtoms';

/**
 * Sonántica Nivo Theme
 * Standardized look for all charts.
 */
const getNivoTheme = (accentColor: string = '#6366f1') => ({
  textColor: 'rgba(255, 255, 255, 0.5)',
  fontSize: 11,
  axis: {
    domain: { line: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 } },
    legend: { text: { fontSize: 12, fontWeight: 'bold', fill: 'rgba(255, 255, 255, 0.3)' } },
    ticks: { line: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }, text: { fill: 'rgba(255, 255, 255, 0.5)' } },
  },
  grid: { line: { stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 1 } },
  tooltip: {
    container: {
      background: '#1a1a1a',
      color: '#ffffff',
      fontSize: 12,
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
  crosshair: { line: { stroke: accentColor, strokeWidth: 1, strokeOpacity: 0.35 } },
  dots: { text: { fill: '#ffffff' } },
  labels: { text: { fill: '#ffffff' } },
  legends: { text: { fill: 'rgba(255, 255, 255, 0.7)' } },
});

// --- Components ---

interface ChartProps {
  title: string;
  data: any[];
  height?: number;
  className?: string;
  loading?: boolean;
}

/**
 * Playback Timeline (Line/Area Chart)
 */
export const PlaybackLineChart: React.FC<ChartProps> = ({ title, data, height = 300, className }) => {
  return (
    <AnalyticsCard title={title} height={height} className={className}>
      <ResponsiveLine
        data={data}
        theme={getNivoTheme()}
        margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Time',
          legendOffset: 36,
          legendPosition: 'middle'
        }}
        enableArea={true}
        areaOpacity={0.15}
        colors={['#6366f1', '#ec4899', '#06b6d4']}
        pointSize={8}
        pointColor={{ from: 'color', modifiers: [] }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        useMesh={true}
        enableSlices="x"
      />
    </AnalyticsCard>
  );
};

/**
 * Genre Distribution (Bar Chart)
 */
export const GenreBarChart: React.FC<ChartProps> = ({ title, data, height = 300, className }) => (
  <AnalyticsCard title={title} height={height} className={className}>
    <ResponsiveBar
      data={data}
      keys={['count']}
      indexBy="genre"
      theme={getNivoTheme()}
      margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
      padding={0.4}
      layout="horizontal"
      colors={{ scheme: 'nivo' }}
      borderRadius={6}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Genres',
        legendOffset: -50,
        legendPosition: 'middle'
      }}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      role="application"
    />
  </AnalyticsCard>
);

/**
 * Platform Distribution (Pie Chart)
 */
export const PlatformPieChart: React.FC<ChartProps> = ({ title, data, height = 300, className }) => (
  <AnalyticsCard title={title} height={height} className={className}>
    <ResponsivePie
      data={data}
      theme={getNivoTheme()}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      innerRadius={0.6}
      padAngle={2}
      cornerRadius={8}
      activeOuterRadiusOffset={8}
      colors={{ scheme: 'category10' }}
      borderWidth={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="rgba(255, 255, 255, 0.5)"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
    />
  </AnalyticsCard>
);

/**
 * Activity Heatmap (Hour vs Day)
 */
export const ActivityHeatmap: React.FC<ChartProps> = ({ title, data, height = 350, className }) => (
  <AnalyticsCard title={title} height={height} className={className}>
    <ResponsiveHeatMap
      data={data}
      theme={getNivoTheme()}
      margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
      valueFormat=">-.0s"
      axisTop={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -90,
        legend: '',
        legendOffset: 46
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Day',
        legendPosition: 'middle',
        legendOffset: -40
      }}
      colors={{
        type: 'sequential',
        scheme: 'purples',
      }}
      emptyColor="#111111"
      borderRadius={4}
      labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
    />
  </AnalyticsCard>
);

/**
 * Consistency Calendar
 */
export const ListeningCalendar: React.FC<ChartProps & { from: string, to: string }> = ({ title, data, from, to, height = 200, className }) => (
  <AnalyticsCard title={title} height={height} className={className}>
    <ResponsiveCalendar
      data={data}
      from={from}
      to={to}
      theme={getNivoTheme()}
      emptyColor="rgba(255, 255, 255, 0.05)"
      colors={['#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#818cf8']}
      margin={{ top: 20, right: 0, bottom: 20, left: 30 }}
      yearSpacing={40}
      monthBorderColor="rgba(255, 255, 255, 0.1)"
      dayBorderWidth={2}
      dayBorderColor="#0a0a0a"
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'row',
          translateY: 36,
          itemCount: 4,
          itemWidth: 34,
          itemHeight: 36,
          itemDirection: 'top-to-bottom'
        }
      ]}
    />
  </AnalyticsCard>
);
