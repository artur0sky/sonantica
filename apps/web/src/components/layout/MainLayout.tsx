/**
 * Main Layout
 *
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 *
 * PERFORMANCE: Code splitting for heavy features (EQ, Recommendations, Lyrics)
 */

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useEffect, useRef } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import {
  useUIStore,
  MetadataPanel,
  MiniPlayer,
  ExpandedPlayer,
  SidebarResizer,
} from "@sonantica/ui";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { IconPlaylistAdd } from "@tabler/icons-react";
import { useLibraryStore } from "@sonantica/media-library";
import { DownloadButton } from "../DownloadButton";
import { cn } from "@sonantica/shared";

import { useWaveformLoader } from "../../features/player/hooks/useWaveformLoader";
import { PlaybackPersistence } from "../../features/player/components/PlaybackPersistence";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useSidebarResize } from "../../hooks/useSidebarResize"; // New Hook
import { useDominantColor } from "../../hooks/useDominantColor";
import { MobileOverlays } from "./mobile/MobileOverlays";
import { DesktopSidebars } from "./desktop/DesktopSidebars";

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
  const tracks = useLibraryStore((s) => s.tracks);

  // Find full track data from library
  const fullTrack = currentTrack
    ? tracks.find((t) => t.id === currentTrack.id)
    : null;

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
    closeLeftSidebarOnPlay,
  } = useUIStore();

  const { startResizing } = useSidebarResize();

  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Auto-close left sidebar when playing starts (desktop only)
  const state = usePlayerStore((s) => s.state);
  const prevState = useRef(state);

  useEffect(() => {
    if (
      !isMobile &&
      state === "playing" &&
      prevState.current !== "playing" &&
      currentTrack &&
      isLeftSidebarOpen
    ) {
      closeLeftSidebarOnPlay();
    }
    prevState.current = state;
  }, [
    state,
    currentTrack,
    isMobile,
    isLeftSidebarOpen,
    closeLeftSidebarOnPlay,
  ]);

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
    (typeof window !== "undefined" &&
      window.innerWidth < 1440 &&
      totalRightOffset > 100);

  const setIsCramped = useUIStore((state) => state.setIsCramped);

  // Extract dominant color from cover art for solid theme
  const { color: dominantColor, contrastColor } = useDominantColor(
    fullTrack?.coverArt
  );
  const mutedColor =
    contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

  useEffect(() => {
    setIsCramped(isCramped);
  }, [isCramped, setIsCramped]);

  return (
    <div
      className={cn(
        "h-[100dvh] transition-all duration-300 flex flex-col bg-bg text-text overflow-hidden relative",
        isPlayerExpanded
          ? "pt-0"
          : "pt-[max(env(safe-area-inset-top),2rem)] lg:pt-[env(safe-area-inset-top)]"
      )}
      style={
        {
          "--alphabet-right": `${totalRightOffset}px`,
          "--dominant-color": dominantColor,
          "--contrast-color": contrastColor,
          "--color-accent-foreground": dominantColor,
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
            {isPlayerExpanded ? (
              <div
                className="h-full w-full"
                style={
                  {
                    backgroundColor: dominantColor,
                    color: contrastColor,
                    "--color-text": contrastColor,
                    "--color-text-muted": mutedColor,
                    "--color-accent": contrastColor,
                    "--color-accent-hover": contrastColor,
                    "--color-border":
                      contrastColor === "#ffffff"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    "--color-surface-elevated":
                      contrastColor === "#ffffff"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    "--dominant-color": dominantColor,
                  } as React.CSSProperties
                }
              >
                <ExpandedPlayer
                  key="expanded"
                  dominantColor={dominantColor}
                  contrastColor={contrastColor}
                  actionButtons={
                    fullTrack && (
                      <div className="flex items-center gap-2">
                        <DownloadButton
                          trackId={fullTrack.id}
                          track={fullTrack}
                          size={22}
                          showLabel={!isMobile}
                        />
                        {!isMobile && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 text-text-muted hover:text-text rounded-full transition-all duration-200 flex items-center gap-2"
                            title="Add to Playlist"
                            onClick={() => {
                              /* TODO: Open Add to Playlist Dialog */
                              alert("Add to Playlist: " + fullTrack.title);
                            }}
                          >
                            <IconPlaylistAdd size={22} />
                            <span className="text-sm font-medium">
                              Add to Playlist
                            </span>
                          </motion.button>
                        )}
                      </div>
                    )
                  }
                  onLongPressArt={() => {
                    if (fullTrack) {
                      alert("Add to Playlist: " + fullTrack.title);
                    }
                  }}
                />
              </div>
            ) : (
              children
            )}
          </AnimatePresence>
        </main>

        {/* Desktop Sidebars - Extracted to organism component */}
        <DesktopSidebars
          isMobile={isMobile}
          currentTrack={currentTrack}
          dominantColor={dominantColor}
          contrastColor={contrastColor}
          mutedColor={mutedColor}
          startResizing={startResizing}
        />

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

      {/* Mobile Overlays - Extracted to organism component */}
      <MobileOverlays
        isMobile={isMobile}
        currentTrack={currentTrack}
        dominantColor={dominantColor}
        contrastColor={contrastColor}
        mutedColor={mutedColor}
      />

      {/* Bottom Mini Player - Sticky */}
      <AnimatePresence mode="wait">
        {currentTrack && !isPlayerExpanded && (
          <div className="sticky bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <MiniPlayer
              actionButtons={
                fullTrack && (
                  <>
                    <DownloadButton
                      trackId={fullTrack.id}
                      track={fullTrack}
                      size={18}
                      className="p-1"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 text-text-muted hover:text-text rounded-lg transition-colors"
                      title="Add to Playlist"
                    >
                      <IconPlaylistAdd size={18} />
                    </motion.button>
                  </>
                )
              }
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
