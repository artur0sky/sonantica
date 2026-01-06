/**
 * Library Service Factory
 * 
 * Creates and manages the library adapter based on configuration.
 * Supports server-first architecture (Spotify/Jellyfin style).
 * Now supports multiple server instances!
 * 
 * Philosophy: "User Autonomy" - Self-hosted, user-controlled
 */

import { RemoteLibraryAdapter, type ILibraryAdapter } from '@sonantica/media-library';
import { generateStableId } from '@sonantica/shared';

export interface ServerConfig {
  id: string;
  name: string;
  serverUrl: string;
  apiKey?: string;
  lastConnected?: number;
}

export interface ServersConfig {
  servers: ServerConfig[];
  activeServerId: string | null;
}

const STORAGE_KEY = 'sonantica:servers-config';

/**
 * Get all servers configuration from localStorage
 */
export function getServersConfig(): ServersConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { servers: [], activeServerId: null };
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load servers config:', error);
    return { servers: [], activeServerId: null };
  }
}

/**
 * Get active server configuration
 */
export function getServerConfig(): ServerConfig | null {
  const config = getServersConfig();
  if (!config.activeServerId) return null;
  
  return config.servers.find(s => s.id === config.activeServerId) || null;
}

/**
 * Save servers configuration to localStorage
 */
function saveServersConfig(config: ServersConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save servers config:', error);
    throw error;
  }
}

/**
 * Add or update a server
 */
export function saveServerConfig(server: Omit<ServerConfig, 'id' | 'lastConnected'>): ServerConfig {
  const config = getServersConfig();
  
  // Generate stable ID from URL
  const baseId = generateStableId(server.serverUrl);
  const id = `server-${baseId.replace('id-', '')}`;
  
  // Check if server already exists
  const existingIndex = config.servers.findIndex(s => s.id === id);
  
  const newServer: ServerConfig = {
    ...server,
    id,
    lastConnected: Date.now()
  };
  
  if (existingIndex !== -1) {
    // Update existing
    config.servers[existingIndex] = newServer;
  } else {
    // Add new
    config.servers.push(newServer);
  }
  
  // Set as active
  config.activeServerId = id;
  
  saveServersConfig(config);
  return newServer;
}

/**
 * Update existing server
 */
export function updateServerConfig(id: string, updates: Partial<Omit<ServerConfig, 'id'>>): void {
  const config = getServersConfig();
  const serverIndex = config.servers.findIndex(s => s.id === id);
  
  if (serverIndex === -1) {
    throw new Error('Server not found');
  }
  
  config.servers[serverIndex] = {
    ...config.servers[serverIndex],
    ...updates
  };
  
  saveServersConfig(config);
}

/**
 * Remove a server
 */
export function removeServerConfig(id: string): void {
  const config = getServersConfig();
  
  config.servers = config.servers.filter(s => s.id !== id);
  
  // If removed server was active, clear active server
  if (config.activeServerId === id) {
    config.activeServerId = config.servers.length > 0 ? config.servers[0].id : null;
  }
  
  saveServersConfig(config);
}

/**
 * Set active server
 */
export function setActiveServer(id: string): void {
  const config = getServersConfig();
  const server = config.servers.find(s => s.id === id);
  
  if (!server) {
    throw new Error('Server not found');
  }
  
  config.activeServerId = id;
  
  // Update last connected timestamp
  server.lastConnected = Date.now();
  
  saveServersConfig(config);
}

/**
 * Clear all servers configuration
 */
export function clearServersConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Create library adapter instance for active server
 * @returns ILibraryAdapter instance or null if no server configured
 */
export function createLibraryAdapter(): ILibraryAdapter | null {
  const server = getServerConfig();
  
  if (!server) {
    return null;
  }
  
  return new RemoteLibraryAdapter({
    serverUrl: server.serverUrl,
    apiKey: server.apiKey,
  });
}

/**
 * Create library adapter for specific server
 */
export function createLibraryAdapterForServer(serverId: string): ILibraryAdapter | null {
  const config = getServersConfig();
  const server = config.servers.find(s => s.id === serverId);
  
  if (!server) {
    return null;
  }
  
  return new RemoteLibraryAdapter({
    serverUrl: server.serverUrl,
    apiKey: server.apiKey,
  });
}

/**
 * Check if any server is configured
 */
export function isServerConfigured(): boolean {
  return getServerConfig() !== null;
}

/**
 * Test connection to active server
 */
export async function testServerConnection(): Promise<boolean> {
  const adapter = createLibraryAdapter();
  if (!adapter) return false;
  
  try {
    return await adapter.testConnection();
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}

/**
 * Test connection to specific server
 */
export async function testServerConnectionById(serverId: string): Promise<boolean> {
  const adapter = createLibraryAdapterForServer(serverId);
  if (!adapter) return false;
  
  try {
    return await adapter.testConnection();
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}

