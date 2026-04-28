import crypto from "crypto";
import { NextRequest } from "next/server";

export class IntegrationAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "IntegrationAuthError";
    this.status = status;
  }
}

function safeCompare(secretA: string, secretB: string) {
  const a = Buffer.from(secretA, "utf8");
  const b = Buffer.from(secretB, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipFromHeader = forwardedFor?.split(",")[0]?.trim();
  const rawIp = ipFromHeader || req.headers.get("x-real-ip") || "";

  if (!rawIp) {
    return process.env.NODE_ENV === "development" ? "127.0.0.1" : "unknown";
  }

  if (rawIp === "::1" || rawIp === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1";
  }

  return rawIp;
}

function parseAllowlist(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function assertIntegrationAccess(req: NextRequest) {
  const primaryKey = process.env.MAILING_SYNC_API_KEY;
  const rotatedKey = process.env.MAILING_SYNC_API_KEY_PREVIOUS;

  if (!primaryKey) {
    throw new IntegrationAuthError("Integration key is not configured.", 500);
  }

  const providedKey =
    req.headers.get("x-integration-key") ||
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!providedKey) {
    throw new IntegrationAuthError("Missing integration key.", 401);
  }

  const validPrimary = safeCompare(providedKey, primaryKey);
  const validRotated = rotatedKey
    ? safeCompare(providedKey, rotatedKey)
    : false;
  if (!validPrimary && !validRotated) {
    throw new IntegrationAuthError("Invalid integration key.", 401);
  }

}
