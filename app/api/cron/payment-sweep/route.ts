import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  countStrandedPayments,
  sweepPendingPayments,
} from "@/lib/payments/sweep";

/**
 * Periodic payment sweep — settles charges that were taken but never
 * finalized, and marks abandoned checkouts as failed.
 *
 * Driven by .github/workflows/payment-sweep.yml. Authorised by a shared secret
 * rather than a session, because there is no user behind it.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Constant-time compare, so the secret cannot be guessed a character at a time. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(req: Request) {
  const expected = process.env.CRON_SECRET;

  // Fail closed. An unset secret must never mean "open to everyone".
  if (!expected) {
    console.error("[payment-sweep] CRON_SECRET is not set; refusing to run.");
    return NextResponse.json(
      { error: "Sweep is not configured" },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !secretMatches(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const report = await sweepPendingPayments();
    const stillStranded = await countStrandedPayments();

    // Settling anything here means the primary callback path failed, which is
    // worth seeing in the Actions output rather than only in a dashboard.
    if (report.settled > 0 || report.errors > 0) {
      console.log("[payment-sweep]", JSON.stringify(report));
    }

    return NextResponse.json({
      ok: true,
      ...report,
      stillStranded,
      tookMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[payment-sweep] failed:", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handle(req);
}

// GET is supported so the endpoint can be checked by hand with curl.
export async function GET(req: Request) {
  return handle(req);
}
