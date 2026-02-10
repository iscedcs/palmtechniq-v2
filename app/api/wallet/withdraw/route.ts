import { NextRequest, NextResponse } from "next/server";
import { requestWithdrawal } from "@/actions/withdrawal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);

  const result = await requestWithdrawal(amount);
  if ("error" in result) {
    return NextResponse.json({ ok: false, reason: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
