/**
 * Plugin System Types
 */

export type PluginPlatform = 'desktop' | 'server' | 'both';
export type PluginCategory = 'compositor' | 'orquestador' | 'visualizer' | 'effect' | 'metadata';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  platform: PluginPlatform;
  description?: string;
  author?: string;
  enabled?: boolean;
}

export interface PluginConfig {
  id: string;
  enabled: boolean;
  platform: PluginPlatform;
  settings: Record<string, any>;
}

export interface DesktopPluginSettings {
  enableCompositor: boolean;
  enableOrquestador: boolean;
  enableServerPluginsOnDesktop: boolean;
  compositorSettings: {
    defaultSampleRate: number;
    defaultBitDepth: number;
  };
  orquestadorSettings: {
    enableMultiOutput: boolean;
    enableLoopback: boolean;
  };
}

export interface AudioDevice {
  name: string;
  kind: 'Input' | 'Output' | 'Both';
  is_default: boolean;
  id?: string;
}

export interface IFileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  extension?: string;
  children?: IFileEntry[];
}

export interface IFileProvider {
  listDirectory(path?: string): Promise<IFileEntry[]>;
  getAudioDir(): Promise<string>;
  getHomeDir(): Promise<string>;
}

