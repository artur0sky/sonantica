import { IEQPreset, IEQBand } from '../contracts';
import { BUILTIN_PRESETS, getPresetById } from '../presets';

export class PresetManager {
  private customPresets: IEQPreset[] = [];

  constructor() {}

  /**
   * Get all available presets (built-in + custom)
   */
  getAllPresets(): IEQPreset[] {
    return [...BUILTIN_PRESETS, ...this.customPresets];
  }

  /**
   * Get a preset by ID from either built-in or custom lists
   */
  getPresetById(presetId: string): IEQPreset | undefined {
    // Check built-ins first (via imports)
    const builtIn = getPresetById(presetId);
    if (builtIn) return builtIn;

    // Check custom
    return this.customPresets.find(p => p.id === presetId);
  }

  /**
   * Save a custom preset
   */
  savePreset(preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newPreset: IEQPreset = {
      ...preset,
      id,
      isBuiltIn: false,
    };

    this.customPresets.push(newPreset);
    
    console.log(`💾 Saved custom preset: ${preset.name}`);
    return id;
  }

  /**
   * Delete a custom preset
   * Returns true if deleted, false if not found or built-in
   */
  deletePreset(presetId: string): boolean {
    const index = this.customPresets.findIndex(p => p.id === presetId);
    
    if (index === -1) {
      console.error(`Cannot delete: preset not found or is built-in`);
      return false;
    }

    const deleted = this.customPresets.splice(index, 1)[0];
    console.log(`🗑️  Deleted custom preset: ${deleted.name}`);
    return true;
  }

  /**
   * Restore custom presets from storage
   */
  restoreCustomPresets(presets: IEQPreset[]): void {
    this.customPresets = [...presets];
    console.log(`♻️  Restored ${presets.length} custom presets`);
  }
}
