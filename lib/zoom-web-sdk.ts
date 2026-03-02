import jwt from "jsonwebtoken";

/**
 * Zoom Web SDK Integration for in-app video meetings
 * Uses Zoom Web SDK to embed meetings directly in the application
 */

export interface ZoomWebSDKConfig {
  meetingNumber: string;
  userName: string;
  userEmail: string;
  signature: string;
}

/**
 * Generate JWT signature for Zoom Web SDK client view
 * This allows users to join meetings directly in the browser without leaving the app
 */
export function generateZoomSignature(
  meetingNumber: string,
  role: 0 | 1 = 0, // 0 = participant, 1 = host/tutor
): string {
  const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured for Web SDK");
  }

  const payload = {
    appKey: clientId,
    mn: meetingNumber,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour validity
  };

  const signature = jwt.sign(payload, clientSecret, {
    algorithm: "HS256",
    header: {
      alg: "HS256",
      typ: "JWT",
    },
  });

  return signature;
}

/**
 * Extract meeting number from Zoom join URL
 * https://us05web.zoom.us/j/85255778697?pwd=ZyYjUz9zUa4mRW5Z5jMTfmnz0frOOu.1
 * → 85255778697
 */
export function extractMeetingNumberFromUrl(joinUrl: string): string {
  const match = joinUrl.match(/\/j\/(\d+)/);
  if (!match) {
    throw new Error("Invalid Zoom join URL format");
  }
  return match[1];
}

/**
 * Load Zoom Web SDK script dynamically
 */
export function loadZoomSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).ZoomSDK) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://source.zoom.us/1.8.4/zh-CN/ZoomSDK.js";
    script.async = true;
    script.onload = () => {
      console.log("[Zoom SDK] Loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.error("[Zoom SDK] Failed to load");
      reject(new Error("Failed to load Zoom Web SDK"));
    };
    document.head.appendChild(script);
  });
}
