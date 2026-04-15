import { createHash } from "crypto";

const GRAPH_API_VERSION = "v25.0";
const DATASET_ID = process.env.META_DATASET_ID || "1870101670548284";
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN;

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // YYYYMMDD
  leadId?: string;
  clickId?: string;
  externalId?: string;
}

interface CRMEventPayload {
  eventName: string;
  eventTime?: number; // unix timestamp
  userData: UserData;
  customData?: Record<string, unknown>;
  /** Set to true for CRM-sourced events (uses system_generated action_source) */
  isCRM?: boolean;
}

function buildUserData(user: UserData) {
  const data: Record<string, unknown> = {};

  if (user.email) data.em = [sha256(user.email)];
  if (user.phone) {
    // Normalize: remove spaces/dashes, ensure starts with country code
    const normalized = user.phone.replace(/[\s\-()]/g, "");
    data.ph = [sha256(normalized)];
  }
  if (user.firstName) data.fn = [sha256(user.firstName)];
  if (user.lastName) data.ln = [sha256(user.lastName)];
  if (user.dateOfBirth) data.db = [sha256(user.dateOfBirth)];
  if (user.leadId) data.lead_id = user.leadId;
  if (user.clickId) data.fbc = user.clickId;
  if (user.externalId) data.external_id = [sha256(user.externalId)];

  return data;
}

/**
 * Send an event to Meta's Conversions API.
 * Use for server-side event tracking (CRM lead stage changes, purchases, etc.)
 */
export async function sendConversionEvent(payload: CRMEventPayload) {
  if (!ACCESS_TOKEN) {
    console.warn("[Meta CAPI] META_CONVERSIONS_API_TOKEN not set, skipping.");
    return null;
  }

  const eventTime = payload.eventTime ?? Math.floor(Date.now() / 1000);

  const eventData: Record<string, unknown> = {
    event_name: payload.eventName,
    event_time: eventTime,
    action_source: payload.isCRM ? "system_generated" : "website",
    user_data: buildUserData(payload.userData),
  };

  if (payload.isCRM) {
    eventData.custom_data = {
      event_source: "crm",
      lead_event_source: "PalmTechnIQ",
      ...payload.customData,
    };
  } else if (payload.customData) {
    eventData.custom_data = payload.customData;
  }

  const body = { data: [eventData] };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${DATASET_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("[Meta CAPI] Error:", json);
      return null;
    }

    return json;
  } catch (err) {
    console.error("[Meta CAPI] Network error:", err);
    return null;
  }
}

// ── Convenience helpers for common events ──

export function sendCRMLeadEvent(user: {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}) {
  return sendConversionEvent({
    eventName: "Lead",
    isCRM: true,
    userData: user,
  });
}

export function sendCRMPurchaseEvent(
  user: {
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalId?: string;
  },
  purchase: {
    currency: string;
    value: number;
    contentName?: string;
  },
) {
  return sendConversionEvent({
    eventName: "Purchase",
    isCRM: true,
    userData: user,
    customData: {
      currency: purchase.currency,
      value: purchase.value,
      content_name: purchase.contentName,
    },
  });
}

export function sendCRMRegistrationEvent(user: {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}) {
  return sendConversionEvent({
    eventName: "CompleteRegistration",
    isCRM: true,
    userData: user,
  });
}
