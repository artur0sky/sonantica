import React, { useMemo } from 'react';
import { useAnalyzerStore } from '@sonantica/audio-analyzer';

interface CorrelationMeterProps {
  width?: number;
  height?: number;
}

export const CorrelationMeter: React.FC<CorrelationMeterProps> = ({ 
  width = 200, 
  height = 12 
}) => {
  const { stereoMetrics } = useAnalyzerStore();
  const correlation = stereoMetrics?.correlation ?? 0;

  // Convert -1..1 to 0..100%
  // -1 -> 0%
  // 0 -> 50%
  // 1 -> 100%
  const percent = ((correlation + 1) / 2) * 100;

  // Color logic
  // < 0: Red (Phase issues)
  // 0 - 0.5: Cyan/Green (Wide)
  // > 0.5: Green (Mono-ish)
  const color = useMemo(() => {
    if (correlation < -0.2) return '#ef4444'; // Red-500
    if (correlation < 0) return '#f59e0b'; // Amber-500
    return '#4ade80'; // Green-400
  }, [correlation]);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex justify-between text-[10px] text-white/50 px-1 font-mono">
        <span>-1</span>
        <span>0</span>
        <span>+1</span>
      </div>
      
      {/* Meter Track */}
      <div 
        className="relative bg-white/10 rounded-full overflow-hidden"
        style={{ width, height }}
      >
        {/* Center Marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/30 -translate-x-1/2 z-10" />

        {/* Indicator */}
        <div 
          className="absolute top-0 bottom-0 transition-all duration-100 ease-out"
          style={{ 
            left: `${percent}%`,
            width: '4px',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transform: 'translateX(-50%)'
          }}
        />
        
        {/* Fill from center? Or just a dot? usually a dot for correlation */}
      </div>
      
      <div className="text-center text-[10px] font-mono text-white/70">
        Correlation: {correlation.toFixed(2)}
      </div>
    </div>
  );
};
