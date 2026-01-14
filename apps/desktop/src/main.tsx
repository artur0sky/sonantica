/**
 * Sonántica Desktop - Entry Point
 *
 * "Respect the intention of the sound and the freedom of the listener."
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Check for system preference
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
