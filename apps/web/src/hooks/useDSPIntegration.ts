/**
 * useDSPIntegration Hook
 * 
 * Integrates the DSP engine with the player core.
 * Automatically initializes DSP when audio element is available.
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@sonantica/player-core';
import { useDSPStore, type DSPState } from '@sonantica/dsp';

/**
 * Hook to integrate DSP with the player
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   useDSPIntegration();
 *   return <YourApp />;
 * }
 * ```
 */
export function useDSPIntegration() {
  const getAudioElement = usePlayerStore(state => state.getAudioElement);
  const volume = usePlayerStore(state => state.volume);
  
  const dspInitialize = useDSPStore((state: DSPState) => state.initialize);
  const dspDispose = useDSPStore((state: DSPState) => state.dispose);
  const isInitialized = useDSPStore((state: DSPState) => state.isInitialized);
  const setMasterVolume = useDSPStore((state: DSPState) => state.setMasterVolume);
  
  const initAttempted = useRef(false);

  useEffect(() => {
    // Only attempt initialization once
    if (initAttempted.current || isInitialized) {
      return;
    }

    const audioElement = getAudioElement();
    
    if (audioElement) {
      initAttempted.current = true;
      
      dspInitialize(audioElement)
        .then(() => {
          console.log('🎛️  DSP integrated with player');
          // Sync initial volume
          setMasterVolume(usePlayerStore.getState().volume);
        })
        .catch((error: unknown) => {
          console.error('❌ Failed to initialize DSP:', error);
          initAttempted.current = false; // Allow retry
        });
    }
  }, [getAudioElement, dspInitialize, isInitialized, setMasterVolume]);

  // Sync volume
  useEffect(() => {
    if (isInitialized) {
      setMasterVolume(volume);
    }
  }, [volume, isInitialized, setMasterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        dspDispose();
      }
    };
  }, [isInitialized, dspDispose]);
}

