/**
 * Volume Control Component
 *
 * Volume slider with mute toggle.
 */

import { Button, Slider } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";

export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayerStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const volumeIcon = muted
    ? "🔇"
    : volume > 0.5
    ? "🔊"
    : volume > 0
    ? "🔉"
    : "🔈";

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={toggleMute}
        variant="ghost"
        size="sm"
        className="flex-shrink-0"
      >
        {volumeIcon}
      </Button>

      <Slider
        value={volume}
        min={0}
        max={1}
        step={0.01}
        onChange={handleVolumeChange}
        className="w-32"
      />

      <span className="text-sm text-text-muted tabular-nums w-12 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
