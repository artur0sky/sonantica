/**
 * Input Atom
 * 
 * Reusable input component.
 */

import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-surface-elevated px-3 py-2',
        'text-sm text-text placeholder:text-text-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-fast',
        className
      )}
      {...props}
    />
  );
}
