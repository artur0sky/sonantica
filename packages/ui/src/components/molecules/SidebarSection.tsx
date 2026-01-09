/**
 * Sidebar Section (Molecule)
 *
 * Reusable section component for sidebars with consistent header styling.
 * Provides a unified visual language across all sidebar sections.
 *
 * Following Atomic Design principles and Sonántica's minimalist philosophy.
 */

import { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface SidebarSectionProps {
  /** Section title */
  title: string;
  /** Optional icon element to display before the title */
  icon?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional header actions (buttons, filters, etc.) */
  headerActions?: ReactNode;
}

export function SidebarSection({
  title,
  icon,
  children,
  className,
  headerActions,
}: SidebarSectionProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-text-muted/70 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </h3>
        {headerActions && (
          <div className="flex items-center gap-1">{headerActions}</div>
        )}
      </div>

      {/* Section Content */}
      {children}
    </div>
  );
}
