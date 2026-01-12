import { useState, useEffect } from "react";
import { PluginService } from "../services/PluginService";

export function useAICapabilities() {
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaps = async () => {
      try {
        const caps = await PluginService.getCapabilities();
        setCapabilities(caps);
      } catch (err) {
        console.warn("Failed to fetch capabilities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaps();
  }, []);

  const hasCapability = (cap: string) => capabilities.includes(cap);

  return { capabilities, hasCapability, loading };
}
