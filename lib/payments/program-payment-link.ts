import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { paystackInitialize, paystackVerify } from "@/actions/paystack";
import { accrueProgramEarning } from "@/actions/program-earnings";
import { provisionUserAccount } from "@/lib/program-enrollment/provision-user-account";
import { allocateAmountWholeNaira } from "@/lib/payments/revenue";
import { getProgramBySlug } from "@/data/programs";
import {
  parseCohortValue,
  formatCohortName,
  getAvailableCohorts,
} from "@/lib/cohort";
import {
  sendEnrollmentConfirmation,
  sendAdminEnrollmentNotification,
} from "@/lib/mail";
import { buildInstallmentReceipt, sendReceipt } from "@/lib/receipts";
import { sendCRMPurchaseEvent } from "@/lib/meta-conversions";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";
import { SITE_URL } from "@/lib/site";

/**
 * Admin payment links for negotiated multi-program deals.
 *
 * One link = one quoted price for one or more ProfessionalPrograms, paid in a
 * single Paystack charge from /pay/<token>. Settlement reuses the standard
 * program machinery: one ProgramEnrollment + one InstallmentPayment per
 * program, FULLY_PAID on settlement, and the lead instructor's 25% accrues
 * PENDING exactly as it does for the public enroll form — only the basis is
 * the negotiated amount (ProgramEnrollment.negotiatedAmount), not the program's
 * list fullPrice.
 *
 * References use a "ppl_" prefix so the Paystack webhook can route them here
 * instead of the course-world finalizePaystackByReference.
 */

export const PAYMENT_LINK_REF_PREFIX = "ppl_";

// ─────────────────────────────────────────────────────────────────────────────
// Allocation
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentLinkAllocationItem = {
  programSlug: string;
  cohortValue: string;
  /** Negotiated share in whole naira. */
  amount: number;
  /** Program list fullPrice, for display. */
  listPrice: number;
  name: string;
};

export function buildPaymentLinkAllocation(
  items: { programSlug: string; cohortValue: string }[],
  amount: number,
):
  | { ok: true; listSum: number; allocations: PaymentLinkAllocationItem[] }
  | { ok: false; error: string } {
  if (!Number.isInteger(amount) || amount < 500) {
    return { ok: false, error: "Amount must be a whole-naira value of at least ₦500" };
  }

  const resolved: {
    def: NonNullable<ReturnType<typeof getProgramBySlug>>;
    item: { programSlug: string; cohortValue: string };
  }[] = [];

  for (const item of items) {
    const def = getProgramBySlug(item.programSlug);
    if (!def) {
      return { ok: false, error: `Unknown program: ${item.programSlug}` };
    }
    const cohortParts = parseCohortValue(item.cohortValue);
    if (!cohortParts) {
      return { ok: false, error: "Invalid cohort selection" };
    }
    const cohortOption = getAvailableCohorts().find(
      (c) => c.value === item.cohortValue,
    );
    if (!cohortOption) {
      return { ok: false, error: "Selected cohort is no longer available" };
    }
    resolved.push({ def, item });
  }

  if (new Set(items.map((i) => i.programSlug)).size !== items.length) {
    return { ok: false, error: "Each program can only appear once on a link" };
  }

  const listPrices = resolved.map((r) => r.def.fullPrice);
  const listSum = listPrices.reduce((sum, p) => sum + p, 0);

  if (amount > listSum) {
    return {
      ok: false,
      error: `Negotiated amount (₦${amount.toLocaleString()}) exceeds the combined list price (₦${listSum.toLocaleString()})`,
    };
  }

  const shares = allocateAmountWholeNaira(amount, listPrices);

  return {
    ok: true,
    listSum,
    allocations: resolved.map((r, i) => ({
      programSlug: r.item.programSlug,
      cohortValue: r.item.cohortValue,
      amount: shares[i],
      listPrice: r.def.fullPrice,
      name: r.def.name,
    })),
  };
}

