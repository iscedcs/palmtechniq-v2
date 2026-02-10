import { NextRequest, NextResponse } from "next/server";
import { approveWithdrawalRequest } from "@/actions/withdrawal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const adminNote =
    typeof body?.adminNote === "string" ? body.adminNote : undefined;

  if (!id) {
    return NextResponse.json({ ok: false, reason: "missing_id" }, { status: 400 });
  }

  const result = await approveWithdrawalRequest(id, adminNote);
  if ("error" in result) {
    return NextResponse.json({ ok: false, reason: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
