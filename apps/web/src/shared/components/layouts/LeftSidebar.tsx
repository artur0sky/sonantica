/**
 * Left Sidebar - Navigation
 * 
 * Main navigation for the application.
 * "User autonomy" - clear, accessible navigation.
 */

import { Link, useLocation } from 'wouter';
import { cn } from '../../utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Tracks', icon: '🎵' },
  { path: '/albums', label: 'Albums', icon: '💿' },
  { path: '/artists', label: 'Artists', icon: '🎤' },
  { path: '/playlists', label: 'Playlists', icon: '📋' },
];

export function LeftSidebar() {
  const [location] = useLocation();

  return (
    <nav className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text">Library</h2>
        <p className="text-xs text-text-muted mt-1">
          "Every file has an intention."
        </p>
      </div>

      {/* Navigation Items */}
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link href={item.path}>
              <a
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-md transition-fast',
                  'hover:bg-surface-elevated',
                  location === item.path
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </a>
            </Link>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border">
        <p className="text-xs text-text-muted italic">
          "Respect the intention of the sound."
        </p>
      </div>
    </nav>
  );
}