/**
 * Resolve programs/cohorts to DB rows, creating them if needed — the same
 * upsert the public enroll form performs. Called at link CREATION so items can
 * hold stable programId/cohortId foreign keys.
 */
export async function ensureProgramsAndCohorts(
  items: { programSlug: string; cohortValue: string }[],
) {
  const available = getAvailableCohorts();
  const out: { programId: string; cohortId: string }[] = [];

  for (const item of items) {
    const def = getProgramBySlug(item.programSlug);
    if (!def) throw new Error(`Unknown program: ${item.programSlug}`);
    const cohortParts = parseCohortValue(item.cohortValue);
    const cohortOption = available.find((c) => c.value === item.cohortValue);
    if (!cohortParts || !cohortOption) {
      throw new Error("Selected cohort is no longer available");
    }

    const program = await db.professionalProgram.upsert({
      where: { slug: def.slug },
      update: {
        fullPrice: def.fullPrice,
        installTotal: def.installTotal,
        firstInstall: def.firstInstall,
        secondInstall: def.secondInstall,
      },
      create: {
        name: def.name,
        slug: def.slug,
        duration: def.duration,
        fullPrice: def.fullPrice,
        installTotal: def.installTotal,
        firstInstall: def.firstInstall,
        secondInstall: def.secondInstall,
        careerOutcomes: def.careerOutcomes,
        curriculum: def.curriculum,
      },
    });

    const cohort = await db.programCohort.upsert({
      where: {
        programId_cycleNumber: {
          programId: program.id,
          cycleNumber: cohortParts.cycleNumber,
        },
      },
      update: {},
      create: {
        programId: program.id,
        cycleNumber: cohortParts.cycleNumber,
        year: cohortParts.year,
        month: cohortParts.month,
        quarterLabel: cohortOption.quarterLabel,
        phoneticLabel: cohortOption.phoneticLabel,
        displayName: formatCohortName(
          cohortParts.cycleNumber,
          cohortParts.year,
          cohortParts.month,
        ),
        startDate: new Date(cohortParts.year, cohortParts.month - 1, 1),
      },
    });

    out.push({ programId: program.id, cohortId: cohort.id });
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public read (pay page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProgramPaymentLinkForPayment(token: string) {
  const link = await db.programPaymentLink.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          program: { select: { name: true, fullPrice: true } },
          cohort: { select: { displayName: true, startDate: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!link) return { ok: false as const, error: "not_found" };

  // Expiry is enforced lazily: an ACTIVE link past its date renders as expired.
  const effectiveStatus =
    link.status === "ACTIVE" && link.expiresAt && link.expiresAt < new Date()
      ? ("EXPIRED" as const)
      : link.status;

  return {
    ok: true as const,
    link: {
      studentName: link.studentName,
      email: link.email,
      amount: link.amount,
      currency: link.currency,
      status: effectiveStatus,
      expiresAt: link.expiresAt,
      paidAt: link.paidAt,
      items: link.items.map((item: any) => ({
        programName: item.program.name,
        cohortName: item.cohort.displayName,
        listPrice: item.program.fullPrice,
        amount: item.amount,
      })),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout begin
// ─────────────────────────────────────────────────────────────────────────────

export async function beginProgramPaymentLinkPayment(token: string) {
  const link = await db.programPaymentLink.findUnique({
    where: { token },
    include: {
      items: { include: { program: true, cohort: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!link) return { ok: false as const, error: "Payment link not found" };
  if (link.status === "PAID") return { ok: false as const, error: "already_paid" };
  if (link.status === "CANCELLED") {
    return { ok: false as const, error: "This link is no longer available" };
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { ok: false as const, error: "This link has expired" };
  }

  // Retry guard: reuse the stored Paystack checkout so a double click (or a
  // refreshed page) never creates a second set of enrollments.
  if (link.paystackRef && link.authUrl) {
    return {
      ok: true as const,
      authorizationUrl: link.authUrl,
      reference: link.paystackRef,
    };
  }

  if (link.items.length === 0) {
    return { ok: false as const, error: "This link has no programs" };
  }

  for (const item of link.items) {
    if (!item.cohort.isOpen || item.cohort.seatsTaken >= item.cohort.seatLimit) {
      return {
        ok: false as const,
        error: `The ${item.program.name} cohort is full. Please contact us to arrange another intake.`,
      };
    }
  }

  const reference = `${PAYMENT_LINK_REF_PREFIX}${randomUUID()}`;

  try {
    // Idempotent per item: an enrollment created by an interrupted earlier
    // attempt is reused, never duplicated.
    for (const item of link.items) {
      const existing = await db.programEnrollment.findFirst({
        where: { paymentLinkId: link.id, programId: item.programId },
      });

      if (existing) {
        await db.programEnrollment.update({
          where: { id: existing.id },
          data: {
            email: link.email,
            fullName: link.studentName,
            learningMode: link.learningMode,
          },
        });
        continue;
      }

      const enrollment = await db.programEnrollment.create({
        data: {
          fullName: link.studentName,
          email: link.email,
          phone: link.phone ?? "",
          learningMode: link.learningMode,
          paymentPlan: "FULL_PAYMENT",
          totalAmount: item.amount,
          negotiatedAmount: item.amount,
          status: "PENDING_PAYMENT",
          notes: link.note,
          programId: item.programId,
          cohortId: item.cohortId,
          paymentLinkId: link.id,
        },
      });

      // The unique paystackRef constraint belongs to the charge, which the
      // LINK carries; installments stay ref-less and are claimed by enrollment.
      await db.installmentPayment.create({
        data: {
          enrollmentId: enrollment.id,
          installmentNo: 1,
          amount: item.amount,
          dueDate: new Date(),
          status: "PENDING",
        },
      });
    }

    await db.programPaymentLink.update({
      where: { id: link.id },
      data: { paystackRef: reference },
    });

    const init = await paystackInitialize({
      email: link.email,
      amountKobo: Math.round(link.amount * 100),
      reference,
      callback_url: `${SITE_URL}/pay/${token}/verify?reference=${reference}`,
      metadata: {
        paymentLinkId: link.id,
        token,
        custom_fields: [
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: link.studentName,
          },
          {
            display_name: "Programs",
            variable_name: "programs",
            value: link.items.map((i: any) => i.program.name).join(" + "),
          },
        ],
      },
    });

    await db.programPaymentLink.update({
      where: { id: link.id },
      data: { authUrl: init.authorization_url },
    });

    trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_STARTED, {
      entityType: "program",
      entityId: link.id,
      metadata: {
        source: "admin_payment_link",
        programs: link.items.map((i: any) => i.program.slug),
        amount: link.amount,
      },
      value: link.amount,
    });

    return { ok: true as const, authorizationUrl: init.authorization_url, reference };
  } catch (err: any) {
    // Roll back anything this attempt created, mirroring submitEnrollment.
    await db.installmentPayment.deleteMany({
      where: { enrollment: { paymentLinkId: link.id } },
    });
    await db.programEnrollment.deleteMany({
      where: { paymentLinkId: link.id },
    });
    await db.programPaymentLink.update({
      where: { id: link.id },
      data: { paystackRef: null, authUrl: null },
    });
    return {
      ok: false as const,
      error: err?.message || "Payment initialization failed. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement (return page + webhook)
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyProgramPaymentLinkPayment(reference: string) {
  const link = await db.programPaymentLink.findUnique({
    where: { paystackRef: reference },
    include: {
      items: {
        include: { program: true, cohort: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!link) return { ok: false as const, reason: "link_not_found" };

  // Already settled (the Paystack webhook usually wins this race before the
  // browser's return page calls in). Return the SAME payload as a fresh
  // settlement: the caller renders the confirmation from it instead of
  // retrying — an idempotent verify must be displayable, not just acknowledged.
  // (verifyEnrollmentPayment sets the same precedent by returning the
  // enrollment on its alreadyVerified path.)
  if (link.status === "PAID") {
    const enrollments = await db.programEnrollment.findMany({
      where: { paymentLinkId: link.id },
      include: { program: true, cohort: true },
      orderBy: { createdAt: "asc" },
    });
    if (enrollments.length === 0) {
      return { ok: false as const, reason: "no_enrollments" };
    }
    return settledResult(link.studentName, enrollments, true);
  }

  const verification = await paystackVerify(reference);

  if (verification.status !== "success") {
    // The charge did not land — release the checkout so the client can retry.
    await db.programPaymentLink
      .update({
        where: { id: link.id },
        data: { paystackRef: null, authUrl: null },
      })
      .catch(() => {});
    return { ok: false as const, reason: "failed" };
  }

  if (verification.amount !== Math.round(link.amount * 100)) {
    console.error(
      `[payment-link] amount mismatch for ${reference}: expected ${Math.round(link.amount * 100)}, got ${verification.amount}`,
    );
    return { ok: false as const, reason: "amount_mismatch" };
  }

  // ── Claim and settle every program in one transaction ──
  const settlement = await db.$transaction(
    async (px: any) => {
      const enrollments = await px.programEnrollment.findMany({
        where: { paymentLinkId: link.id },
      });

      // Money arrived without checkout-side enrollments — do NOT mark the
      // link PAID and deliver nothing. Leave it ACTIVE so the mismatch is
      // visible and a retry can succeed after the records are fixed.
      if (enrollments.length === 0) return { missingEnrollments: true as const };

      const claimed = await px.programPaymentLink.updateMany({
        where: { id: link.id, status: "ACTIVE" },
        data: { status: "PAID", paidAt: new Date(verification.paid_at) },
      });
      if (claimed.count === 0) return { alreadySettled: true as const };

      const settled: { enrollmentId: string; installmentId: string }[] = [];

      for (const enrollment of enrollments) {
        const installment = await px.installmentPayment.findFirst({
          where: { enrollmentId: enrollment.id, status: { not: "PAID" } },
        });

        if (installment) {
          await px.installmentPayment.update({
            where: { id: installment.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
              transactionData: verification as any,
            },
          });
          settled.push({ enrollmentId: enrollment.id, installmentId: installment.id });
        }

        await px.programEnrollment.update({
          where: { id: enrollment.id },
          data: {
            amountPaid: enrollment.totalAmount,
            status: "FULLY_PAID",
          },
        });

        if (enrollment.status === "PENDING_PAYMENT") {
          await px.programCohort.update({
            where: { id: enrollment.cohortId },
            data: { seatsTaken: { increment: 1 } },
          });
        }
      }

      return { alreadySettled: false as const, settled };
    },
    { timeout: 30_000, maxWait: 15_000 },
  );

  if ("missingEnrollments" in settlement) {
    return { ok: false as const, reason: "no_enrollments" };
  }

  if (settlement.alreadySettled) {
    // Another caller (webhook or a parallel return-page request) settled this
    // while we were verifying. Same contract as the early PAID branch: hand
    // back the display payload, never a bare acknowledgement.
    const enrollments = await db.programEnrollment.findMany({
      where: { paymentLinkId: link.id },
      include: { program: true, cohort: true },
      orderBy: { createdAt: "asc" },
    });
    if (enrollments.length === 0) {
      return { ok: false as const, reason: "no_enrollments" };
    }
    return settledResult(link.studentName, enrollments, true);
  }

  // ── Accrue the lead instructor's 25% per program ──
  // Non-fatal, mirroring verifyEnrollmentPayment: if the cohort has no
  // instructor yet, assignment back-fills the accrual.
  for (const { installmentId } of settlement.settled) {
    try {
      await accrueProgramEarning(installmentId);
    } catch (error) {
      console.error("[payment-link] accrual failed", error);
    }
  }

  // ── Provision one account for all programs on this link ──
  const enrollments = await db.programEnrollment.findMany({
    where: { paymentLinkId: link.id },
    include: { program: true, cohort: true },
    orderBy: { createdAt: "asc" },
  });

  const first = enrollments[0];
  if (!first) {
    // Unreachable: the settlement transaction guards on enrollments existing.
    return { ok: false as const, reason: "no_enrollments" };
  }
  let accountInfo: Awaited<ReturnType<typeof provisionUserAccount>> | null = null;
  try {
    accountInfo = await provisionUserAccount({
      id: first.id,
      email: link.email,
      fullName: link.studentName,
      phone: link.phone,
    });
    for (const enrollment of enrollments.slice(1)) {
      await db.programEnrollment.update({
        where: { id: enrollment.id },
        data: { userId: accountInfo.userId },
      });
    }
  } catch (err) {
    console.error("[payment-link] account provisioning failed:", err);
  }

  // ── Notifications, receipts and analytics, per program ──
  for (const [index, enrollment] of enrollments.entries()) {
    const status = "FULLY_PAID";
    const isFirst = index === 0;

    trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_PAID, {
      userId: accountInfo?.userId || undefined,
      entityType: "program",
      entityId: enrollment.id,
      metadata: {
        source: "admin_payment_link",
        programName: enrollment.program.name,
        status,
      },
      value: enrollment.amountPaid,
    });

    sendCRMPurchaseEvent(
      {
        email: enrollment.email,
        phone: enrollment.phone ?? undefined,
        firstName: enrollment.fullName?.split(" ")[0],
        lastName: enrollment.fullName?.split(" ").slice(1).join(" ") || undefined,
        externalId: enrollment.id,
      },
      {
        currency: "NGN",
        value: enrollment.amountPaid,
        contentName: enrollment.program.name,
      },
    ).catch(() => {});

    // Credentials travel in the first program's email only.
    sendEnrollmentConfirmation({
      email: enrollment.email,
      fullName: enrollment.fullName,
      programName: enrollment.program.name,
      cohortName: enrollment.cohort.displayName,
      learningMode: enrollment.learningMode,
      paymentPlan: enrollment.paymentPlan,
      amountPaid: enrollment.amountPaid,
      totalAmount: enrollment.totalAmount,
      status,
      isNewAccount: isFirst ? (accountInfo?.isNew ?? false) : false,
      tempPassword: isFirst ? accountInfo?.tempPassword : undefined,
      resetLink: isFirst ? accountInfo?.resetLink : undefined,
      loginUrl: `${SITE_URL}/login`,
    }).catch((err) =>
      console.error("[payment-link] confirmation email failed:", err),
    );

    await sendReceipt(
      buildInstallmentReceipt({
        email: enrollment.email,
        name: enrollment.fullName,
        programName: enrollment.program.name,
        cohortName: enrollment.cohort.displayName,
        installmentNo: 1,
        planLabel: "Full payment (negotiated)",
        installmentAmount: enrollment.totalAmount,
        paidToDate: enrollment.amountPaid,
        programTotal: enrollment.totalAmount,
        reference,
        verification,
      }),
    );

    sendAdminEnrollmentNotification({
      fullName: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone,
      programName: enrollment.program.name,
      cohortName: enrollment.cohort.displayName,
      learningMode: enrollment.learningMode,
      paymentPlan: enrollment.paymentPlan,
      amountPaid: enrollment.amountPaid,
      totalAmount: enrollment.totalAmount,
      status,
      isNewAccount: accountInfo?.isNew ?? false,
    }).catch((err) =>
      console.error("[payment-link] admin notification failed:", err),
    );
  }

  return settledResult(link.studentName, enrollments, false);
}

/** Success payload for every settlement path — idempotent or fresh. */
function settledResult(
  studentName: string,
  enrollments: any[],
  alreadyDone: boolean,
) {
  return {
    ok: true as const,
    alreadyDone,
    studentName,
    items: enrollments.map((enrollment: any) => ({
      programName: enrollment.program.name,
      cohortName: enrollment.cohort.displayName,
      amount: enrollment.totalAmount,
    })),
  };
}
