/**
 * useDialog Hook
 * 
 * Provides a clean API for showing confirmation and prompt dialogs.
 * Replaces browser's native alert/confirm/prompt with branded UI.
 */

import { useState, useCallback } from 'react';

export interface DialogState {
  isOpen: boolean;
  type: 'confirm' | 'prompt' | null;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  defaultValue?: string;
  placeholder?: string;
  onConfirm: ((value?: string) => void) | null;
}

export function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    onConfirm: null,
  });

  const showConfirm = useCallback((
    title: string,
    message: string,
    variant: 'danger' | 'warning' | 'info' = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        variant,
        onConfirm: () => {
          resolve(true);
        },
      });
    });
  }, []);

  const showPrompt = useCallback((
    title: string,
    message: string = '',
    defaultValue: string = '',
    placeholder: string = 'Enter text...'
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
        onConfirm: (value?: string) => {
          resolve(value || null);
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      onConfirm: null,
    });
  }, []);

  const handleConfirm = useCallback((value?: string) => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm(value);
    }
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);

  const handleCancel = useCallback(() => {
    // For confirm dialogs, resolve with false
    // For prompt dialogs, resolve with null
    if (dialogState.type === 'confirm' && dialogState.onConfirm) {
      // Don't call onConfirm for cancel
    }
    closeDialog();
  }, [dialogState.type, closeDialog]);

  return {
    dialogState,
    showConfirm,
    showPrompt,
    handleConfirm,
    handleCancel,
    closeDialog,
  };
}
