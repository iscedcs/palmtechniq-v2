import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { computeCheckoutTotals, DEFAULT_VAT_RATE } from "@/lib/payments/pricing";
import { validatePromoCode } from "@/lib/payments/promo";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code : "";
  const courseIds = Array.isArray(body?.courseIds)
    ? body.courseIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!code || courseIds.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "invalid_request" },
      { status: 400 }
    );
  }

  const promoResult = await validatePromoCode({
    code,
    userId: session.user.id,
    courseIds,
  });

  if (!promoResult.ok) {
    return NextResponse.json({ ok: false, reason: promoResult.reason }, { status: 400 });
  }

  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      basePrice: true,
      currentPrice: true,
      price: true,
      tutor: { select: { userId: true } },
    },
  });

  if (courses.length === 0) {
    return NextResponse.json({ ok: false, reason: "courses_not_found" }, { status: 404 });
  }

  const totals = computeCheckoutTotals({
    courses: courses.map((course) => ({
      id: course.id,
      tutorId: course.tutor.userId,
      basePrice: course.basePrice,
      currentPrice: course.currentPrice,
      price: course.price,
    })),
    promo: promoResult.promo,
    vatRate: DEFAULT_VAT_RATE,
  });

  return NextResponse.json({
    ok: true,
    promo: promoResult.promo,
    totals,
  });
}
