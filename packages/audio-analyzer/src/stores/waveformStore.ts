import { create } from 'zustand';
import { AudioAnalyzer } from '../AudioAnalyzer';

interface WaveformStore {
  waveforms: Record<string, number[]>; // map trackId -> peaks[]
  isAnalyzing: boolean;
  
  // Actions
  analyzeTrack: (trackId: string, url: string) => Promise<void>;
  getWaveform: (trackId: string) => number[] | null;
}

export const useWaveformStore = create<WaveformStore>((set, get) => ({
  waveforms: {},
  isAnalyzing: false,

  analyzeTrack: async (trackId: string, url: string) => {
    // If already analyzed, skip
    if (get().waveforms[trackId]) return;

    // Avoid duplicate analyzing requests? 
    // Ideally we'd have a request map, but for now simple check
    
    try {
      set({ isAnalyzing: true });
      
      // Fetch the audio file
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Analyze
      const peaks = await AudioAnalyzer.generateWaveformFromBuffer(arrayBuffer, 200); // 200 bars for UI
      
      set(state => ({
        waveforms: {
          ...state.waveforms,
          [trackId]: peaks
        }
      }));
    } catch (error) {
      console.error(`Failed to analyze waveform for track ${trackId}:`, error);
    } finally {
        set({ isAnalyzing: false });
    }
  },

  getWaveform: (trackId: string) => {
    return get().waveforms[trackId] || null;
  }
}));
