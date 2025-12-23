/**
 * Sonántica Web App
 * 
 * Main application with routing.
 * "Apps never implement domain logic."
 */

import { Route, Switch } from 'wouter';
import { Header } from './shared/components/organisms';
import { PlayerPage } from './features/player/PlayerPage';
import { LibraryPage } from './features/library/LibraryPage';

function App() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Switch>
          <Route path="/" component={PlayerPage} />
          <Route path="/library" component={LibraryPage} />
          <Route>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">404</h1>
              <p className="text-text-muted">Page not found</p>
            </div>
          </Route>
        </Switch>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-text-muted">
        <p>"Respect the intention of the sound and the freedom of the listener."</p>
      </footer>
    </div>
  );
}

export default App;
