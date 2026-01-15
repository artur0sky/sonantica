/**
 * useNavigationProtection Hook
 * 
 * Protects audio playback from interruptions during route changes in Tauri.
 * Locks the player engine before navigation and unlocks after.
 */

import { useEffect } from 'react';
import { usePlayerStore } from '@sonantica/player-core';
import { useLocation } from 'wouter';

export function useNavigationProtection() {
  const [location] = useLocation();
  const player = usePlayerStore((s) => s.player);

  useEffect(() => {
    // Lock navigation before route change
    player.lockNavigation();

    // Small delay to ensure route transition starts
    const lockTimer = setTimeout(() => {
      player.unlockNavigation();
    }, 100);

    return () => {
      clearTimeout(lockTimer);
      player.unlockNavigation();
    };
  }, [location, player]);
}
