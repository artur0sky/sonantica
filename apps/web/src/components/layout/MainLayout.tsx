/**
 * Main Layout
 *
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 */

import { AnimatePresence, motion } from "framer-motion";
import { usePlayerStore } from "@sonantica/player-core";
import {
  useUIStore,
  MetadataPanel,
  MiniPlayer,
  ExpandedPlayer,
} from "@sonantica/ui";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { LyricsSidebar } from "./LyricsSidebar";
import { useWaveformLoader } from "../../features/player/hooks/useWaveformLoader";
import { PlaybackPersistence } from "../../features/player/components/PlaybackPersistence";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useCallback, useRef, useEffect } from "react";

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
    isPlayerExpanded,
    isMetadataPanelOpen,
    toggleMetadataPanel,
    leftSidebarWidth,
    rightSidebarWidth,
    lyricsSidebarWidth,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setLyricsSidebarWidth,
  } = useUIStore();

  const isResizing = useRef<"left" | "right" | "lyrics" | null>(null);

  const startResizing = useCallback((sidebar: "left" | "right" | "lyrics") => {
    isResizing.current = sidebar;
    document.body.classList.add("is-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = null;
    document.body.classList.remove("is-resizing");
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      if (isResizing.current === "left") {
        const newWidth = e.clientX;
        // Snap logic: 72 (icons), 240 (standard)
        if (newWidth < 120) {
          setLeftSidebarWidth(72);
        } else {
          setLeftSidebarWidth(240);
        }
      } else if (isResizing.current === "right") {
        const newWidth = window.innerWidth - e.clientX;
        // Snap logic: 80 (covers), 320 (standard)
        if (newWidth < 160) {
          setRightSidebarWidth(80);
        } else {
          setRightSidebarWidth(320);
        }
      } else if (isResizing.current === "lyrics") {
        const newWidth = window.innerWidth - e.clientX;
        // Snap logic: 80 (covers), 320 (standard)
        if (newWidth < 160) {
          setLyricsSidebarWidth(80);
        } else {
          setLyricsSidebarWidth(320);
        }
      }
    },
    [setLeftSidebarWidth, setRightSidebarWidth, setLyricsSidebarWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleResize(e);
    const onMouseUp = () => stopResizing();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleResize, stopResizing]);

  const isMobile = useMediaQuery("(max-width: 1023px)");

  return (
    <div className="h-screen flex flex-col bg-bg text-text overflow-hidden relative">
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
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-30"
              onMouseDown={() => startResizing("left")}
            />
          </aside>
        )}

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative z-10 transition-all duration-300 w-full min-w-0">
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
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-30"
              onMouseDown={() => startResizing("right")}
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
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-30"
              onMouseDown={() => startResizing("lyrics")}
            />
            <LyricsSidebar isCollapsed={lyricsSidebarWidth === 80} />
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
          (isLeftSidebarOpen || isRightSidebarOpen || lyricsOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isLeftSidebarOpen)
                  useUIStore.getState().toggleLeftSidebar();
                if (isRightSidebarOpen) useUIStore.getState().toggleQueue();
                if (lyricsOpen) useUIStore.getState().toggleLyrics();
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
            <LyricsSidebar isCollapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Mini Player - Sticky */}
      <AnimatePresence mode="wait">
        {currentTrack && !isPlayerExpanded && (
          <div className="sticky bottom-0 z-50 border-t border-border">
            <MiniPlayer />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
