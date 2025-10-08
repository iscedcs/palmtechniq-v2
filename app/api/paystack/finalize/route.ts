import { NextRequest, NextResponse } from "next/server";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const reference =
    body?.reference || new URL(req.url).searchParams.get("reference");
  if (!reference)
    return NextResponse.json(
      { ok: false, reason: "missing_reference" },
      { status: 400 }
    );

  try {
    const res = await finalizePaystackByReference(reference);
    return NextResponse.json(res);
  } catch (e) {
    console.error("Finalize API error:", e);
    return NextResponse.json(
      { ok: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
