/**
 * Badge Atom
 *
 * Status badge component.
 */

import { cn } from "../../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "error" | "warning" | "custom";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variantClasses = {
    default: "bg-surface-elevated text-text",
    accent: "bg-accent text-white",
    success: "bg-success text-white",
    error: "bg-error text-white",
    warning: "bg-warning text-white",
    custom: "",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
