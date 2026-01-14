/**
 * Sonántica Desktop - Main Application
 *
 * "Respect the intention of the sound and the freedom of the listener."
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-spacing-lg overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--color-surface-elevated)_0%,_transparent_70%)] opacity-50 pointer-events-none" />

      <AnimatePresence>
        {mounted && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 text-center max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mb-spacing-xl"
            >
              <h1 className="text-font-size-4xl font-bold tracking-tight mb-spacing-md bg-gradient-to-b from-text to-text-muted bg-clip-text text-transparent">
                Sonántica
              </h1>
              <p className="text-font-size-lg text-text-muted font-light italic">
                "Respect the intention of the sound and the freedom of the
                listener."
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-spacing-md"
            >
              <div className="p-spacing-lg bg-surface-elevated border border-border rounded-radius-xl shadow-xl backdrop-blur-md">
                <p className="text-text mb-spacing-md">
                  Desktop application initialized successfully.
                </p>
                <div className="grid grid-cols-2 gap-spacing-sm">
                  <div className="p-spacing-sm bg-bg/50 rounded-radius-md border border-border/50 text-font-size-sm">
                    <span className="text-text-muted block">Core</span>
                    <span className="text-accent">Connected</span>
                  </div>
                  <div className="p-spacing-sm bg-bg/50 rounded-radius-md border border-border/50 text-font-size-sm">
                    <span className="text-text-muted block">DSP</span>
                    <span className="text-accent">Active</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-spacing-md bg-accent hover:bg-accent-hover text-white rounded-radius-lg transition-colors font-medium shadow-lg shadow-accent/20"
              >
                Enter Experience
              </motion.button>
            </motion.div>

            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-spacing-2xl text-font-size-xs text-text-muted/50 tracking-widest uppercase"
            >
              The Wise Craftsman • Open Source Multimedia
            </motion.footer>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
