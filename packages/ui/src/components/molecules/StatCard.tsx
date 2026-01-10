import React from "react";
import { cn } from "../../utils";
import { AnalyticsCard, TrendIndicator } from "../atoms/AnalyticsAtoms";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  variant?: "default" | "accent" | "glass";
  className?: string;
  loading?: boolean;
}

/**
 * High-level metric display component.
 * Features CSS transitions for value entry.
 * Refactored to remove Framer Motion.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  trend,
  icon,
  variant = "default",
  className,
  loading = false,
}) => {
  return (
    <AnalyticsCard
      className={cn(
        "min-w-[150px]",
        variant === "accent" && "border-accent/40 bg-accent/5",
        className
      )}
      glassmorphism={variant === "glass" || variant === "default"}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
            {label}
          </span>
          {icon && <div className="text-accent/80">{icon}</div>}
        </div>

        <div className="mt-1 flex flex-col">
          <div className="flex items-baseline gap-1.5 min-h-[1.5em]">
            {loading ? (
              <div className="h-8 w-24 bg-border/20 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text leading-tight animate-in fade-in zoom-in-95 duration-500">
                {value !== undefined && value !== null ? value : "--"}
              </span>
            )}
            {unit && !loading && (
              <span className="text-sm font-medium text-text-muted">
                {unit}
              </span>
            )}
          </div>

          {subtitle && !loading && (
            <div className="text-xs text-text-muted mt-0.5 leading-relaxed truncate">
              {subtitle}
            </div>
          )}
        </div>

        {trend !== undefined && !loading && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/10 pt-2">
            <TrendIndicator value={trend} />
            <span className="text-[9px] text-text-muted opacity-60 uppercase tracking-tighter">
              vs last period
            </span>
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
};
