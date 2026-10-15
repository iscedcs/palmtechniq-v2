import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startPolling } from "../poll-scheduler";

let visible = true;
let notifyVisibility: () => void = () => {};

const start = (poll: () => void) =>
  startPolling({
    poll,
    interval: 30_000,
    initialDelay: 2_000,
    isVisible: () => visible,
    subscribeVisibility: (onChange) => {
      notifyVisibility = onChange;
      return () => {
        notifyVisibility = () => {};
      };
    },
  });

beforeEach(() => {
  vi.useFakeTimers();
  visible = true;
  notifyVisibility = () => {};
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startPolling", () => {
  it("polls once after the initial delay", () => {
    const poll = vi.fn();
    start(poll);
    vi.advanceTimersByTime(1_999);
    expect(poll).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("then polls at the interval, not at the initial delay", () => {
    const poll = vi.fn();
    start(poll);
    vi.advanceTimersByTime(2_000);
    expect(poll).toHaveBeenCalledTimes(1);

    // The old bug: a finished poll re-armed the timers, so the next poll
    // came 2s later. Two minutes at a 30s interval is 4 polls, plus the first.
    vi.advanceTimersByTime(120_000);
    expect(poll).toHaveBeenCalledTimes(5);
  });

  it("does not poll while the tab is hidden", () => {
    const poll = vi.fn();
    start(poll);
    visible = false;
    vi.advanceTimersByTime(300_000);
    expect(poll).not.toHaveBeenCalled();
  });

  it("polls once when the tab becomes visible again", () => {
    const poll = vi.fn();
    start(poll);
    visible = false;
    vi.advanceTimersByTime(300_000);
    visible = true;
    notifyVisibility();
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("does not poll when visibility changes to hidden", () => {
    const poll = vi.fn();
    start(poll);
    visible = false;
    notifyVisibility();
    expect(poll).not.toHaveBeenCalled();
  });

  it("stops completely", () => {
    const poll = vi.fn();
    const scheduler = start(poll);
    scheduler.stop();
    vi.advanceTimersByTime(600_000);
    notifyVisibility();
    expect(poll).not.toHaveBeenCalled();
  });
});
