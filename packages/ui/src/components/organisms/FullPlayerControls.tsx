import { ShuffleButton, RepeatButton, PlayButton, SkipButton } from "../atoms";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { PlaybackState } from "@sonantica/shared";

export function FullPlayerControls() {
  const { state, play, pause, next, previous } = usePlayerStore();
  const { repeatMode, toggleRepeat, isShuffled, toggleShuffle } =
    useQueueStore();

  const isPlaying = state === PlaybackState.PLAYING;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main Transport */}
      <div className="flex items-center justify-center gap-6 md:gap-8">
        <ShuffleButton
          size={22}
          isShuffled={isShuffled}
          onClick={toggleShuffle}
          className="hover:bg-surface-elevated p-3 rounded-full"
        />

        <SkipButton
          direction="prev"
          onClick={previous}
          size={28}
          className="hover:scale-110 active:scale-95 text-text hover:text-white"
        />

        <PlayButton
          isPlaying={isPlaying}
          onClick={isPlaying ? pause : play}
          size="lg"
          className="w-16 h-16 md:w-20 md:h-20 shadow-xl"
        />

        <SkipButton
          direction="next"
          onClick={next}
          size={28}
          className="hover:scale-110 active:scale-95 text-text hover:text-white"
        />

        <RepeatButton
          size={22}
          mode={repeatMode}
          onClick={toggleRepeat}
          className="hover:bg-surface-elevated p-3 rounded-full"
        />
      </div>
    </div>
  );
}
