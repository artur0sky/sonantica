import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantColor = () => {
    switch (variant) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "info":
        return "text-accent";
      default:
        return "text-accent";
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Button
        variant="ghost"
        size="md"
        onClick={onClose}
        className="min-w-[100px]"
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        size="md"
        onClick={handleConfirm}
        className="min-w-[100px]"
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      footer={footer}
    >
      <div className="flex items-start gap-4 p-6">
        <div className={`mt-1 flex-shrink-0 ${getVariantColor()}`}>
          <IconAlertTriangle size={24} stroke={1.5} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text mb-2">{title}</h2>
          <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
