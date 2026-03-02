import { NextRequest, NextResponse } from "next/server";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  let reference =
    body?.reference || new URL(req.url).searchParams.get("reference");
  
  // Handle case where reference might be an array (duplicate query params)
  if (Array.isArray(reference)) {
    reference = reference[0];
  }
  
  if (!reference || typeof reference !== "string")
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
