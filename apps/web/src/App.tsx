/**
 * Sonántica Web App
 *
 * Main application with server-first architecture.
 * "Apps never implement domain logic."
 *
 * Philosophy: "Server-First" - Requires configured server
 */

import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { MainLayout } from "./components/layout/MainLayout";
import { ServerGuard } from "./components/ServerGuard";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { IconLoader } from "@tabler/icons-react";
import { MotionConfig } from "framer-motion";
import { useSettingsStore } from "./stores/settingsStore";
import { useDSPIntegration } from "./hooks/useDSPIntegration";
import { useAutoScan } from "./hooks/useAutoScan";
import { useAnalyticsIntegration } from "./hooks/useAnalyticsIntegration";
import { useVersionManager } from "./hooks/useVersionManager";
import { AnalyticsTracker } from "./features/analytics/components/AnalyticsTracker";

// Lazy load pages
const ServerSetupPage = lazy(() =>
  import("./pages/ServerSetupPage").then((m) => ({
    default: m.ServerSetupPage,
  }))
);
const TracksPage = lazy(() =>
  import("./features/library/pages/TracksPage").then((m) => ({
    default: m.TracksPage,
  }))
);
const AlbumsPage = lazy(() =>
  import("./features/library/pages/AlbumsPage").then((m) => ({
    default: m.AlbumsPage,
  }))
);
const ArtistsPage = lazy(() =>
  import("./features/library/pages/ArtistsPage").then((m) => ({
    default: m.ArtistsPage,
  }))
);
const AlbumDetailPage = lazy(() =>
  import("./features/library/pages/AlbumDetailPage").then((m) => ({
    default: m.AlbumDetailPage,
  }))
);
const ArtistDetailPage = lazy(() =>
  import("./features/library/pages/ArtistDetailPage").then((m) => ({
    default: m.ArtistDetailPage,
  }))
);
const SettingsPage = lazy(() =>
  import("./features/settings/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  }))
);
const AnalyticsDashboard = lazy(() =>
  import("./features/analytics/pages/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  }))
);
const PlaylistsPage = lazy(() =>
  import("./features/library/pages/PlaylistsPage").then((m) => ({
    default: m.PlaylistsPage,
  }))
);
const PlaylistDetailPage = lazy(() =>
  import("./features/library/pages/PlaylistDetailPage").then((m) => ({
    default: m.PlaylistDetailPage,
  }))
);
const LibraryPage = lazy(() =>
  import("./features/library/pages/LibraryPage").then((m) => ({
    default: m.LibraryPage,
  }))
);
const DSPPage = lazy(() =>
  import("./features/player/pages/DSPPage").then((m) => ({
    default: m.DSPPage,
  }))
);
const RecommendationsPage = lazy(() =>
  import("./features/recommendations/pages/RecommendationsPage").then((m) => ({
    default: m.RecommendationsPage,
  }))
);
const WorkshopPage = lazy(() =>
  import("./features/downloader/pages/WorkshopPage").then((m) => ({
    default: m.WorkshopPage,
  }))
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-text-muted">
    <IconLoader className="animate-spin" size={32} />
  </div>
);

import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { initBrowserCompatibility } from "./utils/browser";
import {
  useAnimationStyles,
  useAnimationSettings,
} from "./hooks/useAnimationSettings";

function App() {
  // Initialize browser compatibility features (polyfills, detection, etc.)
  useEffect(() => {
    initBrowserCompatibility();
  }, []);

  useVersionManager(); // Checks version and wipes data if needed
  useDSPIntegration();
  useAutoScan();
  useAnalyticsIntegration();

  const animationsEnabled = useSettingsStore((s) => s.animations);
  const animationStyles = useAnimationStyles();
  const { className: animationClassName } = useAnimationSettings();

  return (
    <ErrorBoundary>
      <div style={animationStyles} className={animationClassName}>
        <MotionConfig
          transition={animationsEnabled ? undefined : { duration: 0 }}
        >
          <ServerGuard>
            <Suspense fallback={<PageLoader />}>
              <Switch>
                {/* Server Setup - No layout */}
                <Route path="/setup" component={ServerSetupPage} />

                {/* Main app with layout - requires server */}
                <Route>
                  <MainLayout>
                    <Switch>
                      {/* Default view: Tracks */}
                      <Route path="/" component={TracksPage} />

                      {/* Library views */}
                      <Route path="/library" component={TracksPage} />
                      <Route path="/albums" component={AlbumsPage} />
                      <Route path="/artists" component={ArtistsPage} />

                      {/* Detail views */}
                      <Route path="/album/:id" component={AlbumDetailPage} />
                      <Route path="/artist/:id" component={ArtistDetailPage} />

                      {/* Settings */}
                      <Route path="/settings" component={SettingsPage} />

                      {/* Analytics Dashboard */}
                      <Route path="/analytics" component={AnalyticsDashboard} />

                      {/* Playlists */}
                      <Route path="/playlists" component={PlaylistsPage} />
                      <Route
                        path="/playlist/:id"
                        component={PlaylistDetailPage}
                      />

                      {/* Hubs */}
                      <Route path="/library" component={LibraryPage} />
                      <Route path="/dsp" component={DSPPage} />
                      <Route
                        path="/recommendations"
                        component={RecommendationsPage}
                      />
                      {/* Workshop (Downloader) */}
                      <Route path="/workshop" component={WorkshopPage} />

                      {/* 404 */}
                      <Route>
                        <div className="max-w-6xl mx-auto p-6">
                          <div className="text-center py-20">
                            <h1 className="text-4xl font-bold mb-2">404</h1>
                            <p className="text-text-muted">Page not found</p>
                          </div>
                        </div>
                      </Route>
                    </Switch>
                  </MainLayout>
                </Route>
              </Switch>
            </Suspense>
          </ServerGuard>

          {/* PWA Update Prompt */}
          <PWAUpdatePrompt />

          {/* Analytics Tracker (Isolated for performance) */}
          <AnalyticsTracker />
        </MotionConfig>
      </div>
    </ErrorBoundary>
  );
}

export default App;
