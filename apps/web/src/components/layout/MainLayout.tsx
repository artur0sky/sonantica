/**
 * Main Layout
 *
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 *
 * PERFORMANCE: Code splitting for heavy features (EQ, Recommendations, Lyrics)
 */

import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useMemo, useEffect } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import {
  useUIStore,
  MetadataPanel,
  MiniPlayer,
  ExpandedPlayer,
  SidebarResizer, // New Molecule
} from "@sonantica/ui";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { IconLoader } from "@tabler/icons-react";

// PERFORMANCE: Lazy load heavy sidebars (code splitting)
const LyricsSidebar = lazy(() =>
  import("./LyricsSidebar").then((m) => ({ default: m.LyricsSidebar }))
);
const EQSidebar = lazy(() =>
  import("./EQSidebar").then((m) => ({ default: m.EQSidebar }))
);
const RecommendationsSidebar = lazy(() =>
  import("./RecommendationsSidebar").then((m) => ({
    default: m.RecommendationsSidebar,
  }))
);

import { useWaveformLoader } from "../../features/player/hooks/useWaveformLoader";
import { PlaybackPersistence } from "../../features/player/components/PlaybackPersistence";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useSidebarResize } from "../../hooks/useSidebarResize"; // New Hook

// Sidebar loading fallback
const SidebarLoader = () => (
  <div className="flex items-center justify-center h-full text-text-muted">
    <IconLoader className="animate-spin" size={24} />
  </div>
);

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Pre-load waveforms
  useWaveformLoader();

  // Enable Media Session API (lockscreen, media keys, headset)
  useMediaSession();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const {
    isLeftSidebarOpen,
    isRightSidebarOpen,
    lyricsOpen,
    eqOpen,
    isPlayerExpanded,
    isMetadataPanelOpen,
    toggleMetadataPanel,
    leftSidebarWidth,
    rightSidebarWidth,
    lyricsSidebarWidth,
    eqSidebarWidth,
    recommendationsOpen,
    recommendationsSidebarWidth,
  } = useUIStore();

  const { startResizing } = useSidebarResize();

  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Calculate total width of all open right-sidebars for desktop
  const totalRightOffset = useMemo(() => {
    if (isMobile) return 8; // Default mobile margin
    let width = 0;
    if (isRightSidebarOpen && currentTrack) width += rightSidebarWidth;
    if (lyricsOpen && currentTrack) width += lyricsSidebarWidth;
    if (eqOpen && currentTrack) width += eqSidebarWidth;
    if (recommendationsOpen && currentTrack)
      width += recommendationsSidebarWidth;
    return width + 12; // Base margin
  }, [
    isMobile,
    isRightSidebarOpen,
    lyricsOpen,
    eqOpen,
    recommendationsOpen,
    rightSidebarWidth,
    lyricsSidebarWidth,
    eqSidebarWidth,
    recommendationsSidebarWidth,
    currentTrack,
  ]);

  // Determine if AlphabetNavigator should be in "mobile-like" mode (auto-hide on desktop)
  // Tight space = more than 350px of sidebars OR window is small
  const isCramped =
    totalRightOffset > 350 ||
    (window.innerWidth < 1440 && totalRightOffset > 100);

  const setIsCramped = useUIStore((state) => state.setIsCramped);

  useEffect(() => {
    setIsCramped(isCramped);
  }, [isCramped, setIsCramped]);

  return (
    <div
      className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden relative"
      style={
        {
          "--alphabet-right": `${totalRightOffset}px`,
        } as React.CSSProperties
      }
    >
      {/* Persistence Layer */}
      <PlaybackPersistence />

      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Navigation (Desktop Only - Relative Position) */}
        {!isMobile && isLeftSidebarOpen && (
          <aside
            style={{ width: leftSidebarWidth }}
            className="bg-surface border-r border-border h-full flex-shrink-0 z-20 relative"
          >
            <LeftSidebar isCollapsed={leftSidebarWidth === 72} />
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("left")}
              className="right-0"
            />
          </aside>
        )}

        {/* Center Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto relative z-10 transition-all duration-300 w-full min-w-0"
        >
          <AnimatePresence mode="wait">
            {isPlayerExpanded ? <ExpandedPlayer key="expanded" /> : children}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Queue (Desktop Only - Relative Position) */}
        {!isMobile && isRightSidebarOpen && currentTrack && (
          <aside
            style={{ width: rightSidebarWidth }}
            className="bg-surface border-l border-border h-full flex-shrink-0 z-20 relative"
          >
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("right")}
              className="left-0"
            />
            <RightSidebar isCollapsed={rightSidebarWidth === 80} />
          </aside>
        )}

        {/* Lyrics Sidebar (Desktop Only - Relative Position) */}
        {!isMobile && lyricsOpen && currentTrack && (
          <aside
            style={{ width: lyricsSidebarWidth }}
            className="bg-surface border-l border-border h-full flex-shrink-0 z-20 relative"
          >
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("lyrics")}
              className="left-0"
            />
            <Suspense fallback={<SidebarLoader />}>
              <LyricsSidebar isCollapsed={lyricsSidebarWidth === 80} />
            </Suspense>
          </aside>
        )}

        {/* EQ Sidebar (Desktop Only - Relative Position) */}
        {!isMobile && eqOpen && currentTrack && (
          <aside
            style={{ width: eqSidebarWidth }}
            className="bg-surface border-l border-border h-full flex-shrink-0 z-20 relative"
          >
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("eq")}
              className="left-0"
            />
            <Suspense fallback={<SidebarLoader />}>
              <EQSidebar isCollapsed={eqSidebarWidth === 80} />
            </Suspense>
          </aside>
        )}

        {/* Recommendations Sidebar (Desktop Only - Relative Position) */}
        {!isMobile && recommendationsOpen && currentTrack && (
          <aside
            style={{ width: recommendationsSidebarWidth }}
            className="bg-surface border-l border-border h-full flex-shrink-0 z-20 relative"
          >
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("recommendations")}
              className="left-0"
            />
            <Suspense fallback={<SidebarLoader />}>
              <RecommendationsSidebar />
            </Suspense>
          </aside>
        )}

        {/* Metadata Panel (Overlay) */}
        <AnimatePresence>
          {isMetadataPanelOpen && currentTrack?.metadata && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={toggleMetadataPanel}
              />
              <MetadataPanel
                metadata={currentTrack.metadata}
                onClose={toggleMetadataPanel}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Overlays (Fixed to absolute top) */}
      <AnimatePresence>
        {window.innerWidth < 1024 &&
          (isLeftSidebarOpen || isRightSidebarOpen || lyricsOpen || eqOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isLeftSidebarOpen)
                  useUIStore.getState().toggleLeftSidebar();
                if (isRightSidebarOpen) useUIStore.getState().toggleQueue();
                if (lyricsOpen) useUIStore.getState().toggleLyrics();
                if (eqOpen) useUIStore.getState().toggleEQ();
                if (recommendationsOpen)
                  useUIStore.getState().toggleRecommendations();
              }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
          )}
      </AnimatePresence>

      {/* Mobile Left Sidebar Overlay */}
      <AnimatePresence>
        {window.innerWidth < 1024 && isLeftSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-surface z-[70] shadow-2xl border-r border-border overflow-y-auto"
          >
            <LeftSidebar isCollapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Right Sidebar Overlay */}
      <AnimatePresence>
        {window.innerWidth < 1024 && isRightSidebarOpen && currentTrack && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[320px] bg-surface z-[70] shadow-2xl border-l border-border overflow-y-auto"
          >
            <RightSidebar isCollapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Lyrics Sidebar Overlay */}
      <AnimatePresence>
        {window.innerWidth < 1024 && lyricsOpen && currentTrack && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[320px] bg-surface z-[70] shadow-2xl border-l border-border overflow-y-auto"
          >
            <Suspense fallback={<SidebarLoader />}>
              <LyricsSidebar isCollapsed={false} />
            </Suspense>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile EQ Sidebar Overlay */}
      <AnimatePresence>
        {window.innerWidth < 1024 && eqOpen && currentTrack && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[320px] bg-surface z-[70] shadow-2xl border-l border-border overflow-y-auto"
          >
            <Suspense fallback={<SidebarLoader />}>
              <EQSidebar isCollapsed={false} />
            </Suspense>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Recommendations Sidebar Overlay */}
      <AnimatePresence>
        {window.innerWidth < 1024 && recommendationsOpen && currentTrack && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[320px] bg-surface z-[70] shadow-2xl border-l border-border overflow-y-auto"
          >
            <Suspense fallback={<SidebarLoader />}>
              <RecommendationsSidebar />
            </Suspense>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Mini Player - Sticky */}
      <AnimatePresence mode="wait">
        {currentTrack && !isPlayerExpanded && (
          <div className="sticky bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <MiniPlayer />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
