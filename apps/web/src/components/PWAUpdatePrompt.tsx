import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * PWA Update Prompt Component
 *
 * Displays a notification when a new version of the app is available.
 * Follows Sonántica's minimalist design philosophy - subtle, non-intrusive.
 */
export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("[Sonántica PWA] Service Worker registered:", registration);
    },
    onRegisterError(error) {
      console.error(
        "[Sonántica PWA] Service Worker registration error:",
        error
      );
    },
  });

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setShowPrompt(true);
    }
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const update = () => {
    updateServiceWorker(true);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 shadow-2xl p-4 animate-in slide-in-from-bottom-5"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100">
            {offlineReady ? "Ready for offline use" : "Update available"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {offlineReady
              ? "The app is now ready to work offline."
              : "A new version is available. Refresh to update."}
          </p>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {needRefresh && (
              <button
                onClick={update}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Update
              </button>
            )}
            <button
              onClick={close}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {needRefresh ? "Later" : "Dismiss"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
