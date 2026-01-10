import { useState } from "react";
import { Modal, Button } from "@sonantica/ui";
import { IconRocket } from "@tabler/icons-react";

interface PluginActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: string) => void;
  pluginName: string;
  capability: string;
}

export function PluginActivationModal({
  isOpen,
  onClose,
  onConfirm,
  pluginName,
  capability,
}: PluginActivationModalProps) {
  const [scope, setScope] = useState("recent");

  const handleConfirm = () => {
    onConfirm(scope);
  };

  const getActionDescription = () => {
    switch (capability) {
      case "stem-separation":
        return "separate stems for";
      case "embeddings":
        return "generate embeddings for";
      case "recommendations":
        return "analyze listening habits for";
      default:
        return "process";
    }
  };

  const options = [
    {
      value: "recent",
      label: "Recently Added (Recommended)",
      description: "Process the last 50 tracks added to your library.",
    },
    {
      value: "queue",
      label: "Current Queue",
      description: "Only process tracks currently in your playback queue.",
    },
    {
      value: "all",
      label: "Sync Missing Tracks",
      description:
        "Smart Scan: Only processes tracks that are missing analysis. Efficient and safe.",
    },
    {
      value: "none",
      label: "Do Nothing",
      description: "Just enable the plugin without starting any jobs.",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Activate ${pluginName}`}>
      <div className="space-y-4">
        <div className="bg-surface-highlight p-4 rounded-lg flex gap-3 items-start border border-accent/20">
          <IconRocket className="text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-text-primary">Ready to launch!</p>
            <p className="text-text-muted mt-1">
              Select what you want to {getActionDescription()} immediately upon
              activation.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-text-muted uppercase tracking-wider">
            Initial Action Scope
          </label>
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                  scope === option.value
                    ? "bg-accent/5 border-accent shadow-sm"
                    : "bg-surface-base border-border hover:bg-surface-highlight"
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={(e) => setScope(e.target.value)}
                    className="accent-accent w-4 h-4"
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      scope === option.value
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {scope === "all" && (
          <div className="flex gap-2 text-accent text-xs bg-accent/10 p-2 rounded">
            <IconRocket size={16} />
            <span>
              Optimized scan: Tracks already processed will be skipped
              automatically.
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Activate & Start
          </Button>
        </div>
      </div>
    </Modal>
  );
}
