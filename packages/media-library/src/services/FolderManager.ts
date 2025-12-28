/**
 * FolderManager - Manages music folder configuration
 * 
 * "User autonomy" - The user decides which folders to scan.
 * 
 * Responsibilities:
 * - Add/remove/update music folders
 * - Validate folder paths
 * - Persist configuration
 * - Track folder statistics
 */

import type { MusicFolder, LibraryConfig, FolderValidationResult } from '@sonantica/shared';

/**
 * Storage adapter interface for folder configuration
 * Platform-specific implementations will handle actual persistence
 */
export interface IFolderConfigStorage {
  load(): Promise<LibraryConfig | null>;
  save(config: LibraryConfig): Promise<void>;
}

/**
 * Folder validation adapter interface
 * Platform-specific implementations will handle path validation
 */
export interface IFolderValidator {
  validatePath(path: string): Promise<FolderValidationResult>;
  pathExists(path: string): Promise<boolean>;
  isDirectory(path: string): Promise<boolean>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LibraryConfig = {
  folders: [],
  autoScanOnStartup: false,
  watchForChanges: false,
  lastUpdated: new Date(),
};

/**
 * FolderManager - Core folder management logic
 */
export class FolderManager {
  private config: LibraryConfig;
  private storage: IFolderConfigStorage;
  private validator: IFolderValidator;
  private listeners: Set<(config: LibraryConfig) => void> = new Set();

  constructor(storage: IFolderConfigStorage, validator: IFolderValidator) {
    this.storage = storage;
    this.validator = validator;
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Initialize and load configuration
   */
  /**
   * Initialize and load configuration
   */
  async initialize(): Promise<void> {
    const loaded = await this.storage.load();
    if (loaded) {
      // Restore dates from JSON
      loaded.lastUpdated = new Date(loaded.lastUpdated);
      loaded.folders = loaded.folders.map(f => ({
        ...f,
        addedAt: new Date(f.addedAt),
        lastScanned: f.lastScanned ? new Date(f.lastScanned) : undefined,
      }));
      this.config = loaded;
      console.log(`📂 Loaded ${this.config.folders.length} configured folders`);
    } else {
      console.log('📂 No folder configuration found, using defaults');
      this.config = { ...DEFAULT_CONFIG };
    }

    // Ensure system folders exist
    this.ensureSystemFolders();
  }

  private ensureSystemFolders() {
    const SYSTEM_FOLDERS = [
        { path: '/media', name: 'Server Media', id: 'sys_media' }
    ];

    let changed = false;
    for (const sys of SYSTEM_FOLDERS) {
        if (!this.config.folders.find(f => f.path === sys.path)) {
            this.config.folders.push({
                id: sys.id,
                path: sys.path,
                name: sys.name,
                recursive: true,
                enabled: true,
                isSystem: true,
                addedAt: new Date(),
            });
            changed = true;
        }
    }

    if (changed) {
        this.saveConfig();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LibraryConfig {
    return { ...this.config };
  }

  /**
   * Get all folders
   */
  getFolders(): MusicFolder[] {
    return [...this.config.folders];
  }

  /**
   * Get enabled folders only
   */
  getEnabledFolders(): MusicFolder[] {
    return this.config.folders.filter(f => f.enabled);
  }

  /**
   * Get folder paths for scanning
   */
  getScanPaths(): string[] {
    return this.getEnabledFolders().map(f => f.path);
  }

  /**
   * Add a new folder
   */
  async addFolder(
    path: string,
    options: {
      name?: string;
      recursive?: boolean;
      enabled?: boolean;
      isSystem?: boolean;
    } = {}
  ): Promise<MusicFolder> {
    // Validate path
    const validation = await this.validator.validatePath(path);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid folder path');
    }

    // Check for duplicates
    const existing = this.config.folders.find(f => f.path === path);
    if (existing) {
      throw new Error('This folder is already configured');
    }

    // Create folder entry
    const folder: MusicFolder = {
      id: this.generateFolderId(),
      path,
      name: options.name,
      recursive: options.recursive ?? true,
      enabled: options.enabled ?? true,
      isSystem: options.isSystem,
      addedAt: new Date(),
    };

    this.config.folders.push(folder);
    await this.saveConfig();

    console.log(`✅ Added folder: ${path}`);
    return folder;
  }

  /**
   * Remove a folder
   */
  async removeFolder(folderId: string): Promise<void> {
    const index = this.config.folders.findIndex(f => f.id === folderId);
    if (index === -1) {
      throw new Error('Folder not found');
    }

    const folder = this.config.folders[index];
    if (folder.isSystem) {
      throw new Error('Cannot remove system folder');
    }

    this.config.folders.splice(index, 1);
    await this.saveConfig();

    console.log(`🗑️ Removed folder: ${folder.path}`);
  }

  /**
   * Update folder settings
   */
  async updateFolder(
    folderId: string,
    updates: Partial<Pick<MusicFolder, 'name' | 'recursive' | 'enabled'>>
  ): Promise<MusicFolder> {
    const folder = this.config.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    Object.assign(folder, updates);
    await this.saveConfig();

    console.log(`✏️ Updated folder: ${folder.path}`);
    return folder;
  }

  /**
   * Update folder statistics after scan
   */
  async updateFolderStats(folderId: string, trackCount: number): Promise<void> {
    const folder = this.config.folders.find(f => f.id === folderId);
    if (!folder) return;

    folder.trackCount = trackCount;
    folder.lastScanned = new Date();
    await this.saveConfig();
  }

  /**
   * Update global settings
   */
  async updateSettings(settings: {
    autoScanOnStartup?: boolean;
    watchForChanges?: boolean;
  }): Promise<void> {
    Object.assign(this.config, settings);
    await this.saveConfig();
    console.log('⚙️ Updated library settings');
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(callback: (config: LibraryConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Save configuration and notify listeners
   */
  private async saveConfig(): Promise<void> {
    this.config.lastUpdated = new Date();
    await this.storage.save(this.config);
    this.notifyListeners();
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getConfig());
      } catch (error) {
        console.error('Error in folder config listener:', error);
      }
    });
  }

  /**
   * Generate unique folder ID
   */
  private generateFolderId(): string {
    return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
