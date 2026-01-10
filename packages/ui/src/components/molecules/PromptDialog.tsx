/**
 * PromptDialog Component
 *
 * A custom prompt dialog for text input following Sonántica's design philosophy.
 * Replaces browser's native prompt() with a more elegant, branded solution.
 */

import { IconEdit } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { useEffect, useState, useRef } from "react";
import { Modal } from "./Modal";

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

  // Reset value and focus when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Focus input after a short delay to ensure modal animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultValue]);

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
        variant="primary"
        size="md"
        onClick={handleConfirm}
        disabled={!isValid}
        className="min-w-[100px]"
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="mt-1 text-accent flex-shrink-0">
            <IconEdit size={24} stroke={1.5} />
          </div>
          <div className="flex-1">
            {message && (
              <p className="text-sm text-text-muted leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

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
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            {required && "* Required"}
          </span>
          <span className="text-[10px] text-text-muted font-mono">
            {value.length} / {maxLength}
          </span>
        </div>
      </div>
    </Modal>
  );
}
