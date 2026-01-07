/**
 * ConfirmDialog Component
 *
 * A custom confirmation dialog following Sonántica's design philosophy.
 * Replaces browser's native confirm() with a more elegant, branded solution.
 */

import { motion, AnimatePresence } from "framer-motion";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { useEffect } from "react";

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
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-surface-elevated border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${getVariantColor()}`}>
                    <IconAlertTriangle size={24} stroke={1.5} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-text mb-2">
                      {title}
                    </h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text transition-colors p-1 -mr-1 -mt-1"
                  aria-label="Close"
                >
                  <IconX size={20} stroke={1.5} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
