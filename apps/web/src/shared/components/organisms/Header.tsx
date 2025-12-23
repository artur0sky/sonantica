/**
 * Header Organism
 * 
 * Main application header with navigation.
 */

import { Link, useLocation } from 'wouter';
import { APP_NAME } from '@sonantica/shared';
import { cn } from '../../utils/cn';

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: '▶️ Player', icon: '▶️' },
    { path: '/library', label: '📚 Library', icon: '📚' },
  ];

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-fast">
              <span className="text-2xl font-bold">{APP_NAME}</span>
              <span className="text-sm text-text-muted hidden sm:inline">
                Audio-first player
              </span>
            </a>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    'px-4 py-2 rounded-md font-medium transition-fast',
                    'hover:bg-surface-elevated',
                    location === item.path
                      ? 'text-accent bg-surface-elevated'
                      : 'text-text-muted'
                  )}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-xl">{item.icon}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
