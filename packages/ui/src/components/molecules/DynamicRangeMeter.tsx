import React, { useMemo } from 'react';
import { useAnalyzerStore } from '@sonantica/audio-analyzer';

interface DynamicRangeMeterProps {
  label?: string;
}

export const DynamicRangeMeter: React.FC<DynamicRangeMeterProps> = ({ label = "DR" }) => {
  const { stereoMetrics } = useAnalyzerStore();
  const dr = stereoMetrics?.dynamicRange ?? 0;
  const clipping = stereoMetrics?.clipping ?? false;

  // Visual range: 0dB to 20dB
  const percent = Math.min((dr / 20) * 100, 100);

  const color = useMemo(() => {
    if (dr < 6) return '#ef4444'; // Crushed
    if (dr < 10) return '#f59e0b'; // Loud
    if (dr < 14) return '#4ade80'; // Good
    return '#3b82f6'; // Excellent
  }, [dr]);

  return (
    <div className="flex flex-col gap-1 min-w-[60px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase text-white/50">{label}</span>
        {clipping && (
            <span className="text-[10px] text-red-500 font-bold animate-pulse">CLIP</span>
        )}
      </div>

      <div className="flex items-end h-32 w-4 bg-white/10 rounded-sm mx-auto overflow-hidden relative">
        {/* Scale lines */}
        <div className="absolute top-[30%] w-full h-[1px] bg-white/10" /> {/* ~14dB */}
        <div className="absolute top-[50%] w-full h-[1px] bg-white/10" /> {/* ~10dB */}
        <div className="absolute top-[70%] w-full h-[1px] bg-white/10" /> {/* ~6dB */}

        <div 
            className="w-full transition-all duration-300 ease-out"
            style={{ 
                height: `${percent}%`, 
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`
            }}
        />
      </div>

      <span className="text-[10px] font-mono mx-auto text-white/80">
        {dr.toFixed(1)}
      </span>
    </div>
  );
};
