import { FixMissingStudentProfiles } from "@/actions/fix-missing-student-profiles";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await FixMissingStudentProfiles();
  if (result?.error) {
    return NextResponse.json(result, { status: 403 });
  }
  return NextResponse.json(result);
}
