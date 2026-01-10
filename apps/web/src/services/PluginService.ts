import { getServerConfig } from './LibraryService';

export interface Plugin {
  id: string;
  name: string;
  capability: string;
  url: string;
  isEnabled: boolean;
  config: Record<string, any>;
  health?: { status: string; timestamp: string };
  manifest?: {
    description: string;
    version: string;
  };
}

export interface RecommendationRequest {
  track_id?: string;
  artist_id?: string;
  limit: number;
  context?: string[];
}

export interface RecommendationResponse {
  id: string;
  type: string;
  score: number;
  reason: string;
  track?: any; // Hydrated Track
}

export const PluginService = {
  async getAllPlugins(): Promise<Plugin[]> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins`);
    if (!response.ok) throw new Error("Failed to fetch plugins");
    return response.json();
  },

  async registerPlugin(url: string): Promise<void> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error("Failed to register plugin");
  },

  async togglePlugin(id: string, enabled: boolean): Promise<void> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error("Failed to toggle plugin");
  },

  async updateConfig(id: string, config: Record<string, any>): Promise<void> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins/${id}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error("Failed to update plugin config");
  },

  async getRecommendations(req: RecommendationRequest): Promise<RecommendationResponse[]> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/ai/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!response.ok) throw new Error("Failed to fetch recommendations");
    return response.json();
  },

  async separateStems(trackId: string): Promise<any> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/ai/demucs/separate/${trackId}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to start stem separation");
    return response.json();
  },

  async getJobStatus(jobId: string, type: string = "stem-separation"): Promise<any> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/ai/jobs/${jobId}?type=${type}`);
    if (!response.ok) throw new Error("Failed to check job status");
    return response.json();
  },

  async getCapabilities(): Promise<string[]> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/ai/capabilities`);
    if (!response.ok) throw new Error("Failed to fetch capabilities");
    return response.json();
  }
};

