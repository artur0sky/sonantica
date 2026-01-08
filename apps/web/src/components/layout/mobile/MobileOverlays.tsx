/**
 * Mobile Overlays Component
 *
 * Handles all mobile sidebar overlays (Left, Right, Lyrics, EQ, Recommendations).
 * Uses CSS-only animations for better performance (no Framer Motion).
 * Respects Sonántica's animation system via useAnimationSettings.
 *
 * Extracted from MainLayout.tsx to follow Atomic Design principles.
 */

import { Suspense, lazy } from "react";
import { useUIStore } from "@sonantica/ui";
import { LeftSidebar } from "../LeftSidebar";
import { RightSidebar } from "../RightSidebar";
import { IconLoader } from "@tabler/icons-react";
import { cn } from "@sonantica/shared";
import { useAnimationSettings } from "../../../hooks/useAnimationSettings";

// Lazy load heavy sidebars
const LyricsSidebar = lazy(() =>
  import("../LyricsSidebar").then((m) => ({ default: m.LyricsSidebar }))
);
const EQSidebar = lazy(() =>
  import("../EQSidebar").then((m) => ({ default: m.EQSidebar }))
);
const RecommendationsSidebar = lazy(() =>
  import("../RecommendationsSidebar").then((m) => ({
    default: m.RecommendationsSidebar,
  }))
);

// Sidebar loading fallback
const SidebarLoader = () => (
  <div className="flex items-center justify-center h-full text-text-muted">
    <IconLoader className="animate-spin" size={24} />
  </div>
);

interface MobileOverlaysProps {
  isMobile: boolean;
  currentTrack: any;
  dominantColor: string;
  contrastColor: string;
  mutedColor: string;
}

export function MobileOverlays({
  isMobile,
  currentTrack,
  dominantColor,
  contrastColor,
  mutedColor,
}: MobileOverlaysProps) {
  const {
    isLeftSidebarOpen,
    isRightSidebarOpen,
    lyricsOpen,
    eqOpen,
    recommendationsOpen,
    toggleLeftSidebar,
    toggleQueue,
    toggleLyrics,
    toggleEQ,
    toggleRecommendations,
  } = useUIStore();

  const { duration, transitionEnabled } = useAnimationSettings();

  // Don't render anything on desktop
  if (!isMobile) return null;

  const anySidebarOpen =
    isLeftSidebarOpen ||
    isRightSidebarOpen ||
    lyricsOpen ||
    eqOpen ||
    recommendationsOpen;

  const handleBackdropClick = () => {
    if (isLeftSidebarOpen) toggleLeftSidebar();
    if (isRightSidebarOpen) toggleQueue();
    if (lyricsOpen) toggleLyrics();
    if (eqOpen) toggleEQ();
    if (recommendationsOpen) toggleRecommendations();
  };

  const sidebarStyles = {
    backgroundColor: dominantColor,
    color: contrastColor,
    "--color-text": contrastColor,
    "--color-text-muted": mutedColor,
    "--color-border":
      contrastColor === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    "--color-surface": "transparent",
    "--color-surface-elevated":
      contrastColor === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    "--color-accent": contrastColor,
    "--color-accent-hover": contrastColor,
    transitionDuration: `${duration}ms`,
  } as React.CSSProperties;

  return (
    <>
      {/* Backdrop Overlay */}
      {anySidebarOpen && (
        <div
          onClick={handleBackdropClick}
          className={cn(
            "fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm",
            "gpu-accelerated",
            transitionEnabled && "animate-in fade-in"
          )}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}

      {/* Left Sidebar Overlay */}
      {isLeftSidebarOpen && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 w-[280px] z-[70]",
            "shadow-2xl border-r border-white/10 overflow-y-auto",
            "pt-[max(env(safe-area-inset-top),2rem)]",
            "gpu-accelerated transition-transform",
            transitionEnabled && "animate-in slide-in-from-left"
          )}
          style={sidebarStyles}
        >
          <LeftSidebar isCollapsed={false} />
        </aside>
      )}

      {/* Right Sidebar Overlay */}
      {isRightSidebarOpen && currentTrack && (
        <aside
          className={cn(
            "fixed inset-y-0 right-0 w-[320px] z-[70]",
            "shadow-2xl border-l border-white/10 overflow-y-auto",
            "pt-[max(env(safe-area-inset-top),2rem)]",
            "gpu-accelerated transition-transform",
            transitionEnabled && "animate-in slide-in-from-right"
          )}
          style={sidebarStyles}
        >
          <RightSidebar isCollapsed={false} />
        </aside>
      )}

      {/* Lyrics Sidebar Overlay */}
      {lyricsOpen && currentTrack && (
        <aside
          className={cn(
            "fixed inset-y-0 right-0 w-[320px] z-[70]",
            "shadow-2xl border-l border-white/10 overflow-y-auto",
            "pt-[max(env(safe-area-inset-top),2rem)]",
            "gpu-accelerated transition-transform",
            transitionEnabled && "animate-in slide-in-from-right"
          )}
          style={sidebarStyles}
        >
          <Suspense fallback={<SidebarLoader />}>
            <LyricsSidebar isCollapsed={false} />
          </Suspense>
        </aside>
      )}

      {/* EQ Sidebar Overlay */}
      {eqOpen && currentTrack && (
        <aside
          className={cn(
            "fixed inset-y-0 right-0 w-[320px] z-[70]",
            "shadow-2xl border-l border-white/10 overflow-y-auto",
            "pt-[max(env(safe-area-inset-top),2rem)]",
            "gpu-accelerated transition-transform",
            transitionEnabled && "animate-in slide-in-from-right"
          )}
          style={sidebarStyles}
        >
          <Suspense fallback={<SidebarLoader />}>
            <EQSidebar isCollapsed={false} />
          </Suspense>
        </aside>
      )}

      {/* Recommendations Sidebar Overlay */}
      {recommendationsOpen && currentTrack && (
        <aside
          className={cn(
            "fixed inset-y-0 right-0 w-[320px] z-[70]",
            "shadow-2xl border-l border-white/10 overflow-y-auto",
            "pt-[max(env(safe-area-inset-top),2rem)]",
            "gpu-accelerated transition-transform",
            transitionEnabled && "animate-in slide-in-from-right"
          )}
          style={sidebarStyles}
        >
          <Suspense fallback={<SidebarLoader />}>
            <RecommendationsSidebar />
          </Suspense>
        </aside>
      )}
    </>
  );
}
