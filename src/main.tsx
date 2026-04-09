import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA Service Worker registration — only in production, never in iframes/preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isInIframe && !isPreviewHost && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] SW registered", reg.scope);
        // Auto-update: check for new SW every 60 seconds
        setInterval(() => reg.update(), 60 * 1000);
        // When new SW is waiting, activate it immediately
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener("statechange", () => {
              if (newSW.state === "activated") {
                console.log("[PWA] New version available — reloading");
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => console.error("[PWA] SW failed", err));
  });

  // Listen for SW_UPDATED message from service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED") {
      window.location.reload();
    }
  });
} else if (isPreviewHost || isInIframe) {
  // Unregister any stale SW in preview
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
