/**
 * Sonántica Web App
 * 
 * Main application with SoundCloud-inspired layout.
 * "Apps never implement domain logic."
 */

import { Route, Switch } from 'wouter';
import { MainLayout } from './shared/components/layouts/MainLayout';
import { TracksPage } from './features/library/pages/TracksPage';
import { AlbumsPage } from './features/library/pages/AlbumsPage';
import { ArtistsPage } from './features/library/pages/ArtistsPage';

function App() {
  return (
    <MainLayout>
      <Switch>
        {/* Default view: Tracks */}
        <Route path="/" component={TracksPage} />
        
        {/* Library views */}
        <Route path="/albums" component={AlbumsPage} />
        <Route path="/artists" component={ArtistsPage} />
        
        {/* Playlists - Coming soon */}
        <Route path="/playlists">
          <div className="max-w-6xl mx-auto p-6">
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-semibold mb-2">Playlists</h2>
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
  );
}

export default App;
