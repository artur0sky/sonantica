import React from "react";
import { cn } from "../../../utils/cn";

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-4 py-4", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-text-primary tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
