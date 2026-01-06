import { useEffect } from 'react';
import { usePlayerStore, useQueueStore } from '@sonantica/player-core';
import { useWaveformStore } from '@sonantica/audio-analyzer';

export function useWaveformLoader() {
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const queue = useQueueStore(state => state.queue);
  const analyzeTrack = useWaveformStore(state => state.analyzeTrack);

  useEffect(() => {
    if (!currentTrack) return;

    // 1. Analyze current track (High Priority)
    if (currentTrack.url) {
        analyzeTrack(currentTrack.id, currentTrack.url);
    }

    // 2. Find next/prev tracks
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    const nextTrack = queue[currentIndex + 1];
    const prevTrack = queue[currentIndex - 1];

    // 3. Pre-analyze (Lower Priority - standard fetch usage)
    if (nextTrack?.url) {
        requestIdleCallback(() => analyzeTrack(nextTrack.id, nextTrack.url));
    }
    
    if (prevTrack?.url) {
        requestIdleCallback(() => analyzeTrack(prevTrack.id, prevTrack.url));
    }

  }, [currentTrack, queue, analyzeTrack]);
}
