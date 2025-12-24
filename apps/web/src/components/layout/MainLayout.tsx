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
import { useWaveformLoader } from "../../features/player/hooks/useWaveformLoader";
import { PlaybackPersistence } from "../../features/player/components/PlaybackPersistence";
import { useCallback, useRef, useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Pre-load waveforms
  useWaveformLoader();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const {
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isPlayerExpanded,
    isMetadataPanelOpen,
    toggleMetadataPanel,
    leftSidebarWidth,
    rightSidebarWidth,
    setLeftSidebarWidth,
    setRightSidebarWidth,
  } = useUIStore();

  const isResizing = useRef<"left" | "right" | null>(null);

  const startResizing = useCallback((sidebar: "left" | "right") => {
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
      }
    },
    [setLeftSidebarWidth, setRightSidebarWidth]
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

  return (
    <div className="h-screen flex flex-col bg-bg text-text overflow-hidden relative">
      {/* Persistence Layer */}
      <PlaybackPersistence />

      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Navigation */}
        <AnimatePresence mode="popLayout">
          {isLeftSidebarOpen && (
            <motion.aside
              initial={{ x: -leftSidebarWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1, width: leftSidebarWidth }}
              exit={{ x: -leftSidebarWidth, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-surface border-r border-border overflow-y-auto flex-shrink-0 z-20 relative"
            >
              <LeftSidebar isCollapsed={leftSidebarWidth === 72} />

              {/* Resize Handle */}
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-30"
                onMouseDown={() => startResizing("left")}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative z-10 transition-all duration-300">
          <AnimatePresence mode="wait">
            {isPlayerExpanded ? <ExpandedPlayer key="expanded" /> : children}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Queue */}
        <AnimatePresence mode="popLayout">
          {isRightSidebarOpen && currentTrack && (
            <motion.aside
              initial={{ x: rightSidebarWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1, width: rightSidebarWidth }}
              exit={{ x: rightSidebarWidth, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-surface border-l border-border overflow-y-auto flex-shrink-0 z-20 relative"
            >
              {/* Resize Handle */}
              <div
                className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-30"
                onMouseDown={() => startResizing("right")}
              />
              <RightSidebar isCollapsed={rightSidebarWidth === 80} />
            </motion.aside>
          )}
        </AnimatePresence>

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
