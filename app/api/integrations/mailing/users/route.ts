import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";
import {
  assertIntegrationAccess,
  IntegrationAuthError,
} from "@/lib/integration-auth";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 250;
const MAX_LIMIT = 1000;

type UserSyncItem = {
  id: string;
  email: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  isActive: boolean;
  source: "user" | "registration";
};

type SyncSourceUser = {
  id: string;
  email: string;
  name: string;
  updatedAt: Date;
  createdAt: Date;
  isActive: boolean;
};

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function parseSince(rawSince: string | null) {
  if (!rawSince) return null;
  const parsed = new Date(rawSince);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    assertIntegrationAccess(req);

    const clientKey =
      req.headers.get("x-integration-key") ||
      req.headers.get("x-api-key") ||
      "integration";

    await rateLimiter({
      key: `mailing-sync:${clientKey.slice(0, 12)}`,
      limit: 120,
      window: 60,
    });

    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get("limit"));
    const since = parseSince(searchParams.get("since"));
    const cursor = searchParams.get("cursor");

    const users = await db.user.findMany({
      where: {
        email: { not: "" },
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: limit + 1,
    });

    const hasMore = users.length > limit;
    const pageItems: SyncSourceUser[] = hasMore ? users.slice(0, limit) : users;

    const data: UserSyncItem[] = pageItems.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      updatedAt: user.updatedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      source: "user" as const,
    }));

    // On the first page only, also include program_registrations.
    // The client deduplicates by email, so user records (added above) take
    // precedence over registration records for any overlap.
    if (!cursor) {
      const registrations = await db.programRegistration.findMany({
        where: {
          email: { not: "" },
          ...(since
            ? {
                OR: [
                  { createdAt: { gt: since } },
                  { updatedAt: { gt: since } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const userEmailSet = new Set(
        pageItems.map((u) => u.email.trim().toLowerCase()),
      );

      for (const reg of registrations) {
        if (!reg.email || userEmailSet.has(reg.email.trim().toLowerCase())) {
          continue;
        }
        data.push({
          id: reg.id,
          email: reg.email,
          name: reg.fullName,
          updatedAt: reg.updatedAt.toISOString(),
          createdAt: reg.createdAt.toISOString(),
          isActive: true,
          source: "registration",
        });
      }
    }

    const nextCursor = hasMore
      ? (pageItems[pageItems.length - 1]?.id ?? null)
      : null;
    const latestSyncAt =
      data.length > 0 ? (data[data.length - 1]?.updatedAt ?? null) : null;

    return NextResponse.json({
      data,
      paging: {
        hasMore,
        nextCursor,
        limit,
      },
      sync: {
        since: since?.toISOString() ?? null,
        latestSyncAt,
      },
    });
  } catch (error) {
    if (error instanceof IntegrationAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    console.error("Mailing users sync failed", error);
    return NextResponse.json(
      { error: "Failed to sync users." },
      { status: 500 },
    );
  }
}
