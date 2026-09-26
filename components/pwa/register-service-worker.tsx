"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which shows the offline page when a page load fails.
 *
 * Production only. In development a service worker fights hot reloading, and the
 * offline behaviour is only meaningful against a real build anyway. Registration
 * waits for the page's own load to finish so it never competes with it, and a
 * failure is logged and otherwise ignored: without the worker the site simply
 * behaves as it did before, with the browser's own offline screen.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) =>
          console.warn("[offline] service worker not registered:", error),
        );
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
