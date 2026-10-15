"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useNotificationsStore,
  type Notification,
} from "@/lib/store/notifications-store";
import { getUserPreferences } from "@/actions/user-preferences";
import { defaultUserPreferences } from "@/lib/user-preferences";
import { startPolling } from "@/lib/notifications/poll-scheduler";

// Every poll is a function call plus two database queries per open tab, so
// this is a direct hosting cost. See lib/notifications/poll-scheduler.ts.
const POLL_INTERVAL = 30_000; // 30 seconds, while the tab is visible
const INITIAL_DELAY = 2_000; // Wait 2s after mount before first poll

interface UseNotificationPollingOptions {
  enabled?: boolean;
  interval?: number;
}

export function useNotificationPolling(
  options: UseNotificationPollingOptions = {},
) {
  const { interval = POLL_INTERVAL } = options;

  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id ?? null;
  // Only actually poll once we know who's asking — and only when someone is
  // signed in. `options.enabled` can still force it off (e.g. tests).
  const enabled =
    (options.enabled ?? true) && sessionStatus !== "loading" && !!userId;

  const addNotification = useNotificationsStore((s) => s.addNotification);
  const syncOwner = useNotificationsStore((s) => s.syncOwner);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  // `poll` reads this, not the state above. If it depended on the state, every
  // finished poll would change `poll` and re-arm the timers; see poll-scheduler.
  const lastPollTimeRef = useRef<string | null>(null);
  const [preferences, setPreferences] = useState(defaultUserPreferences);
  const preferencesRef = useRef(preferences);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Keep preferences ref in sync
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // The store persists to one shared localStorage key for the whole browser.
  // Whenever the signed-in identity here doesn't match who the store
  // currently belongs to — a different account signed in, or this one
  // signed out — hand ownership over and wipe whatever was left, so no one
  // ever sees a notification meant for someone else. Also resets this
  // instance's own polling state so the next poll re-fetches recent history
  // fresh rather than treating the previous owner's "seen" ids as ours.
  useEffect(() => {
    if (sessionStatus === "loading") return;
    syncOwner(userId);
    seenIdsRef.current = new Set();
    lastPollTimeRef.current = null;
    setLastPollTime(null);
  }, [userId, sessionStatus, syncOwner]);

  // Load user preferences on mount
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const result = await getUserPreferences();
        if (isMounted) {
          setPreferences(result.preferences);
        }
      } catch {
        if (isMounted) {
          setPreferences(defaultUserPreferences);
        }
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  const shouldShowNotification = useCallback((data: any) => {
    const current = preferencesRef.current;
    if (!current?.pushNotifications) return false;

    const rawCategory =
      data?.metadata?.category || data?.metadata?.type || data?.type || "";
    const category = String(rawCategory).toLowerCase();

    if (category.includes("course") && category.includes("reminder")) {
      return current.courseReminders;
    }
    if (category.includes("mentorship")) {
      return current.mentorshipAlerts;
    }
    if (category.includes("achievement")) {
      return current.achievementNotifications;
    }
    if (category.includes("weekly") && category.includes("progress")) {
      return current.weeklyProgress;
    }
    if (category.includes("marketing")) {
      return current.marketingEmails;
    }

    return true;
  }, []);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setIsPolling(true);

      const params = new URLSearchParams();
      const since = lastPollTimeRef.current;
      if (since) {
        params.set("since", since);
      }
      params.set("limit", "50");

      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const { notifications, timestamp } = await res.json();

      if (!mountedRef.current) return;

      // Process new notifications
      for (const n of notifications) {
        // Skip if we've already seen this notification
        if (seenIdsRef.current.has(n.id)) continue;
        seenIdsRef.current.add(n.id);

        // Check user preferences before showing
        if (!shouldShowNotification(n)) continue;

        // Add to store (which handles deduplication)
        addNotification({
          type: n.type,
          title: n.title,
          message: n.message,
          actionUrl: n.actionUrl,
          actionLabel: n.actionLabel,
          metadata: { ...n.metadata, dbId: n.id },
        });
      }

      lastPollTimeRef.current = timestamp;
      setLastPollTime(timestamp);
    } catch (error) {
      // Silent fail - will retry on next interval
      console.warn("Notification poll failed:", error);
    } finally {
      if (mountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [addNotification, shouldShowNotification]);

  // Initial fetch + polling interval. `poll` is stable, so this effect runs
  // once per sign-in and the timers are never re-armed by a poll finishing.
  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;

    const scheduler = startPolling({
      poll: () => {
        if (mountedRef.current) void poll();
      },
      interval,
      initialDelay: INITIAL_DELAY,
    });

    return () => {
      mountedRef.current = false;
      scheduler.stop();
    };
  }, [enabled, interval, poll]);

  // Hydrate seen IDs from persisted notifications on mount
  useEffect(() => {
    const stored = useNotificationsStore.getState().notifications;
    for (const n of stored) {
      const dbId = n.metadata?.dbId;
      if (dbId) {
        seenIdsRef.current.add(dbId);
      }
    }
  }, []);

  return {
    isPolling,
    lastPollTime,
    refetch: poll,
  };
}
