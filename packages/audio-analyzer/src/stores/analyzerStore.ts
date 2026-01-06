import { create } from 'zustand';
import { AudioAnalyzer } from '../AudioAnalyzer';
import type { SpectrumData } from '../contracts';

interface AnalyzerState {
  analyzer: AudioAnalyzer | null;
  isConnected: boolean;
  spectrum: SpectrumData | null;
  
  // Actions
  initialize: () => void;
  connect: (element: HTMLAudioElement) => void;
  disconnect: () => void;
  updateSpectrum: () => void; // Called by requestAnimationFrame loop
}

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  analyzer: null,
  isConnected: false,
  spectrum: null,

  initialize: () => {
    if (get().analyzer) return;
    const analyzer = new AudioAnalyzer({
        fftSize: 4096,
        smoothingTimeConstant: 0.8,
        bandCount: 128
    }); // Default config
    set({ analyzer });
  },

  connect: (element: HTMLAudioElement) => {
    const { analyzer, isConnected } = get();
    if (!analyzer) {
        get().initialize();
        // Recurse after init
        return get().connect(element);
    }
    
    // Safety check: if already connected
    if (isConnected && analyzer?.isConnected()) {
        // If it's the same analyzer instance maintain connection
        // (We can't easily check if it's the same Element, but in SPA it usually is)
        return;
    }

    try {
        analyzer?.connect(element);
        set({ isConnected: true });
    } catch (err) {
        // Check if error is 'already connected' and just assume success if so
        console.warn("Analyzer connection warning:", err);
        set({ isConnected: true }); 
    }
  },

  disconnect: () => {
    const { analyzer } = get();
    if (analyzer) {
        analyzer.disconnect();
        set({ isConnected: false, spectrum: null });
    }
  },

  updateSpectrum: () => {
    const { analyzer, isConnected } = get();
    if (analyzer && isConnected) {
        const data = analyzer.getSpectrum();
        set({ spectrum: data });
    }
  }
}));
