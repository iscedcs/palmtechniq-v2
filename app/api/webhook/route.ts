import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";

function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(rawBody)
    .digest("hex");
  return hash === signature;
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
