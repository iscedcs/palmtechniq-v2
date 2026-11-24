import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  releaseDueEarnings,
  releaseDueGroupCashback,
} from "@/lib/payments/release-due-earnings";

/**
 * Releases course and mentorship earnings whose refund window has closed.
 *
 * Driven by .github/workflows/earnings-release.yml. Authorised by a shared
 * secret rather than a session, because there is no user behind it.
 *
 * Scope: COURSE and MENTORSHIP earnings only. Program earnings are released by
 * an admin per cohort, because they carry a judgement this cannot make (a
 * cohort cancelled for low enrolment must never pay out).
 *
 * Idempotent. Each release is a conditional status update, so an overlapping
 * or repeated run claims nothing and credits nothing.
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
    console.error(
      "[earnings-release] CRON_SECRET is not set; refusing to run.",
    );
    return NextResponse.json(
      { error: "Release is not configured" },
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
    const report = await releaseDueEarnings();

    console.log(
      `[earnings-release] released ${report.released} earning(s) totalling ₦${report.total.toLocaleString()} to ${report.tutorsCredited} tutor(s)${report.more ? ", more waiting" : ""}`,
    );

    // Strictly after the earnings above. Group cashback is funded from the
    // tutor's share of that group's sales, so on the tick where both come due
    // the funding wallet is only topped up once releaseDueEarnings has run.
    const cashback = await releaseDueGroupCashback();

    console.log(
      `[earnings-release] released cashback for ${cashback.released} group(s) totalling ₦${cashback.total.toLocaleString()}${cashback.blocked > 0 ? `, ${cashback.blocked} unfunded and needing attention` : ""}`,
    );

    return NextResponse.json({
      ok: true,
      ...report,
      cashback,
      tookMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[earnings-release] failed:", error);
    return NextResponse.json(
      { error: "Release failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return handle(req);
}

// GET is supported so the endpoint can be checked by hand with curl.
export async function GET(req: Request) {
  return handle(req);
}
