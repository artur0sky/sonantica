import React from "react";
import { cn } from "../../../utils/cn";

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  children,
  icon: Icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border/50 first:pt-0 last:pb-0 last:border-0 gap-4",
        className
      )}
    >
      <div className="flex items-start gap-3 sm:max-w-[70%]">
        {Icon && (
          <div className="mt-0.5 p-1.5 rounded-lg bg-surface/50 border border-border/20">
            <Icon size={16} className="text-text-muted shrink-0" />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {description && (
            <p className="text-sm text-text-muted leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center sm:justify-end shrink-0">
        {children}
      </div>
    </div>
  );
};
