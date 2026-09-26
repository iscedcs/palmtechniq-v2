"use client";

import { Download, Share, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Tells visitors PalmTechnIQ can be installed, and lets them do it.
 *
 * Browsers only install a site when the visitor asks (or accepts a prompt):
 *
 *   - Chrome, Edge and Samsung Internet on Android and desktop fire
 *     `beforeinstallprompt`. We hold the event and offer our own button, which
 *     replays it. Without a prompt of our own most people never learn the
 *     option exists — it hides in the browser menu.
 *   - iOS Safari has no such event and no API at all. The only way in is
 *     Share → Add to Home Screen, so on iPhone and iPad we show those steps.
 *
 * It stays out of the way: never once installed, never inside an installed
 * app, not until the visitor has been here a little while, not during an exam,
 * and once dismissed it stays away for two weeks.
 */

type InstallChoice = { outcome: "accepted" | "dismissed" };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const DISMISSED_KEY = "ptq-install-dismissed";
const DISMISS_DAYS = 14;
const SHOW_AFTER_MS = 20_000;
const QUIET_ROUTES = /(^|\/)(exam|exams|quiz|login|register|verify|checkout)(\/|$)/i;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS 13+ reports itself as a Mac, so tell it apart by its touch screen.
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// Only Safari can add to the home screen on iOS; Chrome and Firefox there cannot.
const isIosSafari = () =>
  isIos() && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault(); // hold it; we show our own button
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) setIos(true);
    const timer = setTimeout(() => setReady(true), SHOW_AFTER_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setHidden(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "dismissed") localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
    setDeferred(null);
  }, [deferred]);

  const canShow = ready && !hidden && (deferred !== null || ios) && !QUIET_ROUTES.test(pathname ?? "");
  if (!canShow) return null;

  return (
    <div
      role="dialog"
      aria-label="Install PalmTechnIQ"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-[hsl(192_100%_10%)] p-4 text-white shadow-2xl animate-in slide-in-from-bottom-6 fade-in duration-500 sm:left-auto sm:right-6 sm:bottom-6 sm:mx-0">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-3 top-3 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/pwa-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Install PalmTechnIQ</p>
          <p className="mt-0.5 text-sm leading-snug text-white/70">
            {deferred
              ? "Add it to your device for one-tap access, a full-screen experience and no browser bar."
              : "Add it to your home screen for one-tap access and a full-screen experience."}
          </p>
        </div>
      </div>

      {deferred ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(152_65%_48%)] to-[hsl(190_49%_67%)] px-4 py-2.5 text-sm font-semibold text-[#04241d] transition hover:opacity-90">
            <Download className="h-4 w-4" /> Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10">
            Not now
          </button>
        </div>
      ) : (
        <ol className="mt-3 space-y-1.5 rounded-xl bg-white/5 p-3 text-sm text-white/80">
          <li className="flex items-center gap-2">
            1. Tap <Share className="inline h-4 w-4 text-[hsl(190_49%_67%)]" aria-label="Share" /> in Safari&apos;s toolbar
          </li>
          <li>
            2. Choose <strong className="text-white">Add to Home Screen</strong>
          </li>
        </ol>
      )}
    </div>
  );
}
