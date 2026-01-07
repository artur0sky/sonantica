/**
 * PromptDialog Component
 *
 * A custom prompt dialog for text input following Sonántica's design philosophy.
 * Replaces browser's native prompt() with a more elegant, branded solution.
 */

import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconEdit } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { useEffect, useState, useRef } from "react";

export interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  maxLength?: number;
  required?: boolean;
}

export function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = "Enter text...",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  maxLength = 100,
  required = true,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultValue]);

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
    const trimmedValue = value.trim();
    if (required && !trimmedValue) {
      inputRef.current?.focus();
      return;
    }
    onConfirm(trimmedValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  const isValid = !required || value.trim().length > 0;

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
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 text-accent">
                    <IconEdit size={24} stroke={1.5} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-text mb-1">
                      {title}
                    </h2>
                    {message && (
                      <p className="text-sm text-text-muted leading-relaxed">
                        {message}
                      </p>
                    )}
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

              {/* Input */}
              <div className="px-6 pb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-text-muted">
                    {required && "* Required"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {value.length} / {maxLength}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  className="min-w-[100px]"
                >
                  {cancelText}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  disabled={!isValid}
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
