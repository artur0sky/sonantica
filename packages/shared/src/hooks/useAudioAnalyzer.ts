/**
 * useAudioAnalyzer Hook
 * 
 * React hook for managing audio analyzer lifecycle and data.
 * Provides real-time spectrum and waveform data.
 * 
 * Philosophy: "The core must be able to run without a UI."
 * This hook bridges the core analyzer to React components.
 */

import { useEffect, useRef } from 'react';
import { type SpectrumData, type WaveformData, type AudioQualityInfo, type AnalyzerConfig } from '@sonantica/audio-analyzer';
import { useAnalyzerStore } from '../store/analyzerStore';

interface UseAudioAnalyzerOptions {
  audioElement: HTMLAudioElement | null;
  config?: Partial<AnalyzerConfig>;
  enabled?: boolean;
}

interface UseAudioAnalyzerReturn {
  spectrum: SpectrumData | null;
  waveform: WaveformData | null; // Placeholder as store mainly does spectrum for now
  qualityInfo: AudioQualityInfo | null;
  isConnected: boolean;
  updateConfig: (config: Partial<AnalyzerConfig>) => void;
}

export function useAudioAnalyzer({
  audioElement,
  enabled = true,
}: UseAudioAnalyzerOptions): UseAudioAnalyzerReturn {
  const connect = useAnalyzerStore(s => s.connect);
  const updateSpectrum = useAnalyzerStore(s => s.updateSpectrum);
  const spectrum = useAnalyzerStore(s => s.spectrum);
  const isConnected = useAnalyzerStore(s => s.isConnected);
  const analyzer = useAnalyzerStore(s => s.analyzer); // Access directly if needed

  const animationFrameRef = useRef<number | null>(null);

  // Connection management
  useEffect(() => {
    if (enabled && audioElement) {
        connect(audioElement);
    } 
    // We intentionally DO NOT disconnect on unmount/disable if we want to keep the singleton valid
    // But for the sake of the store's logic, we can leave it connected.
    // However, if the user explicitly wants to disable visualization, we stop the UPDATE loop
  }, [enabled, audioElement, connect]);

  // Data Loop
  useEffect(() => {
    if (!enabled || !isConnected) {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        return;
    }

    const loop = () => {
        updateSpectrum();
        animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };
  }, [enabled, isConnected, updateSpectrum]);

  return {
    spectrum,
    waveform: null, // Legacy return
    qualityInfo: analyzer?.getQualityInfo() || null,
    isConnected,
    updateConfig: (cfg) => analyzer?.updateConfig(cfg)
  };
}
