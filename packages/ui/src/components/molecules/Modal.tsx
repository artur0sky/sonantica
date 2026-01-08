import React, { useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { Backdrop } from "../atoms/Backdrop";
import { Button } from "../atoms/Button";
import { cn } from "../../utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
  className,
  showCloseButton = true,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <Backdrop isOpen={isOpen} onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div
          className={cn(
            "bg-surface-elevated border border-border rounded-2xl shadow-2xl w-full overflow-hidden pointer-events-auto",
            "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            maxWidth,
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-border">
              {title && (
                <h2 className="text-lg font-semibold text-text">{title}</h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-8 w-8 rounded-full"
                  aria-label="Close"
                >
                  <IconX size={20} stroke={1.5} />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-4 bg-surface/50 border-t border-border">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
