import { usePlaybackAnalytics } from "../../../hooks/usePlaybackAnalytics";

/**
 * AnalyticsTracker
 *
 * A logical component that handles analytics tracking side-effects.
 * It is isolated in a separate component to prevent high-frequency
 * playback updates (currentTime) from causing re-renders in the main App tree.
 */
export function AnalyticsTracker() {
  usePlaybackAnalytics();

  return null;
}
