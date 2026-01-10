import { useState, useEffect } from "react";
import { Button } from "@sonantica/ui";
import { IconX, IconDeviceFloppy } from "@tabler/icons-react";

interface PluginConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => Promise<void>;
  pluginName: string;
}

export function PluginConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  pluginName,
}: PluginConfigModalProps) {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (config && Object.keys(config).length > 0) {
        setJsonString(JSON.stringify(config, null, 2));
      } else {
        // Pre-fill defaults based on plugin name/type
        let defaultConfig = {};
        const nameLower = pluginName.toLowerCase();
        if (nameLower.includes("demucs")) {
          defaultConfig = {
            model: "htdemucs",
            segment: 10,
            shifts: 1,
            overlap: 0.25,
            split: true, // Return all stems
          };
        } else if (nameLower.includes("brain")) {
          defaultConfig = {
            batch_size: 32,
            threshold: 0.75,
            index_type: "L2",
          };
        }
        setJsonString(JSON.stringify(defaultConfig, null, 2));
      }
      setError(null);
    }
  }, [isOpen, config, pluginName]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonString);
      setIsSaving(true);
      await onSave(parsed);
      onClose();
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError("Failed to save configuration");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-base">
          <h3 className="font-semibold text-lg">{pluginName} Configuration</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-highlight rounded-md transition-colors text-text-muted hover:text-text-primary"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-text-muted space-y-2 bg-surface-base p-3 rounded-lg border border-border/50">
            <p className="font-medium text-text-primary">How to configure:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Use standard JSON format (keys in double quotes).</li>
              <li>
                Demucs: Adjust <code>segment</code> for memory usage,{" "}
                <code>shifts</code> for quality.
              </li>
              <li>
                Brain: Adjust <code>threshold</code> (0.0-1.0) to filter
                recommendations.
              </li>
            </ul>
            <p className="text-warning text-xs mt-2 pt-2 border-t border-border/50">
              Warning: Incorrect values may break plugin functionality. Reset to
              empty `{}` to restore server defaults.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              value={jsonString}
              onChange={(e) => {
                setJsonString(e.target.value);
                setError(null);
              }}
              className="w-full h-64 bg-surface-base border border-border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none text-text-primary"
              spellCheck={false}
            />
            {error && <p className="text-error text-sm">{error}</p>}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surface-base flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <span className="flex items-center gap-2">
              <IconDeviceFloppy size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
