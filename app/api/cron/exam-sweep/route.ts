import { db } from "@/lib/db";
import { countLiveAttempts, sweepExams } from "@/lib/exam/sweep";
import type { PrismaClient } from "@prisma/client";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Periodic Exam Center sweep — auto-submits expired attempts, closes finished
 * exams, and marks no-shows.
 *
 * Driven by .github/workflows/exam-sweep.yml. Authorised by a shared secret
 * rather than a session, because there is no user behind it.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = db as PrismaClient;

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
    console.error("[exam-sweep] CRON_SECRET is not set; refusing to run.");
    return NextResponse.json({ error: "Sweep is not configured" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !secretMatches(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const report = await sweepExams(prisma);
    const stillLive = await countLiveAttempts(prisma);

    // Logged so a run that did something is visible in the Actions output.
    if (report.attemptsSubmitted > 0 || report.examsClosed > 0) {
      console.log("[exam-sweep]", JSON.stringify(report));
    }

    return NextResponse.json({
      ok: true,
      ...report,
      attemptsStillLive: stillLive,
      tookMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[exam-sweep] failed:", error);
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
