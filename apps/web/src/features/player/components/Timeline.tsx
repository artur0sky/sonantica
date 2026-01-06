/**
 * Timeline Component
 *
 * Playback timeline with seek functionality.
 */

import { Slider } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";
import { formatTime } from "@sonantica/shared";

export function Timeline() {
  const { currentTime, duration, buffered, seek, state } = usePlayerStore();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  if (state === "idle") {
    return null;
  }

  return (
    <div className="space-y-2">
      <Slider
        value={currentTime}
        min={0}
        max={duration || 0}
        step={0.1}
        buffered={buffered}
        onChange={handleSeek}
        disabled={!duration}
      />

      <div className="flex justify-between text-sm text-text-muted tabular-nums">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
