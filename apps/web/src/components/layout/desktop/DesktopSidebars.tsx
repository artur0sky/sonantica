/**
 * Desktop Sidebars Component
 *
 * Handles all desktop sidebar rendering (Right/Queue, Lyrics, EQ, Recommendations).
 * No animations needed - sidebars are statically positioned on desktop.
 *
 * Extracted from MainLayout.tsx to follow Atomic Design principles.
 */

import { Suspense, lazy } from "react";
import { useUIStore, SidebarResizer } from "@sonantica/ui";
import { RightSidebar } from "../RightSidebar";
import { IconLoader } from "@tabler/icons-react";

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

type SidebarType = "left" | "right" | "lyrics" | "eq" | "recommendations";

interface DesktopSidebarsProps {
  isMobile: boolean;
  currentTrack: any;
  dominantColor: string;
  contrastColor: string;
  mutedColor: string;
  startResizing: (sidebar: SidebarType) => void;
}

export function DesktopSidebars({
  isMobile,
  currentTrack,
  dominantColor,
  contrastColor,
  mutedColor,
  startResizing,
}: DesktopSidebarsProps) {
  const {
    isRightSidebarOpen,
    lyricsOpen,
    eqOpen,
    recommendationsOpen,
    rightSidebarWidth,
    lyricsSidebarWidth,
    eqSidebarWidth,
    recommendationsSidebarWidth,
  } = useUIStore();

  // Don't render anything on mobile
  if (isMobile) return null;

  const sidebarStyles = (width: number) =>
    ({
      width,
      backgroundColor: dominantColor,
      color: contrastColor,
      "--color-text": contrastColor,
      "--color-text-muted": mutedColor,
      "--color-border":
        contrastColor === "#ffffff"
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)",
      "--color-surface": "transparent",
      "--color-surface-elevated":
        contrastColor === "#ffffff"
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)",
      "--color-accent": contrastColor,
      "--color-accent-hover": contrastColor,
    } as React.CSSProperties);

  const sidebarClasses =
    "border-l border-white/10 h-full flex-shrink-0 z-20 relative shadow-[-10px_0_30px_rgba(0,0,0,0.2)]";

  return (
    <>
      {/* Right Sidebar - Queue */}
      {isRightSidebarOpen && currentTrack && (
        <aside
          className={sidebarClasses}
          style={sidebarStyles(rightSidebarWidth)}
        >
          <SidebarResizer
            orientation="vertical"
            onMouseDown={() => startResizing("right")}
            className="left-0 opacity-20 hover:opacity-50"
          />
          <RightSidebar isCollapsed={rightSidebarWidth === 80} />
        </aside>
      )}

      {/* Lyrics Sidebar */}
      {lyricsOpen && currentTrack && (
        <aside
          className={sidebarClasses}
          style={sidebarStyles(lyricsSidebarWidth)}
        >
          <SidebarResizer
            orientation="vertical"
            onMouseDown={() => startResizing("lyrics")}
            className="left-0 opacity-20 hover:opacity-50"
          />
          <Suspense fallback={<SidebarLoader />}>
            <LyricsSidebar isCollapsed={lyricsSidebarWidth === 80} />
          </Suspense>
        </aside>
      )}

      {/* EQ Sidebar */}
      {eqOpen && currentTrack && (
        <aside className={sidebarClasses} style={sidebarStyles(eqSidebarWidth)}>
          <SidebarResizer
            orientation="vertical"
            onMouseDown={() => startResizing("eq")}
            className="left-0 opacity-20 hover:opacity-50"
          />
          <Suspense fallback={<SidebarLoader />}>
            <EQSidebar isCollapsed={eqSidebarWidth === 80} />
          </Suspense>
        </aside>
      )}

      {/* Recommendations Sidebar */}
      {recommendationsOpen && currentTrack && (
        <aside
          className={sidebarClasses}
          style={sidebarStyles(recommendationsSidebarWidth)}
        >
          <SidebarResizer
            orientation="vertical"
            onMouseDown={() => startResizing("recommendations")}
            className="left-0 opacity-20 hover:opacity-50"
          />
          <Suspense fallback={<SidebarLoader />}>
            <RecommendationsSidebar />
          </Suspense>
        </aside>
      )}
    </>
  );
}
