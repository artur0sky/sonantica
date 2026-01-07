/**
 * Tabs - Navigation tabs component
 *
 * "User autonomy" - Clear navigation between sections.
 */

import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

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
}

/**
 * Tabs component - Horizontal navigation tabs
 */
export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <nav className="flex gap-1 -mb-px min-w-max px-4 sm:px-0" role="tablist">
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
                "relative px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                "flex items-center gap-2",
                isActive ? "text-text" : "text-text-muted hover:text-text"
              )}
            >
              {Icon && <Icon size={18} className="flex-shrink-0" />}
              <span>{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
