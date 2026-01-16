import { getServerConfig } from './LibraryService';
import { extractOriginalId } from '@sonantica/shared';

export interface Plugin {
  id: string;
  baseUrl: string;
  isEnabled: boolean;
  config: Record<string, any>;
  health?: { 
    status: string; 
    timestamp: string; 
    storage_usage_bytes?: number; 
  };
  manifest: {
    id: string;
    name: string;
    description: string;
    version: string;
    capability: string;
  };
}

export interface RecommendationRequest {
  track_id?: string;
  artist_id?: string;
  limit: number;
  context?: string[];
  diversity?: number; // 0.0 - 1.0
  weights?: {
      audio: number;
      lyrics: number;
      visual: number;
      stems: number;
  };
}

export interface RecommendationResponse {
  id: string;
  type: string;
  score: number;
  reason: string;
  track?: any; // Hydrated Track
  album?: any; // Hydrated Album
  artist?: any; // Hydrated Artist
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

  async togglePlugin(id: string, enabled: boolean, scope?: string, trackIds?: string[]): Promise<void> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, scope, track_ids: trackIds }),
    });
    if (!response.ok) throw new Error("Failed to toggle plugin");
  },

  async deleteData(id: string): Promise<void> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/plugins/${id}/data`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete plugin data");
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

    // Ensure IDs are not prefixed when sent to the server
    const processedReq = {
      ...req,
      track_id: extractOriginalId(req.track_id),
      artist_id: extractOriginalId(req.artist_id),
      context: req.context?.map(id => extractOriginalId(id)!)
    };

    const response = await fetch(`${server.serverUrl}/api/v1/ai/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processedReq),
    });
    if (!response.ok) throw new Error("Failed to fetch recommendations");
    return response.json();
  },

  async separateStems(trackId: string): Promise<any> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const originalTrackId = extractOriginalId(trackId);
    const response = await fetch(`${server.serverUrl}/api/v1/ai/demucs/separate/${originalTrackId}`, {
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
  },

  async analyzeTrack(trackId: string, capability: string): Promise<any> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const originalTrackId = extractOriginalId(trackId);
    const response = await fetch(`${server.serverUrl}/api/v1/ai/analyze/${originalTrackId}?capability=${capability}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to start AI analysis");
    return response.json();
  },

  async startDownload(url: string, format: string = "flac"): Promise<{ id: string, job_id?: string }> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/preserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format }),
    });
    if (!response.ok) throw new Error("Failed to start preservation");
    return response.json();
  },

  async getDownloadJobStatus(jobId: string): Promise<any> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/preserve/${jobId}`);
    if (!response.ok) throw new Error("Failed to check preservation status");
    return response.json();
  },

  async identify(query: string): Promise<any[]> {
    const server = getServerConfig();
    if (!server) throw new Error("No server configured");

    const response = await fetch(`${server.serverUrl}/api/v1/preserve/identify?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Failed to identify source");
    return response.json();
  }
};

