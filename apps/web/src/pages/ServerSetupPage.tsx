/**
 * Server Setup Page
 *
 * Initial configuration page for connecting to Sonántica API server.
 * Follows "Wise Craftsman" persona - calm, clear, educational.
 *
 * Philosophy: "User Autonomy" - Self-hosted, user-controlled
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  saveServerConfig,
  testServerConnection,
} from "../services/LibraryService";

export function ServerSetupPage() {
  const [, setLocation] = useLocation();
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serverUrl.trim()) {
      setError("Please enter a server URL");
      return;
    }

    setTesting(true);

    try {
      // Save configuration
      saveServerConfig({
        name: serverUrl.trim(), // Use URL as name for now
        serverUrl: serverUrl.trim(),
        apiKey: apiKey.trim() || undefined,
      });

      // Test connection
      const connected = await testServerConnection();

      if (!connected) {
        setError(
          "Unable to connect to server. Please check the URL and try again."
        );
        setTesting(false);
        return;
      }

      // Success - navigate to library
      setLocation("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sonántica</h1>
          <p className="text-gray-400 text-sm">Every file has an intention</p>
        </div>

        {/* Setup Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Connect to Your Server
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Enter the URL of your self-hosted Sonántica server to begin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Server URL */}
            <div>
              <label
                htmlFor="serverUrl"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Server URL
              </label>
              <input
                id="serverUrl"
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8090"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={testing}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                The address where your Sonántica API server is running
              </p>
            </div>

            {/* API Key (Optional) */}
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                API Key <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key if required"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={testing}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={testing}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Testing Connection...
                </>
              ) : (
                "Connect"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2">
              <strong className="text-gray-400">Don't have a server?</strong>
            </p>
            <p className="text-xs text-gray-500">
              Learn how to set up your own Sonántica server in the{" "}
              <a
                href="https://github.com/yourusername/sonantica#server-setup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                documentation
              </a>
              .
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Respecting the intention of sound
        </p>
      </div>
    </div>
  );
}
