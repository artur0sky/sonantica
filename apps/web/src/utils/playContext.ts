/**
 * Play Context Helper
 * 
 * Utilities for playing tracks from different contexts (tracks list, album, artist).
 * Handles queue setup and playback initiation.
 */

import { usePlayerStore, useQueueStore } from '@sonantica/player-core';
import { useUIStore } from '@sonantica/ui';
import type { MediaSource } from '@sonantica/shared';

/**
 * Play a track from a list of tracks
 * Sets up the queue with all tracks and starts playing from the selected index
 * 
 * @param tracks - Array of all tracks in the context
 * @param startIndex - Index of the track to start playing (default: 0)
 */
export async function playFromContext(tracks: MediaSource[], startIndex: number = 0) {
  if (tracks.length === 0) {
    console.warn('No tracks to play');
    return;
  }

  // Validate index
  const index = Math.max(0, Math.min(startIndex, tracks.length - 1));

  // Set up queue with all tracks, starting at the selected index
  useQueueStore.getState().setQueue(tracks, index);

  // Load and play the selected track
  const playerStore = usePlayerStore.getState();
  await playerStore.loadTrack(tracks[index]);
  await playerStore.play();

  // Open queue sidebar
  useUIStore.getState().setQueueOpen(true);

  console.log(`🎵 Playing track ${index + 1}/${tracks.length} from context`);
}

/**
 * Play all tracks from the beginning
 */
export async function playAll(tracks: MediaSource[]) {
  await playFromContext(tracks, 0);
}

/**
 * Play all tracks shuffled
 */
export async function playAllShuffled(tracks: MediaSource[]) {
  if (tracks.length === 0) {
    console.warn('No tracks to shuffle');
    return;
  }

  // Set up queue with all tracks
  useQueueStore.getState().setQueue(tracks, 0);
  
  // Enable shuffle (this will shuffle the queue)
  useQueueStore.getState().toggleShuffle();

  // Load and play the first track (which is now shuffled)
  const queue = useQueueStore.getState().queue;
  const playerStore = usePlayerStore.getState();
  await playerStore.loadTrack(queue[0]);
  await playerStore.play();

  // Open queue sidebar
  useUIStore.getState().setQueueOpen(true);

  console.log(`🔀 Playing ${tracks.length} tracks shuffled`);
}

/**
 * Add tracks to the end of the current queue
 */
export function addToQueue(tracks: MediaSource | MediaSource[]) {
  useQueueStore.getState().addToQueue(tracks);
  console.log(`➕ Added ${Array.isArray(tracks) ? tracks.length : 1} track(s) to queue`);
}

/**
 * Play next (insert at the front of the queue)
 */
export function playNext(track: MediaSource) {
  const queueStore = useQueueStore.getState();
  const currentIndex = queueStore.currentIndex;
  
  // Insert after current track
  const newQueue = [...queueStore.queue];
  newQueue.splice(currentIndex + 1, 0, track);
  
  queueStore.setQueue(newQueue, currentIndex);
  console.log(`⏭️ Track will play next`);
}
