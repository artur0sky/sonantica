import React from "react";
import { cn } from "../../utils";

interface AnalyticsCardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  height?: string | number;
  glassmorphism?: boolean;
  loading?: boolean;
}

/**
 * Base container for dashboard items.
 * Implements premium aesthetics with optional glassmorphism.
 * Refactored to use CSS animations and no Framer Motion.
 */
export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  children,
  className,
  title,
  subtitle,
  icon,
  height,
  glassmorphism = true,
  loading = false,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/50 overflow-hidden flex flex-col transition-all",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        glassmorphism ? "bg-surface/40 backdrop-blur-xl" : "bg-surface",
        "hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-accent/30",
        className
      )}
      style={{ height }}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex flex-col">
            {title && (
              <h3 className="text-sm font-semibold text-text tracking-tight uppercase opacity-60">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              {icon}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 p-5 pt-2">
        {loading ? (
          <div className="w-full h-full flex flex-col gap-4">
            <div className="h-4 w-3/4 bg-border/20 animate-pulse rounded" />
            <div className="flex-1 w-full bg-border/10 animate-pulse rounded-xl" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

interface TrendIndicatorProps {
  value: number;
  isPercentage?: boolean;
  reverse?: boolean; // If true, negative is "good" (e.g. latency)
}

/**
 * Visual indicator for metric trends.
 */
export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  isPercentage = true,
  reverse = false,
}) => {
  const isNeutral = value === 0;
  const isPositive = reverse ? value < 0 : value > 0;

  const colorClass = isNeutral
    ? "text-text-muted"
    : isPositive
    ? "text-green-500"
    : "text-red-500";

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-sans text-xs font-bold",
        colorClass
      )}
    >
      <span>{isNeutral ? "•" : isPositive ? "↑" : "↓"}</span>
      <span>
        {Math.abs(value).toFixed(1)}
        {isPercentage ? "%" : ""}
      </span>
    </div>
  );
};
