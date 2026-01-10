/**
 * Sonántica Nivo Theme
 * Standardized look for all charts.
 */
export const getNivoTheme = (accentColor: string = '#6366f1'): any => ({
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

export interface ChartProps {
  title: string;
  data: any[];
  height?: number;
  className?: string;
  loading?: boolean;
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  colors?: any;
}
