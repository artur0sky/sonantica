/**
 * Server Guard Component
 *
 * Ensures user has configured a server before accessing the app.
 * Redirects to /setup if no server is configured.
 *
 * Philosophy: "Server-First" - The server is required
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { isServerConfigured } from "../services/LibraryService";

interface ServerGuardProps {
  children: React.ReactNode;
}

export function ServerGuard({ children }: ServerGuardProps) {
  const [location, setLocation] = useLocation();
  const configured = isServerConfigured();

  useEffect(() => {
    // Don't redirect if already on setup page
    if (location === "/setup") return;

    // Redirect to setup if not configured
    if (!configured) {
      setLocation("/setup");
    }
  }, [configured, location, setLocation]);

  // Show children if configured or on setup page
  if (configured || location === "/setup") {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return null;
}
