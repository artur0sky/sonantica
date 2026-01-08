/**
 * Tabs - Navigation tabs component
 *
 * "User autonomy" - Clear navigation between sections.
 * Refactored to use CSS transitions instead of Framer Motion.
 */

import React from "react";
import { cn } from "../../utils/cn";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "default" | "solid";
}

/**
 * Tabs component - Horizontal navigation tabs
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = "default",
}: TabsProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&::-webkit-scrollbar]:hidden",
        variant === "default" && "border-b border-border",
        className
      )}
    >
      <nav
        className={cn(
          "flex gap-1 -mb-px min-w-max",
          variant === "default"
            ? "px-4 sm:px-0"
            : "bg-surface-elevated/50 p-1 rounded-xl"
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-lg",
                "flex items-center justify-center gap-2 flex-1",
                variant === "default"
                  ? isActive
                    ? "text-accent"
                    : "text-text-muted hover:text-text hover:bg-surface-elevated/30"
                  : isActive
                  ? "bg-surface text-accent shadow-sm"
                  : "text-text-muted hover:text-text"
              )}
            >
              {Icon && <Icon size={18} className="flex-shrink-0" />}
              <span>{tab.label}</span>

              {isActive && variant === "default" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent animate-in fade-in slide-in-from-bottom-1 duration-300" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
