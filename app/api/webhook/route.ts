import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";

/**
 * Verify Paystack's HMAC over the exact bytes it signed.
 *
 * Two things this must not do:
 *
 *   1. Fall back to an empty signing key. `PAYSTACK_SECRET_KEY || ""` fails
 *      *open*: with the variable missing or misnamed, every signature is an
 *      HMAC under a key anyone can guess, so forged charge.success events
 *      would be accepted and enrolments handed out for free. A missing secret
 *      is a configuration failure and must refuse the request.
 *   2. Compare with `===`. String comparison returns as soon as two bytes
 *      differ, which leaks how much of a guess was correct. timingSafeEqual
 *      always reads both buffers.
 */
function isValidSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error(
      "PAYSTACK_SECRET_KEY is not set; refusing to process webhook.",
    );
    return false;
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  // timingSafeEqual throws on a length mismatch, and the attacker controls the
  // header, so the lengths are checked first.
  if (expected.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();
  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const evt = JSON.parse(rawBody);
  if (evt.event === "charge.success") {
    const reference = evt.data?.reference as string | undefined;
    if (reference) {
      try {
        await finalizePaystackByReference(reference);
      } catch (e) {
        console.error("webhook finalize error", e);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
