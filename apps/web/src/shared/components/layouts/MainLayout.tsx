/**
 * Main Layout
 * 
 * SoundCloud-inspired layout with dual sidebars and sticky player.
 * Following Sonántica's minimalist philosophy.
 */

import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Header } from '../organisms/Header';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MiniPlayer } from '../../../features/player/components/MiniPlayer';
import { ExpandedPlayer } from '../../../features/player/components/ExpandedPlayer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { isLeftSidebarOpen, isRightSidebarOpen, isPlayerExpanded } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-bg text-text">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        {isLeftSidebarOpen && (
          <aside className="w-64 bg-surface border-r border-border overflow-y-auto flex-shrink-0">
            <LeftSidebar />
          </aside>
        )}

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto">
          {isPlayerExpanded ? <ExpandedPlayer /> : children}
        </main>

        {/* Right Sidebar - Queue */}
        {isRightSidebarOpen && currentTrack && (
          <aside className="w-80 bg-surface border-l border-border overflow-y-auto flex-shrink-0">
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Bottom Mini Player - Sticky */}
      {currentTrack && !isPlayerExpanded && (
        <div className="sticky bottom-0 z-50 border-t border-border">
          <MiniPlayer />
        </div>
      )}
    </div>
  );
}
