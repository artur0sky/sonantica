import { create } from 'zustand';
import { PluginService, type Plugin } from '../services/PluginService';

interface PluginState {
  plugins: Plugin[];
  isLoading: boolean;
  error: string | null;
  fetchPlugins: () => Promise<void>;
  togglePlugin: (id: string, enabled: boolean, scope?: string, trackIds?: string[]) => Promise<void>;
  isPluginEnabled: (pluginId: string) => boolean;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: false,
  error: null,
  fetchPlugins: async () => {
    set({ isLoading: true, error: null });
    try {
      const plugins = await PluginService.getAllPlugins();
      set({ plugins, isLoading: false });
    } catch (error: any) {
      console.warn("Could not fetch plugins:", error.message);
      set({ error: error.message, isLoading: false });
    }
  },
  togglePlugin: async (id: string, enabled: boolean, scope?: string, trackIds?: string[]) => {
    try {
      await PluginService.togglePlugin(id, enabled, scope, trackIds);
      // Optimistic update
      set((state) => ({
        plugins: state.plugins.map((p) =>
          p.id === id || p.manifest.id === id ? { ...p, isEnabled: enabled } : p
        ),
      }));
    } catch (error) {
      console.error("Failed to toggle plugin in store:", error);
      throw error;
    }
  },
  isPluginEnabled: (pluginId: string) => {
    const plugins = get().plugins;
    if (!plugins || plugins.length === 0) return false;
    
    // Check both id and manifest.id just in case
    const plugin = plugins.find(p => p.id === pluginId || p.manifest.id === pluginId);
    return plugin?.isEnabled ?? false;
  }
}));
