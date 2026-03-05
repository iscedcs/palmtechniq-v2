"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useNotificationsStore,
  type Notification,
} from "@/lib/store/notifications-store";
import { getUserPreferences } from "@/actions/user-preferences";
import { defaultUserPreferences } from "@/lib/user-preferences";

const POLL_INTERVAL = 10_000; // 10 seconds
const INITIAL_DELAY = 2_000; // Wait 2s after mount before first poll

interface UseNotificationPollingOptions {
  enabled?: boolean;
  interval?: number;
}

export function useNotificationPolling(
  options: UseNotificationPollingOptions = {},
) {
  const { enabled = true, interval = POLL_INTERVAL } = options;

  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(defaultUserPreferences);
  const preferencesRef = useRef(preferences);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Keep preferences ref in sync
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

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
      if (lastPollTime) {
        params.set("since", lastPollTime);
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

      setLastPollTime(timestamp);
    } catch (error) {
      // Silent fail - will retry on next interval
      console.warn("Notification poll failed:", error);
    } finally {
      if (mountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [lastPollTime, addNotification, shouldShowNotification]);

  // Initial fetch + polling interval
  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;

    // Initial delay before first poll
    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        poll();
      }
    }, INITIAL_DELAY);

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        poll();
      }
    }, interval);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
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
