"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fromKobo, toKobo } from "@/lib/payments/revenue";
import {
  computeShares,
  latestClosablePeriod,
  monthPeriod,
  sumShares,
  validateShareTotal,
  type Period,
  type ShareHolder,
} from "@/lib/payments/distribution";
import { computeDistributionBase } from "@/lib/payments/distribution-base";
import { getFinanceOverview } from "@/actions/admin-finance-overview";

/**
 * Stakeholder distribution runs.
 *
 * Three states and two gates. A run is COMPUTED automatically into DRAFT,
 * where it is only a proposal and no money is owed. An admin APPROVES it,
 * which commits the money to named people and makes it show up as owed in the
 * money position. Shares are then marked PAID one at a time as the transfers
 * actually go out.
 *
 * The gates are what stop this quietly going wrong:
 *
 *  1. A run cannot be computed unless the active stakeholder percentages total
 *     exactly 100. Scaling a wrong set to fit would pay everyone a slightly
 *     wrong amount and hide the mistake.
 *  2. A run cannot be approved for more than the money position says is
 *     actually available. The base is accrual-basis and does not know about
 *     Paystack's fees, so it can run ahead of the cash; approving past that
 *     point would promise money the platform does not hold.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user;
}

async function activeHolders(): Promise<ShareHolder[]> {
  const rows = await db.stakeholder.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
    select: { id: true, name: true, sharePercent: true, priority: true },
  });
  return rows;
}

/** What a run for this period would look like, without creating one. */
export async function previewDistribution(periodStartISO?: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const now = new Date();
  const period = periodStartISO
    ? monthPeriod(new Date(periodStartISO))
    : latestClosablePeriod(now);

  if (!period) {
    return {
      ok: false as const,
      error:
        "No period is ready to distribute yet. A month can only be closed once the refund window has run on its last sale.",
    };
  }

  const holders = await activeHolders();
  const validity = validateShareTotal(holders);
  const base = await computeDistributionBase(period);

  const existing = await db.distribution.findUnique({
    where: { periodStart: period.start },
    select: { id: true, status: true },
  });

  return {
    ok: true as const,
    period: { ...period, start: period.start, end: period.end },
    base,
    holders,
    validity,
    existing,
    shares: validity.ok
      ? computeShares({ baseKobo: base.totalKobo, holders })
      : [],
  };
}

/**
 * Create or recompute the DRAFT run for a period.
 *
 * Recomputing is allowed while a run is still DRAFT, because a draft is only a
 * proposal and late settlements can land after it was first computed. Once
 * APPROVED the figures are frozen: the shares were agreed at those amounts.
 */
