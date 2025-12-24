/**
 * @sonantica/player-core
 * 
 * Core audio playback engine.
 * Platform-agnostic, UI-agnostic, framework-agnostic.
 * 
 * "The core must be able to run without a UI."
 * "Respect the intention of the sound and the freedom of the listener."
 */

export { PlayerEngine } from './PlayerEngine';
export * from './contracts';
// Stores
export { usePlayerStore } from './stores/playerStore';
export type { PlayerState } from './stores/playerStore';
export { useQueueStore } from './stores/queueStore';
export type { RepeatMode } from './stores/queueStore';
export type { QueueState } from './stores/queueStore';
// Services
export { MediaSessionService, mediaSessionService } from './services/MediaSessionService';
export type { MediaSessionHandlers } from './services/MediaSessionService';
