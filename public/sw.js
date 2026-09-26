/*
 * PalmTechnIQ service worker — offline fallback only.
 *
 * WHAT IT DOES
 *
 * When a page load fails because the browser cannot reach the site, it shows
 * /offline.html instead of the browser's own "No internet" screen (for an
 * installed app, Chrome's grey "You're offline" placeholder). That is all.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 *   - It caches no pages. Only the offline page and its logo are stored. A
 *     signed-in dashboard, a checkout, a wallet: none of it is ever kept or
 *     served from here, so nothing can be shown stale or to the wrong person on
 *     a shared device.
 *   - It does not touch anything except page loads (navigations) and the offline
 *     page's own two files. API calls, server actions, images, scripts, styles
 *     and Next.js's own requests all go straight to the network, exactly as if
 *     this file did not exist.
 *   - It does not time out a slow connection. A weak connection that is still
 *     working must not be mistaken for no connection; only a request that
 *     actually FAILS falls back to the offline page.
 *
 * CHANGING IT
 *
 * The browser checks this file for changes on every visit, and it is served
 * with no-cache headers (see next.config.mjs). Bump VERSION if you change the
 * offline page or the precache list, so old caches are removed.
 *
 * SWITCHING IT OFF
 *
 * This runs for every visitor, so it is worth knowing how to remove it. Replace
 * the contents of this file with the following and deploy. Each browser picks
 * it up on its next visit, deletes the offline cache and unregisters itself:
 *
 *   self.addEventListener("install", () => self.skipWaiting());
 *   self.addEventListener("activate", (event) => {
 *     event.waitUntil(
 *       caches.keys()
 *         .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
 *         .then(() => self.registration.unregister()),
 *     );
 *   });
 *
 * Do NOT just delete the file: browsers that already installed the worker keep
 * running the old copy until they are given a new one that says to stop.
 */

const VERSION = "v2";
const CACHE = "ptq-offline-" + VERSION;
const OFFLINE_URL = "/offline.html";
const LOGO_URL = "/assets/palmtechniqlogo.png";
const PRECACHE = [OFFLINE_URL, LOGO_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // { cache: "reload" } bypasses the browser's HTTP cache, so a fresh
      // deploy's offline page is what gets stored, not an older copy.
      .then((cache) =>
        cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ptq-offline-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // The offline page's own logo. Served from the cache so it still appears with
  // no network. /ping.txt, the connectivity probe, is deliberately NOT in this
  // list: answering it from cache would make the page think it is always online.
  if (url.origin === self.location.origin && url.pathname === LOGO_URL) {
    event.respondWith(
      caches.match(LOGO_URL).then((cached) => cached || fetch(request)),
    );
    return;
  }

  // Page loads only. Everything else is left alone.
  if (request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch (error) {
        // The request failed outright: no route to the site. (A server error
        // such as a 500 is a response, not a failure, and passes through.)
        const cache = await caches.open(CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return offline || Response.error();
      }
    })(),
  );
});
