/**
 * Main Layout
 *
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 */

import { AnimatePresence } from "framer-motion";
import { usePlayerStore } from "../../store/playerStore";
import { useUIStore } from "../../store/uiStore";
import { Header } from "../organisms/Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { MetadataPanel } from "../molecules/MetadataPanel";
import { MiniPlayer } from "../../../features/player/components/MiniPlayer";
import { ExpandedPlayer } from "../../../features/player/components/ExpandedPlayer";
import { useWaveformLoader } from "../../../features/player/hooks/useWaveformLoader";

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
  } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-bg text-text overflow-hidden relative">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Navigation */}
        <AnimatePresence mode="wait">
          {isLeftSidebarOpen && (
            <aside className="w-64 bg-surface border-r border-border overflow-y-auto flex-shrink-0 z-20">
              <LeftSidebar />
            </aside>
          )}
        </AnimatePresence>

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative z-10 transition-colors duration-500">
          <AnimatePresence mode="wait">
            {isPlayerExpanded ? <ExpandedPlayer /> : children}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Queue */}
        <AnimatePresence mode="wait">
          {isRightSidebarOpen && currentTrack && (
            <aside className="w-80 bg-surface border-l border-border overflow-y-auto flex-shrink-0 z-20">
              <RightSidebar />
            </aside>
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
