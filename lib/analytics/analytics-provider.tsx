"use client";

import type React from "react";

import { createContext, useContext, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth-store";
import { useAnalyticsStore } from "../store/analytics-store";

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name?: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { trackEvent } = useAnalyticsStore();

  // Track page views
  useEffect(() => {
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams?.toString()}` : "");

    trackEvent("page_view", {
      path: pathname,
      url,
      search: searchParams?.toString(),
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      userId: user?.id,
    });
  }, [pathname, searchParams, user?.id, trackEvent]);

  // Track user sessions
  useEffect(() => {
    if (isAuthenticated && user) {
      trackEvent("session_start", {
        userId: user.id,
        userRole: user.role,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isAuthenticated, user, trackEvent]);

  // Track user interactions
  const track = (event: string, properties?: Record<string, any>) => {
    trackEvent(event, {
      ...properties,
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      path: pathname,
    });

    // Send to external analytics services
    if (typeof window !== "undefined") {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag("event", event, {
          custom_parameter_1: properties?.category,
          custom_parameter_2: properties?.label,
          value: properties?.value,
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq("track", event, properties);
      }

      // Mixpanel
      if (window.mixpanel) {
        window.mixpanel.track(event, properties);
      }

      // Amplitude
      if (window.amplitude) {
        window.amplitude.getInstance().logEvent(event, properties);
      }
    }
  };

  // Identify user
  const identify = (userId: string, traits?: Record<string, any>) => {
    trackEvent("user_identified", {
      userId,
      traits,
      timestamp: new Date().toISOString(),
    });

    // Send to external analytics services
    if (typeof window !== "undefined") {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag("config", "GA_MEASUREMENT_ID", {
          user_id: userId,
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq("init", "FACEBOOK_PIXEL_ID", {
          external_id: userId,
        });
      }

      // Mixpanel
      if (window.mixpanel) {
        window.mixpanel.identify(userId);
        if (traits) {
          window.mixpanel.people.set(traits);
        }
      }

      // Amplitude
      if (window.amplitude) {
        window.amplitude.getInstance().setUserId(userId);
        if (traits) {
          window.amplitude.getInstance().setUserProperties(traits);
        }
      }
    }
  };

  // Track page views manually
  const page = (name?: string, properties?: Record<string, any>) => {
    trackEvent("page_view", {
      name: name || document.title,
      path: pathname,
      ...properties,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  };

  const value: AnalyticsContextType = {
    track,
    identify,
    page,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ================================
// ANALYTICS HOOKS
// ================================

export function usePageTracking() {
  const { page } = useAnalytics();
  return { page };
}

export function useEventTracking() {
  const { track } = useAnalytics();

  const trackCourseView = (courseId: string, courseTitle: string) => {
    track("course_viewed", {
      courseId,
      courseTitle,
      category: "course",
    });
  };

  const trackCourseEnroll = (
    courseId: string,
    courseTitle: string,
    price: number
  ) => {
    track("course_enrolled", {
      courseId,
      courseTitle,
      price,
      category: "conversion",
    });
  };

  const trackLessonComplete = (
    lessonId: string,
    lessonTitle: string,
    courseId: string
  ) => {
    track("lesson_completed", {
      lessonId,
      lessonTitle,
      courseId,
      category: "engagement",
    });
  };

  const trackQuizAttempt = (
    quizId: string,
    score: number,
    courseId: string
  ) => {
    track("quiz_attempted", {
      quizId,
      score,
      courseId,
      category: "assessment",
    });
  };

  const trackSearch = (query: string, resultsCount: number) => {
    track("search_performed", {
      query,
      resultsCount,
      category: "search",
    });
  };

  const trackCartAdd = (
    courseId: string,
    courseTitle: string,
    price: number
  ) => {
    track("add_to_cart", {
      courseId,
      courseTitle,
      price,
      category: "ecommerce",
    });
  };

  const trackPurchase = (
    transactionId: string,
    total: number,
    items: any[]
  ) => {
    track("purchase", {
      transactionId,
      total,
      items,
      category: "ecommerce",
    });
  };

  const trackVideoProgress = (
    videoId: string,
    progress: number,
    duration: number
  ) => {
    track("video_progress", {
      videoId,
      progress,
      duration,
      category: "engagement",
    });
  };

  const trackDownload = (resourceId: string, resourceType: string) => {
    track("resource_downloaded", {
      resourceId,
      resourceType,
      category: "engagement",
    });
  };

  const trackSocialShare = (
    platform: string,
    contentType: string,
    contentId: string
  ) => {
    track("content_shared", {
      platform,
      contentType,
      contentId,
      category: "social",
    });
  };

  return {
    trackCourseView,
    trackCourseEnroll,
    trackLessonComplete,
    trackQuizAttempt,
    trackSearch,
    trackCartAdd,
    trackPurchase,
    trackVideoProgress,
    trackDownload,
    trackSocialShare,
  };
}

export function useUserTracking() {
  const { identify } = useAnalytics();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      identify(user.id, {
        name: user.firstName + " " + user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      });
    }
  }, [user, identify]);
}

// ================================
// ANALYTICS DASHBOARD HOOK
// ================================

export function useAnalyticsDashboard() {
  const { getEvents } = useAnalyticsStore();

  const getEventsByType = (eventType: string) => {
    return getEvents().filter((event) => event.event === eventType);
  };

  const getEventsInDateRange = (startDate: Date, endDate: Date) => {
    return getEvents().filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  const getTopEvents = (limit = 10) => {
    const eventCounts = getEvents().reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  };

  const getUserActivity = (userId: string) => {
    return getEvents().filter((event) => event.userId === userId);
  };

  const getConversionFunnel = () => {
    const events = getEvents();
    const pageViews = events.filter((e) => e.event === "page_view").length;
    const courseViews = events.filter(
      (e) => e.event === "course_viewed"
    ).length;
    const cartAdds = events.filter((e) => e.event === "add_to_cart").length;
    const purchases = events.filter((e) => e.event === "purchase").length;

    return {
      pageViews,
      courseViews,
      cartAdds,
      purchases,
      viewToCartRate: courseViews > 0 ? (cartAdds / courseViews) * 100 : 0,
      cartToPurchaseRate: cartAdds > 0 ? (purchases / cartAdds) * 100 : 0,
      overallConversionRate: pageViews > 0 ? (purchases / pageViews) * 100 : 0,
    };
  };

  return {
    getEventsByType,
    getEventsInDateRange,
    getTopEvents,
    getUserActivity,
    getConversionFunnel,
  };
}

// ================================
// GLOBAL ANALYTICS DECLARATIONS
// ================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    mixpanel: any;
    amplitude: any;
  }
}
