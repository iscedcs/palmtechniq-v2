"use client";

import { saveExamResponse } from "@/actions/exam-attempt";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Autosave for an exam in progress.
 *
 * Answers go into a queue keyed by question id, so a candidate changing their
 * mind five times sends one write, not five. The queue drains in the background
 * and survives a dropped connection: a failed flush stays queued and retries with
 * backoff rather than being lost.
 *
 * Every write carries `clientSavedAt`. The server uses it to drop out-of-order
 * arrivals, which is what stops a queue draining after an offline spell from
 * overwriting newer answers with older ones.
 */

export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

type PendingWrite = {
  answer: unknown;
  isFlagged: boolean;
  clientSavedAt: Date;
};

const DEBOUNCE_MS = 700;
const MAX_BACKOFF_MS = 15_000;

export function useExamAutosave(attemptId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const queue = useRef(new Map<string, PendingWrite>());
  const flushing = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncPendingCount = useCallback(() => {
    setPendingCount(queue.current.size);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    if (queue.current.size === 0) {
      setStatus((s) => (s === "saving" ? "saved" : s));
      return;
    }

    flushing.current = true;
    setStatus("saving");

    // Snapshot the keys so answers changed mid-flush stay queued for the next pass
    // instead of being dropped.
    const entries = Array.from(queue.current.entries());
    let failed = false;

    for (const [questionId, write] of entries) {
      try {
        const result = await saveExamResponse({
          attemptId,
          questionId,
          answer: write.answer,
          clientSavedAt: write.clientSavedAt,
          isFlagged: write.isFlagged,
        });

        if ("error" in result && result.error) {
          // A refusal is final — retrying an expired or submitted attempt will
          // never start working. Drop it and surface the state.
          queue.current.delete(questionId);
          failed = true;
          continue;
        }

        // Only clear if nothing newer arrived while this request was in flight.
        const current = queue.current.get(questionId);
        if (current && current.clientSavedAt <= write.clientSavedAt) {
          queue.current.delete(questionId);
        }
      } catch {
        // Network failure: keep it queued and try again later.
        failed = true;
        break;
      }
    }

    flushing.current = false;
    syncPendingCount();

    if (failed && queue.current.size > 0) {
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      backoff.current = Math.min(
        backoff.current === 0 ? 1000 : backoff.current * 2,
        MAX_BACKOFF_MS,
      );
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => void flush(), backoff.current);
      return;
    }

    backoff.current = 0;
    if (queue.current.size === 0) {
      setStatus("saved");
      setLastSavedAt(new Date());
    } else {
      void flush();
    }
  }, [attemptId, syncPendingCount]);

  /** Queue an answer. Safe to call on every keystroke. */
  const queueAnswer = useCallback(
    (questionId: string, answer: unknown, isFlagged = false) => {
      queue.current.set(questionId, { answer, isFlagged, clientSavedAt: new Date() });
      syncPendingCount();
      setStatus("saving");

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush, syncPendingCount],
  );

  /** Drain immediately — used before submitting. */
  const flushNow = useCallback(async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    await flush();
    return queue.current.size === 0;
  }, [flush]);

  // Retry the moment the connection comes back rather than waiting out the backoff.
  useEffect(() => {
    const onOnline = () => {
      backoff.current = 0;
      void flush();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", () => setStatus("offline"));
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [flush]);

  // Warn before leaving with work still queued.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (queue.current.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return { queueAnswer, flushNow, status, lastSavedAt, pendingCount };
}
