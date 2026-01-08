/**
 * Analytics Store
 *
 * Zustand store for managing analytics state in React applications.
 * Provides a clean interface for tracking events and managing configuration.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AnalyticsConfig,
  EventType,
  EventData,
} from "../types";
import { getAnalyticsEngine } from "../core/AnalyticsEngine";

/**
 * Analytics Store State
 */
interface AnalyticsState {
  // Session
  sessionId: string | null;
  sessionStarted: number | null;

  // Configuration
  config: AnalyticsConfig;

  // Current Playback (for tracking)
  currentTrackId: string | null;
  playbackStarted: number | null;
  lastPosition: number;

  // Statistics (local cache)
  stats: {
    totalEvents: number;
    sessionCount: number;
    lastFlush: number | null;
  };

  // Actions
  startSession: () => string;
  endSession: () => Promise<void>;
  trackEvent: (eventType: EventType, data: EventData) => void;
  updateConfig: (config: Partial<AnalyticsConfig>) => void;

  // Playback tracking helpers
  startPlaybackTracking: (trackId: string) => void;
  updatePlaybackPosition: (position: number) => void;
  endPlaybackTracking: () => void;

  // Explicit pause/resume for offline support
  pause: () => void;
  resume: () => void;

  // Utility
  flush: () => Promise<void>;
  reset: () => void;
}

/**
 * Default configuration
 */
const defaultConfig: AnalyticsConfig = {
  enabled: true,
  apiEndpoint: "/api/v1/analytics",

  collectPlaybackData: true,
  collectUIInteractions: true,
  collectSearchData: true,
  collectPlatformInfo: true,
  shareAnonymousStats: false,

  batchSize: 50,
  flushInterval: 30000,
  maxBufferSize: 500,

  dataRetentionDays: 90,

  debug: false,
};

/**
 * Create the analytics store
 */
export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Initial State
      sessionId: null,
      sessionStarted: null,
      config: defaultConfig,
      currentTrackId: null,
      playbackStarted: null,
      lastPosition: 0,
      stats: {
        totalEvents: 0,
        sessionCount: 0,
        lastFlush: null,
      },

      // Start Session
      startSession: () => {
        const engine = getAnalyticsEngine(get().config);
        const sessionId = engine.startSession();

        set({
          sessionId,
          sessionStarted: Date.now(),
          stats: {
            ...get().stats,
            sessionCount: get().stats.sessionCount + 1,
          },
        });

        return sessionId;
      },

      // End Session
      endSession: async () => {
        const engine = getAnalyticsEngine();
        await engine.endSession();

        set({
          sessionId: null,
          sessionStarted: null,
          currentTrackId: null,
          playbackStarted: null,
          lastPosition: 0,
        });
      },

      // Track Event
      trackEvent: (eventType: EventType, data: EventData) => {
        const engine = getAnalyticsEngine(get().config);

        // Ensure session is started
        if (!get().sessionId) {
          get().startSession();
        }

        engine.trackEvent(eventType, data);

        set({
          stats: {
            ...get().stats,
            totalEvents: get().stats.totalEvents + 1,
          },
        });
      },

      // Update Configuration
      updateConfig: (config: Partial<AnalyticsConfig>) => {
        const newConfig = { ...get().config, ...config };
        const engine = getAnalyticsEngine();
        engine.updateConfig(newConfig);

        set({ config: newConfig });
      },

      // Start Playback Tracking
      startPlaybackTracking: (trackId: string) => {
        set({
          currentTrackId: trackId,
          playbackStarted: Date.now(),
          lastPosition: 0,
        });
      },

      // Update Playback Position
      updatePlaybackPosition: (position: number) => {
        set({ lastPosition: position });
      },

      // End Playback Tracking
      endPlaybackTracking: () => {
        set({
          currentTrackId: null,
          playbackStarted: null,
          lastPosition: 0,
        });
      },

      // Flush Events
      flush: async () => {
        const engine = getAnalyticsEngine();
        await engine.flush();

        set({
          stats: {
            ...get().stats,
            lastFlush: Date.now(),
          },
        });
      },

      // Reset
      reset: () => {
        const engine = getAnalyticsEngine();
        engine.endSession();

        set({
          sessionId: null,
          sessionStarted: null,
          currentTrackId: null,
          playbackStarted: null,
          lastPosition: 0,
          stats: {
            totalEvents: 0,
            sessionCount: 0,
            lastFlush: null,
          },
        });
      },

      // Pause/Resume
      pause: () => {
        const engine = getAnalyticsEngine();
        engine.pause();
      },

      resume: () => {
        const engine = getAnalyticsEngine();
        engine.resume();
      },
    }),
    {
      name: "sonantica-analytics",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist configuration and stats
        config: state.config,
        stats: state.stats,
      }),
    }
  )
);

/**
 * Selector hooks for common use cases
 */

export const useAnalyticsEnabled = () =>
  useAnalyticsStore((state) => state.config.enabled);

export const useSessionId = () =>
  useAnalyticsStore((state) => state.sessionId);

export const useAnalyticsStats = () =>
  useAnalyticsStore((state) => state.stats);

export const useAnalyticsConfig = () =>
  useAnalyticsStore((state) => state.config);
