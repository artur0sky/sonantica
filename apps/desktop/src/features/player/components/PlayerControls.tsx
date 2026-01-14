/**
 * Player Controls Component
 *
 * Play, pause, stop controls for the player.
 */

import { Button } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";
import { PlaybackState } from "@sonantica/shared";

export function PlayerControls() {
  const { state, play, pause, stop } = usePlayerStore();

  const isPlaying = state === PlaybackState.PLAYING;
  const isIdle = state === PlaybackState.IDLE;
  const isLoading = state === PlaybackState.LOADING;

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        onClick={play}
        disabled={isPlaying || isIdle || isLoading}
        variant="primary"
        size="lg"
        className="w-24"
      >
        {isLoading ? "⏳" : "▶️"} Play
      </Button>

      <Button onClick={pause} disabled={!isPlaying} size="lg" className="w-24">
        ⏸️ Pause
      </Button>

      <Button
        onClick={stop}
        disabled={isIdle}
        variant="ghost"
        size="lg"
        className="w-24"
      >
        ⏹️ Stop
      </Button>
    </div>
  );
}
