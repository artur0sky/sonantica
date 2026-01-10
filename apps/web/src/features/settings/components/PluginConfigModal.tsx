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
      setJsonString(JSON.stringify(config, null, 2));
      setError(null);
    }
  }, [isOpen, config]);

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
          <p className="text-sm text-text-muted">
            Modify the internal configuration for this plugin.
            <br />
            <span className="text-warning text-xs">
              Warning: Incorrect values may break plugin functionality.
            </span>
          </p>

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
