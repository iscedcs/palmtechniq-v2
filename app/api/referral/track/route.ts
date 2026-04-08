import { NextRequest, NextResponse } from "next/server";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_MAX_AGE,
  resolveTutorReferralCode,
} from "@/lib/referral";

/**
 * GET /api/referral/track?ref=CODE
 * Sets a cookie to track the tutor referral code.
 * Returns the tutor userId if valid.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");

  if (!ref || typeof ref !== "string") {
    return NextResponse.json(
      { ok: false, reason: "missing_ref" },
      { status: 400 },
    );
  }

  const tutorUserId = await resolveTutorReferralCode(ref);

  if (!tutorUserId) {
    return NextResponse.json(
      { ok: false, reason: "invalid_ref" },
      { status: 404 },
    );
  }

  const response = NextResponse.json({ ok: true, tutorUserId });

  response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
