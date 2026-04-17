import { create } from "zustand";

interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  isEnabled: boolean;
  userId?: string;
  sessionId: string;

  // Actions
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
  setEnabled: (enabled: boolean) => void;
  clearEvents: () => void;
  getEvents: () => AnalyticsEvent[];
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  trackEvent: (event, properties = {}) => get().track(event, properties), // ✅ Fix here

  events: [],
  isEnabled: true,
  sessionId: Date.now().toString(),

  track: (event: string, properties = {}) => {
    const { isEnabled, userId } = get();
    if (!isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      id: Date.now().toString(),
      event,
      properties: {
        ...properties,
        sessionId: get().sessionId,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "",
      },
      timestamp: new Date(),
      userId,
    };

    set((state) => ({
      events: [...state.events, analyticsEvent],
    }));

    // Persist to our internal analytics API
    if (typeof window !== "undefined") {
      const persistableEvents = new Set([
        "page_viewed", "course_viewed", "course_searched",
        "lesson_viewed", "blog_viewed", "promotion_viewed",
      ]);
      if (persistableEvents.has(event)) {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            entityType: properties.entityType,
            entityId: properties.entityId || properties.courseId,
            metadata: properties,
            path: properties.path || (typeof window !== "undefined" ? window.location.pathname : undefined),
            sessionId: get().sessionId,
          }),
        }).catch(() => {}); // Non-blocking
      }
    }

    // Send to external analytics services
    if (typeof window !== "undefined") {
      if (window.gtag) {
        window.gtag("event", event, properties);
      }

      if (window.fbq) {
        window.fbq("track", event, properties);
      }

      if (window.mixpanel) {
        window.mixpanel.track(event, properties);
      }
    }
  },

  identify: (userId: string, traits = {}) => {
    set({ userId });

    if (typeof window !== "undefined") {
      // Google Analytics
      if (window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
          user_id: userId,
        });
      }

      // Mixpanel
      if (window.mixpanel) {
        window.mixpanel.identify(userId);
        window.mixpanel.people.set(traits);
      }
    }
  },

  page: (name: string, properties = {}) => {
    get().track("Page View", {
      page: name,
      ...properties,
    });
  },

  setEnabled: (enabled: boolean) => {
    set({ isEnabled: enabled });
  },

  clearEvents: () => {
    set({ events: [] });
  },

  getEvents: () => {
    return get().events;
  },
}));

// Global analytics functions
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    useAnalyticsStore.getState().track(event, properties);
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    useAnalyticsStore.getState().identify(userId, traits);
  },
  page: (name: string, properties?: Record<string, any>) => {
    useAnalyticsStore.getState().page(name, properties);
  },
};
