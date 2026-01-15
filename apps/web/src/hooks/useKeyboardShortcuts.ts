/**
 * Keyboard Shortcuts Hook
 * 
 * Global keyboard shortcuts for player control.
 * Follows "Active Listening" philosophy - keyboard as an instrument.
 * 
 * Shortcuts:
 * - Space: Play/Pause
 * - Arrow Left: Seek backward 5s
 * - Arrow Right: Seek forward 5s
 * - Arrow Up: Volume up
 * - Arrow Down: Volume down
 * - M: Toggle mute
 * - N: Next track
 * - P: Previous track
 * - S: Toggle shuffle
 * - R: Cycle repeat mode
 * - L: Toggle lyrics
 * - Q: Toggle queue
 * - F: Search (focus search bar)
 */

import { useEffect } from 'react';
import { usePlayerStore, useQueueStore } from '@sonantica/player-core';
import { useUIStore } from '@sonantica/ui';
import { PlaybackState } from '@sonantica/shared';

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  seekStep?: number; // seconds
  volumeStep?: number; // 0-1
}

const DEFAULT_OPTIONS: Required<KeyboardShortcutsOptions> = {
  enabled: true,
  seekStep: 5,
  volumeStep: 0.05,
};

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const { state, play, pause, seek, setVolume, toggleMute, volume, next, previous } = usePlayerStore();
  const { toggleShuffle, toggleRepeat } = useQueueStore();
  const { toggleLyrics, toggleQueue } = useUIStore();
  const player = usePlayerStore((s) => s.player);

  useEffect(() => {
    if (!opts.enabled) {
      return;
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Space in search to focus/blur
        if (e.code !== 'Space') {
          return;
        }
      }

      const audio = player.getAudioElement();
      if (!audio && e.code !== 'KeyF') {
        // Allow search shortcut even without audio
        return;
      }

      // Prevent default for handled shortcuts
      const handled = [
        'Space',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'KeyM',
        'KeyN',
        'KeyP',
        'KeyS',
        'KeyR',
        'KeyL',
        'KeyQ',
        'KeyF',
        // Media Keys
        'MediaPlayPause',
        'MediaPlay',
        'MediaPause',
        'MediaStop',
        'MediaTrackNext',
        'MediaTrackPrevious',
        'MediaRewind',
        'MediaFastForward',
      ];

      if (handled.includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
        case 'MediaPlayPause':
          // Play/Pause
          if (state === PlaybackState.PLAYING) {
            pause();
          } else if (state === PlaybackState.PAUSED || state === PlaybackState.STOPPED) {
            await play();
          }
          console.log(`⌨️ Keyboard: ${e.code} (Play/Pause)`);
          break;

        case 'MediaPlay':
          if (state !== PlaybackState.PLAYING) {
            await play();
            console.log('⌨️ Keyboard: MediaPlay');
          }
          break;

        case 'MediaPause':
          if (state === PlaybackState.PLAYING) {
            pause();
            console.log('⌨️ Keyboard: MediaPause');
          }
          break;

        case 'ArrowLeft':
        case 'MediaRewind':
          // Seek backward
          if (audio) {
            const newTime = Math.max(0, audio.currentTime - opts.seekStep);
            seek(newTime);
            console.log(`⌨️ Keyboard: ${e.code} (Seek to ${newTime.toFixed(1)}s)`);
          }
          break;

        case 'ArrowRight':
        case 'MediaFastForward':
          // Seek forward
          if (audio) {
            const newTime = Math.min(audio.duration || 0, audio.currentTime + opts.seekStep);
            seek(newTime);
            console.log(`⌨️ Keyboard: ${e.code} (Seek to ${newTime.toFixed(1)}s)`);
          }
          break;

        case 'ArrowUp':
          // Volume up
          if (!e.shiftKey) {
            const newVolume = Math.min(1, volume + opts.volumeStep);
            setVolume(newVolume);
            console.log(`⌨️ Keyboard: ↑ (Volume ${Math.round(newVolume * 100)}%)`);
          }
          break;

        case 'ArrowDown':
          // Volume down
          if (!e.shiftKey) {
            const newVolume = Math.max(0, volume - opts.volumeStep);
            setVolume(newVolume);
            console.log(`⌨️ Keyboard: ↓ (Volume ${Math.round(newVolume * 100)}%)`);
          }
          break;

        case 'KeyM':
          // Toggle mute
          toggleMute();
          console.log('⌨️ Keyboard: M (Toggle Mute)');
          break;

        case 'KeyN':
        case 'MediaTrackNext':
          // Next track
          next();
          console.log(`⌨️ Keyboard: ${e.code} (Next)`);
          break;

        case 'KeyP':
        case 'MediaTrackPrevious':
          // Previous track
          previous();
          console.log(`⌨️ Keyboard: ${e.code} (Previous)`);
          break;

        case 'KeyS':
          // Toggle shuffle
          toggleShuffle();
          console.log('⌨️ Keyboard: S (Toggle Shuffle)');
          break;

        case 'KeyR':
          // Cycle repeat mode
          toggleRepeat();
          console.log('⌨️ Keyboard: R (Cycle Repeat)');
          break;

        case 'KeyL':
          // Toggle lyrics
          toggleLyrics();
          console.log('⌨️ Keyboard: L (Toggle Lyrics)');
          break;

        case 'KeyQ':
          // Toggle queue
          toggleQueue();
          console.log('⌨️ Keyboard: Q (Toggle Queue)');
          break;

        case 'KeyF':
          // Focus search
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            console.log('⌨️ Keyboard: F (Focus Search)');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    console.log('⌨️ Keyboard shortcuts enabled');
    console.log('   Space: Play/Pause');
    console.log('   ←/→: Seek');
    console.log('   ↑/↓: Volume');
    console.log('   M: Mute');
    console.log('   N/P: Next/Previous');
    console.log('   S: Shuffle');
    console.log('   R: Repeat');
    console.log('   L: Lyrics');
    console.log('   Q: Queue');
    console.log('   F: Search');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('⌨️ Keyboard shortcuts disabled');
    };
  }, [
    opts.enabled,
    opts.seekStep,
    opts.volumeStep,
    state,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    volume,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    toggleLyrics,
    toggleQueue,
    player,
  ]);

  return {
    enabled: opts.enabled,
  };
}
