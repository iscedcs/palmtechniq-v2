/**
 * Timing for the notification poller.
 *
 * Kept out of the React hook so the cadence can be tested. The hook used to
 * re-arm its timers every time a poll finished (its effect depended on the
 * last-poll timestamp, which changes after every poll), so the next poll fired
 * 2 seconds later instead of 10 and the "every 10 seconds" setting never took
 * effect. Each poll costs a function invocation and two database queries, so
 * every open tab was keeping the database awake around the clock.
 *
 * Two rules here, both there to keep the database able to sleep:
 *   - the interval is armed once and never re-armed by a poll finishing;
 *   - nothing polls while the tab is hidden, and one poll runs when it becomes
 *     visible again so it catches up.
 */

export type PollScheduler = { stop: () => void };

type Options = {
  poll: () => void;
  /** Milliseconds between polls while the tab is visible. */
  interval: number;
  /** Milliseconds before the first poll after starting. */
  initialDelay: number;
  isVisible?: () => boolean;
  /** Subscribe to visibility changes; returns an unsubscribe function. */
  subscribeVisibility?: (onChange: () => void) => () => void;
};

const documentIsVisible = () =>
  typeof document === "undefined" || document.visibilityState === "visible";

const subscribeToDocumentVisibility = (onChange: () => void) => {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

export function startPolling({
  poll,
  interval,
  initialDelay,
  isVisible = documentIsVisible,
  subscribeVisibility = subscribeToDocumentVisibility,
}: Options): PollScheduler {
  const tick = () => {
    if (isVisible()) poll();
  };

  const first = setTimeout(tick, initialDelay);
  const timer = setInterval(tick, interval);
  const unsubscribe = subscribeVisibility(tick);

  return {
    stop() {
      clearTimeout(first);
      clearInterval(timer);
      unsubscribe();
    },
  };
}
