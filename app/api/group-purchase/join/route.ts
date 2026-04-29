import { NextResponse } from "next/server";
import { joinGroupPurchase } from "@/actions/group-purchase";

export async function POST(req: Request) {
  const body = await req.json();
  const inviteCode = body?.inviteCode as string | undefined;

  if (!inviteCode) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  const result = await joinGroupPurchase(inviteCode);
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
