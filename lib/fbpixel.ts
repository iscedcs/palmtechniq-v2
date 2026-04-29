// lib/fbpixel.ts
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

type FBQ = (...args: any[]) => void;

function getFbq(): FBQ | null {
  if (typeof window !== "undefined" && (window as any).fbq) {
    return (window as any).fbq;
  }
  return null;
}

// Track page views
export const pageview = () => {
  getFbq()?.("track", "PageView");
};

// Track generic events
export const event = (name: string, options = {}) => {
  getFbq()?.("track", name, options);
};

// ── Standard Meta Pixel Events ──

export const trackInitiateCheckout = (params: {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  currency?: string;
  value?: number;
  num_items?: number;
}) => {
  getFbq()?.("track", "InitiateCheckout", params);
};

export const trackPurchase = (params: {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  currency: string;
  value: number;
  num_items?: number;
}) => {
  getFbq()?.("track", "Purchase", params);
};

export const trackCompleteRegistration = (params?: {
  content_name?: string;
  currency?: string;
  value?: number;
  status?: boolean;
}) => {
  getFbq()?.("track", "CompleteRegistration", params ?? {});
};

export const trackAddToCart = (params: {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  currency?: string;
  value?: number;
}) => {
  getFbq()?.("track", "AddToCart", params);
};

export const trackSearch = (params: {
  search_string: string;
  content_category?: string;
}) => {
  getFbq()?.("track", "Search", params);
};

export const trackLead = (params?: {
  content_name?: string;
  content_category?: string;
  currency?: string;
  value?: number;
}) => {
  getFbq()?.("track", "Lead", params ?? {});
};

export const trackSubmitApplication = (params?: {
  content_name?: string;
  content_category?: string;
}) => {
  getFbq()?.("track", "SubmitApplication", params ?? {});
};
