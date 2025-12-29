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
import { useDSPIntegration } from "./hooks/useDSPIntegration";

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
  import("./features/library/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  }))
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-text-muted">
    <IconLoader className="animate-spin" size={32} />
  </div>
);

function App() {
  useDSPIntegration();

  return (
    <>
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

                  {/* Playlists - Coming soon */}
                  <Route path="/playlists">
                    <div className="max-w-6xl mx-auto p-6">
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-semibold mb-2">
                          Playlists
                        </h2>
                        <p className="text-text-muted">Coming soon...</p>
                      </div>
                    </div>
                  </Route>

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
    </>
  );
}

export default App;
