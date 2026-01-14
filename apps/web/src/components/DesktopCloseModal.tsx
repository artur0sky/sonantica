import { useState } from "react";
import { Modal, Button } from "@sonantica/ui";
import { IconMinimize, IconDeviceDesktop } from "@tabler/icons-react";
import { useSettingsStore } from "../stores/settingsStore";
import { invoke } from "@tauri-apps/api/core";

interface DesktopCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesktopCloseModal({ isOpen, onClose }: DesktopCloseModalProps) {
  const { setDesktopCloseAction } = useSettingsStore();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleMinimize = async () => {
    if (dontAskAgain) {
      setDesktopCloseAction("minimize");
    }
    await invoke("hide_window");
    onClose();
  };

  const handleClose = async () => {
    if (dontAskAgain) {
      setDesktopCloseAction("close");
    }
    await invoke("exit_app");
  };

  const footer = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-bg text-accent focus:ring-accent accent-accent"
          />
          <span className="text-sm text-text-muted group-hover:text-text transition-colors">
            Don't ask again (remember my choice)
          </span>
        </label>
      </div>
      <div className="flex items-center justify-end gap-3 px-1">
        <Button
          variant="ghost"
          onClick={handleMinimize}
          className="flex items-center gap-2"
        >
          <IconMinimize size={18} />
          Minimize to Tray
        </Button>
        <Button
          variant="danger"
          onClick={handleClose}
          className="flex items-center gap-2"
        >
          <IconDeviceDesktop size={18} />
          Close App
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close Sonántica?"
      footer={footer}
    >
      <div className="p-6 space-y-4">
        <p className="text-text-muted leading-relaxed">
          Would you like to keep Sonántica running in the background (System
          Tray) or close the application completely?
        </p>
      </div>
    </Modal>
  );
}
