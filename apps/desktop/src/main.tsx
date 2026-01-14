/**
 * Sonántica Desktop - Entry Point
 *
 * "Respect the intention of the sound and the freedom of the listener."
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
