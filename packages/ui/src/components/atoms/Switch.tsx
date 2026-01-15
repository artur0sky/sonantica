/**
 * Switch Component
 *
 * A reusable toggle switch with smooth animations.
 * Follows the "Intentional minimalism" design principle.
 */

import { type ChangeEvent } from "react";

export interface SwitchProps {
  /** Whether the switch is checked */
  checked: boolean;
  /** Callback when the switch is toggled */
  onChange: (checked: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Optional label for accessibility */
  label?: string;
  /** Color variant */
  variant?: "accent" | "emerald" | "warning" | "error";
  /** Optional CSS class */
  className?: string;
}

/**
 * Switch - Toggle switch component
 *
 * Usage:
 * ```tsx
 * <Switch
 *   checked={enabled}
 *   onChange={(checked) => setEnabled(checked)}
 *   label="Enable feature"
 * />
 * ```
 */
export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  variant = "accent",
  className = "",
}: SwitchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const variantClasses = {
    accent: "peer-checked:bg-accent",
    emerald: "peer-checked:bg-emerald-500",
    warning: "peer-checked:bg-amber-500",
    error: "peer-checked:bg-red-500",
  };

  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
        aria-label={label}
      />
      {/* Background track */}
      <div
        className={`w-11 h-6 bg-surface-elevated ${variantClasses[variant]} rounded-full transition-colors`}
      />
      {/* Toggle indicator */}
      <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