export async function computeDistributionRun(periodStartISO?: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const period: Period | null = periodStartISO
    ? monthPeriod(new Date(periodStartISO))
    : latestClosablePeriod(new Date());

  if (!period) {
    return {
      ok: false as const,
      error: "No period is ready to distribute yet.",
    };
  }

  const holders = await activeHolders();
  const validity = validateShareTotal(holders);
  if (!validity.ok) return { ok: false as const, error: validity.message };

  const existing = await db.distribution.findUnique({
    where: { periodStart: period.start },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== "DRAFT") {
    return {
      ok: false as const,
      error: `${period.label} has already been ${existing.status.toLowerCase()} and cannot be recomputed.`,
    };
  }

  const base = await computeDistributionBase(period);
  const shares = computeShares({ baseKobo: base.totalKobo, holders });

  // The parts must sum to the base exactly. A run that does not reconcile is
  // a bug, and it is better to refuse than to record it.
  const summed = sumShares(shares);
  if (summed !== base.totalKobo) {
    return {
      ok: false as const,
      error: `Refusing to record a run that does not reconcile: shares total ${summed} kobo against a base of ${base.totalKobo}.`,
    };
  }

  const run = await db.$transaction(async (tx: any) => {
    if (existing) {
      // Claim the draft first, conditional on it STILL being a draft.
      //
      // The status read above happened outside this transaction. Without this
      // claim, an approval committing in that gap was silently undone: the
      // delete below wiped the approved shares and replaced them with freshly
      // computed ones, while the run itself stayed APPROVED with its approver
      // and timestamp intact. The money owed changed under an approved run and
      // nothing recorded that it had.
      const claimed = await tx.distribution.updateMany({
        where: { id: existing.id, status: "DRAFT" },
        data: {
          periodEnd: period.end,
          baseKobo: base.totalKobo,
          computedAt: new Date(),
        },
      });
      if (claimed.count === 0) return null;

      // Replace the draft's rows wholesale rather than diffing them: a
      // stakeholder may have been added, retired or re-rated since.
      await tx.distributionShare.deleteMany({
        where: { distributionId: existing.id },
      });
      await tx.distributionShare.createMany({
        data: shares.map((s) => ({
          distributionId: existing.id,
          stakeholderId: s.stakeholderId,
          sharePercent: s.sharePercent,
          amountKobo: s.amountKobo,
          priority: s.priority,
        })),
      });
      return { id: existing.id };
    }

    return tx.distribution.create({
      data: {
        periodStart: period.start,
        periodEnd: period.end,
        baseKobo: base.totalKobo,
        shares: {
          create: shares.map((s) => ({
            stakeholderId: s.stakeholderId,
            sharePercent: s.sharePercent,
            amountKobo: s.amountKobo,
            priority: s.priority,
          })),
        },
      },
      select: { id: true },
    });
  });

  if (!run) {
    return {
      ok: false as const,
      error: `${period.label} was approved by someone else a moment ago, so it can no longer be recomputed. Reload to see it.`,
    };
  }

  return {
    ok: true as const,
    id: run.id,
    label: period.label,
    baseKobo: base.totalKobo,
    base: fromKobo(base.totalKobo),
    recomputed: !!existing,
  };
}

/**
 * Sign off a draft, committing the money.
 *
 * Guarded against the money position: the platform cannot promise more than
 * it holds. The base is accrual-basis and knows nothing of Paystack's fees, so
 * it can exceed the cash available; this is where that is caught.
 */
export async function approveDistribution(distributionId: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const run = await db.distribution.findUnique({
    where: { id: distributionId },
    select: {
      id: true,
      status: true,
      baseKobo: true,
      periodStart: true,
      shares: { select: { amountKobo: true } },
    },
  });

  if (!run) return { ok: false as const, error: "Run not found" };
  if (run.status !== "DRAFT") {
    return {
      ok: false as const,
      error: `This run is already ${run.status.toLowerCase()}.`,
    };
  }
  if (run.shares.length === 0) {
    return { ok: false as const, error: "This run has no shares to approve." };
  }

  const total = run.shares.reduce(
    (sum: number, s: { amountKobo: number }) => sum + s.amountKobo,
    0,
  );
  if (total <= 0) {
    return {
      ok: false as const,
      error: "This run distributes nothing, so there is nothing to approve.",
    };
  }

  const overview = await getFinanceOverview();
  const available =
    "error" in overview ? null : overview.position.available;

  if (available === null) {
    return {
      ok: false as const,
      error:
        "Paystack's balance could not be read, so there is no way to confirm the money is there. Try again shortly.",
    };
  }

  if (toKobo(available) < total) {
    return {
      ok: false as const,
      error: `This run commits ₦${fromKobo(total).toLocaleString()} but only ₦${available.toLocaleString()} is available once tutors, held earnings, VAT and earlier approved runs are set aside. Approving it would promise money the platform does not hold.`,
    };
  }

  // Conditional on DRAFT, so two admins approving at once commit once.
  const claimed = await db.distribution.updateMany({
    where: { id: run.id, status: "DRAFT" },
    data: {
      status: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    return {
      ok: false as const,
      error: "Someone else approved this a moment ago. Reload to see it.",
    };
  }

  return { ok: true as const, total: fromKobo(total) };
}

/** Record that one stakeholder's transfer has gone out. */
export async function markSharePaid({
  shareId,
  paymentRef,
}: {
  shareId: string;
  paymentRef: string;
}) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const ref = paymentRef?.trim();
  if (!ref) {
    return {
      ok: false as const,
      error: "A transfer reference is required, so the payment can be traced.",
    };
  }

  const share = await db.distributionShare.findUnique({
    where: { id: shareId },
    select: {
      id: true,
      status: true,
      distributionId: true,
      distribution: { select: { status: true } },
    },
  });

  if (!share) return { ok: false as const, error: "Share not found" };
  if (share.distribution.status === "DRAFT") {
    return {
      ok: false as const,
      error: "This run has not been approved yet, so nothing should have been paid.",
    };
  }
  if (share.status === "PAID") {
    return { ok: false as const, error: "This share is already marked paid." };
  }

  await db.$transaction(async (tx: any) => {
    await tx.distributionShare.updateMany({
      where: { id: shareId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), paymentRef: ref },
    });

    // The run is PAID only when none of its shares are still outstanding.
    const outstanding = await tx.distributionShare.count({
      where: { distributionId: share.distributionId, status: "PENDING" },
    });
    if (outstanding === 0) {
      await tx.distribution.update({
        where: { id: share.distributionId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }
  });

  return { ok: true as const };
}

/** Every run, newest first, for the admin screen. */
export async function listDistributions() {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const runs = await db.distribution.findMany({
    orderBy: { periodStart: "desc" },
    include: {
      shares: {
        orderBy: { priority: "asc" },
        include: {
          stakeholder: {
            select: {
              name: true,
              role: true,
              bankName: true,
              accountName: true,
              accountNumber: true,
            },
          },
        },
      },
    },
  });

  return { ok: true as const, runs };
}
