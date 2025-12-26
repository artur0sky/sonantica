import { cn } from "../../utils/cn";
import * as React from "react";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  className,
  disabled,
  ...props
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 cursor-pointer text-sm text-text-secondary select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <div
          className={cn(
            "w-10 h-6 bg-surface-elevated rounded-full shadow-inner transition-colors duration-200 ease-in-out",
            checked ? "bg-accent" : "bg-surface-elevated"
          )}
        />
        <div
          className={cn(
            "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
}
