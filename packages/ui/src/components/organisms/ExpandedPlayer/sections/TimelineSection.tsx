/**
 * Timeline Section (Molecule)
 * Waveform scrubber with time display
 * Reusable across mobile and desktop layouts
 */

import { formatTime } from "@sonantica/shared";
import { WaveformScrubber } from "../../../molecules";
import { useWaveformStore } from "@sonantica/audio-analyzer";
import type { TimelineSectionProps } from "../types";

export function TimelineSection({
  trackId,
  currentTime,
  duration,
  onSeek,
}: TimelineSectionProps) {
  const getWaveform = useWaveformStore((state) => state.getWaveform);

  return (
    <div className="space-y-3">
      <WaveformScrubber
        trackId={trackId}
        progress={(currentTime / (duration || 1)) * 100}
        duration={duration}
        waveform={getWaveform(trackId) || undefined}
        onSeek={onSeek}
        className="h-1.5 md:h-2 hover:h-12 transition-all duration-300 bg-white/5 rounded-full"
      />
      <div className="flex justify-between text-[10px] md:text-xs text-text-muted tabular-nums font-bold opacity-60 px-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
