/**
 * PageTransition Component
 *
 * Wrapper for page-level animations that respects user settings
 * Optimized for INP with CSS-only animations
 */

import type { ReactNode } from "react";
import { cn } from "@sonantica/shared";
import { useAnimationSettings } from "../hooks/useAnimationSettings";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const { transitionEnabled, duration } = useAnimationSettings();

  return (
    <div
      className={cn(
        "animate-in fade-in",
        transitionEnabled && "slide-in-from-bottom-4",
        className
      )}
      style={{
        animationDuration: `${duration}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}

/**
 * SectionTransition Component
 *
 * For sections within pages
 */
interface SectionTransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SectionTransition({
  children,
  className,
  delay = 0,
}: SectionTransitionProps) {
  const { transitionEnabled, duration } = useAnimationSettings();

  return (
    <div
      className={cn(
        "animate-in fade-in",
        transitionEnabled && "slide-in-from-bottom-2",
        className
      )}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}

/**
 * ListTransition Component
 *
 * For list items with stagger effect
 */
interface ListTransitionProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export function ListTransition({
  children,
  index = 0,
  className,
}: ListTransitionProps) {
  const { listEnabled, duration } = useAnimationSettings();

  if (!listEnabled) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn("animate-in fade-in slide-in-from-left-2", className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${Math.min(index * 20, 200)}ms`, // Max 200ms delay
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
