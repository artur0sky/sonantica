import React from "react";
import { cn } from "../../../utils/cn";

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-4 border-b border-border/50 first:pt-0 last:border-0",
        className
      )}
    >
      <div className="space-y-0.5 max-w-[70%]">
        <label className="text-sm font-medium text-text-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">{children}</div>
    </div>
  );
};
