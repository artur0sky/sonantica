/**
 * Main Layout
 *
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 * Refactored to remove Framer Motion and use CSS animations.
 */

import { Suspense, lazy, useMemo, useEffect, useRef } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import { useUIStore, MiniPlayer, SidebarResizer } from "@sonantica/ui";

// Lazy load heavy UI components
const MetadataPanel = lazy(() =>
  import("@sonantica/ui").then((m) => ({ default: m.MetadataPanel }))
);
const ExpandedPlayer = lazy(() =>
  import("@sonantica/ui").then((m) => ({ default: m.ExpandedPlayer }))
);

const ComponentLoader = () => (
  <div className="flex items-center justify-center h-full text-text-muted">
    <IconLoader className="animate-spin" size={24} />
  </div>
);
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { IconPlaylistAdd, IconLoader } from "@tabler/icons-react";
import { DownloadButton } from "../DownloadButton";

import { useWaveformLoader } from "../../features/player/hooks/useWaveformLoader";
import { PlaybackPersistence } from "../../features/player/components/PlaybackPersistence";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useSidebarResize } from "../../hooks/useSidebarResize";
import { MobileOverlays } from "./mobile/MobileOverlays";
import { DesktopSidebars } from "./desktop/DesktopSidebars";
import {
  LayoutThemeManager,
  useLayoutTheme,
} from "./managers/LayoutThemeManager";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  useWaveformLoader();
  useMediaSession();
  useKeyboardShortcuts();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const state = usePlayerStore((s) => s.state);
  const prevState = useRef(state);

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
    setIsCramped,
  } = useUIStore();

  const { startResizing } = useSidebarResize();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Auto-close left sidebar when playing starts
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

  const totalRightOffset = useMemo(() => {
    if (isMobile) return 8;
    let width = 0;
    if (isRightSidebarOpen && currentTrack) width += rightSidebarWidth;
    if (lyricsOpen && currentTrack) width += lyricsSidebarWidth;
    if (eqOpen && currentTrack) width += eqSidebarWidth;
    if (recommendationsOpen && currentTrack)
      width += recommendationsSidebarWidth;
    return width + 12;
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

  const isCramped =
    totalRightOffset > 350 ||
    (typeof window !== "undefined" &&
      window.innerWidth < 1440 &&
      totalRightOffset > 100);

  useEffect(() => {
    setIsCramped(isCramped);
  }, [isCramped, setIsCramped]);

  const { dominantColor, contrastColor, mutedColor, fullTrack } =
    useLayoutTheme();

  return (
    <LayoutThemeManager
      totalRightOffset={totalRightOffset}
      isPlayerExpanded={isPlayerExpanded}
    >
      <PlaybackPersistence />
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        {!isMobile && isLeftSidebarOpen && (
          <aside
            style={{ width: leftSidebarWidth }}
            className="bg-surface border-r border-border h-full flex-shrink-0 z-20 relative transition-all duration-300"
          >
            <LeftSidebar isCollapsed={leftSidebarWidth === 72} />
            <SidebarResizer
              orientation="vertical"
              onMouseDown={() => startResizing("left")}
              className="right-0"
            />
          </aside>
        )}

        {/* Center Content / Expanded Player Container */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto relative z-10 w-full min-w-0"
        >
          {/* Transition Wrapper for Player Expansion */}
          {isPlayerExpanded ? (
            <div
              key="expanded-wrapper"
              className="h-full w-full animate-in fade-in duration-500"
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
              <Suspense fallback={<ComponentLoader />}>
                <ExpandedPlayer
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
                          <button
                            className="p-1.5 text-text-muted hover:text-text rounded-full transition-all duration-200 flex items-center gap-2 hover:scale-110 active:scale-90"
                            title="Add to Playlist"
                            onClick={() =>
                              alert("Add to Playlist: " + fullTrack.title)
                            }
                          >
                            <IconPlaylistAdd size={22} />
                            <span className="text-sm font-medium">
                              Add to Playlist
                            </span>
                          </button>
                        )}
                      </div>
                    )
                  }
                  onLongPressArt={() => {
                    if (fullTrack) alert("Add to Playlist: " + fullTrack.title);
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <div
              key="children-wrapper"
              className="h-full w-full animate-in fade-in duration-300"
            >
              {children}
            </div>
          )}
        </main>

        {/* Desktop Sidebars */}
        <DesktopSidebars
          isMobile={isMobile}
          currentTrack={currentTrack}
          dominantColor={dominantColor}
          contrastColor={contrastColor}
          mutedColor={mutedColor}
          startResizing={startResizing}
        />

        {/* Metadata Panel (Overlay) */}
        {isMetadataPanelOpen && currentTrack?.metadata && (
          <div className="fixed inset-0 z-40 lg:hidden animate-in fade-in duration-300">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleMetadataPanel}
            />
            <div className="relative h-full flex justify-end">
              <Suspense fallback={null}>
                <MetadataPanel
                  metadata={currentTrack.metadata}
                  onClose={toggleMetadataPanel}
                  className="animate-in slide-in-from-right-full duration-500"
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlays */}
      <MobileOverlays
        isMobile={isMobile}
        currentTrack={currentTrack}
        dominantColor={dominantColor}
        contrastColor={contrastColor}
        mutedColor={mutedColor}
      />

      {/* Bottom Mini Player - Sticky */}
      {currentTrack && !isPlayerExpanded && (
        <div className="sticky bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
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
                  <button
                    className="p-1 text-text-muted hover:text-text rounded-lg transition-all hover:scale-110 active:scale-90"
                    title="Add to Playlist"
                  >
                    <IconPlaylistAdd size={18} />
                  </button>
                </>
              )
            }
          />
        </div>
      )}
    </LayoutThemeManager>
  );
}
