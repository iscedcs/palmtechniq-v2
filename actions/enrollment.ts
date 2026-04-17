"use server";

import { db } from "@/lib/db";
import { randomUUID, randomBytes } from "crypto";
import { paystackInitialize, paystackVerify } from "./paystack";
import {
  enrollmentSchema,
  type EnrollmentFormData,
} from "@/schemas/enrollment";
import { getProgramBySlug } from "@/data/programs";
import {
  sendEnrollmentConfirmation,
  sendAdminEnrollmentNotification,
} from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { generatePasswordResetToken } from "@/lib/token";
import {
  parseCohortValue,
  formatCohortName,
  getAvailableCohorts,
} from "@/lib/cohort";
import { sendCRMLeadEvent, sendCRMPurchaseEvent } from "@/lib/meta-conversions";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:2026";

/**
 * Generate a secure random temporary password.
 */
function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

/**
 * Provision a user account after successful enrollment payment.
 * - If user already exists, links enrollment to existing user.
 * - If user doesn't exist, creates account with temp credentials.
 * Returns { isNew, userId, tempPassword?, resetToken? }
 */
async function provisionUserAccount(enrollment: {
  id: string;
  email: string;
  fullName: string;
  phone: string;
}) {
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: enrollment.email },
  });

  if (existingUser) {
    // Link enrollment to existing user
    await db.programEnrollment.update({
      where: { id: enrollment.id },
      data: { userId: existingUser.id },
    });
    return { isNew: false, userId: existingUser.id };
  }

  // Create new user with temporary credentials
  const tempPassword = generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const newUser = await db.user.create({
    data: {
      email: enrollment.email,
      name: enrollment.fullName,
      phone: enrollment.phone,
      password: hashedPassword,
      role: "USER",
      emailVerified: new Date(), // Auto-verified since they paid
      isVerified: true,
    },
  });

  // Create student profile
  await db.student.create({
    data: { userId: newUser.id },
  });

  // Link enrollment to new user
  await db.programEnrollment.update({
    where: { id: enrollment.id },
    data: { userId: newUser.id },
  });

  // Generate a password reset token so they can set their own password
  const resetToken = await generatePasswordResetToken(enrollment.email);

  return {
    isNew: true,
    userId: newUser.id,
    tempPassword,
    resetLink: `${SITE_URL}/new-password?token=${resetToken.token}`,
  };
}

/**
 * Submit a program enrollment and redirect to Paystack for the first payment.
 */
export async function submitEnrollment(data: EnrollmentFormData) {
  // ── Validate input ──
  const parsed = enrollmentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid data",
    };
  }

  const form = parsed.data;

  // ── Look up program ──
  const programDef = getProgramBySlug(form.programSlug);
  if (!programDef) {
    return { success: false, error: "Program not found" };
  }

  // ── Parse cohort ──
  const cohortParts = parseCohortValue(form.cohortValue);
  if (!cohortParts) {
    return { success: false, error: "Invalid cohort selection" };
  }

  // Verify cohort is still available
  const available = getAvailableCohorts();
  const cohortValid = available.some((c) => c.value === form.cohortValue);
  if (!cohortValid) {
    return { success: false, error: "Selected cohort is no longer available" };
  }

  // ── Determine amounts ──
  const isInstallment = form.paymentPlan === "INSTALLMENT";
  const totalAmount = isInstallment
    ? programDef.installTotal
    : programDef.fullPrice;
  const firstPaymentAmount = isInstallment
    ? programDef.firstInstall
    : programDef.fullPrice;

  // ── Upsert program in DB ──
  const program = await db.professionalProgram.upsert({
    where: { slug: programDef.slug },
    update: {
      fullPrice: programDef.fullPrice,
      installTotal: programDef.installTotal,
      firstInstall: programDef.firstInstall,
      secondInstall: programDef.secondInstall,
    },
    create: {
      name: programDef.name,
      slug: programDef.slug,
      duration: programDef.duration,
      fullPrice: programDef.fullPrice,
      installTotal: programDef.installTotal,
      firstInstall: programDef.firstInstall,
      secondInstall: programDef.secondInstall,
      careerOutcomes: programDef.careerOutcomes,
      curriculum: programDef.curriculum,
    },
  });

  // ── Upsert cohort in DB ──
  const displayName = formatCohortName(
    cohortParts.cycleNumber,
    cohortParts.year,
    cohortParts.month,
  );

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
      quarterLabel: available.find((c) => c.value === form.cohortValue)!
        .quarterLabel,
      phoneticLabel: available.find((c) => c.value === form.cohortValue)!
        .phoneticLabel,
      displayName,
      startDate: new Date(cohortParts.year, cohortParts.month - 1, 1),
    },
  });

  // ── Check seat availability ──
  if (!cohort.isOpen || cohort.seatsTaken >= cohort.seatLimit) {
    return {
      success: false,
      error: "This cohort is full. Please select another cohort.",
    };
  }

  // ── Create enrollment record ──
  const reference = `enroll_${randomUUID()}`;

  const enrollment = await db.programEnrollment.create({
    data: {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: new Date(form.dateOfBirth),
      highestQualification: form.highestQualification,
      learningMode: form.learningMode,
      paymentPlan: form.paymentPlan,
      totalAmount,
      programId: program.id,
      cohortId: cohort.id,
    },
  });

  // ── Create installment schedule ──
  const now = new Date();
  // 2nd installment due 1 month after cohort start date
  const cohortStart = new Date(cohortParts.year, cohortParts.month - 1, 1);
  const secondInstallmentDue = new Date(cohortStart);
  secondInstallmentDue.setMonth(secondInstallmentDue.getMonth() + 1);

  if (isInstallment) {
    // Two installments: 70% now, 30% one month after classes start
    await db.installmentPayment.createMany({
      data: [
        {
          enrollmentId: enrollment.id,
          installmentNo: 1,
          amount: programDef.firstInstall,
          dueDate: now,
          paystackRef: reference,
        },
        {
          enrollmentId: enrollment.id,
          installmentNo: 2,
          amount: programDef.secondInstall,
          dueDate: secondInstallmentDue,
        },
      ],
    });
  } else {
    // Single full payment
    await db.installmentPayment.create({
      data: {
        enrollmentId: enrollment.id,
        installmentNo: 1,
        amount: programDef.fullPrice,
        dueDate: now,
        paystackRef: reference,
      },
    });
  }

  // ── Initialize Paystack payment ──
  try {
    const paystack = await paystackInitialize({
      email: form.email,
      amountKobo: Math.round(firstPaymentAmount * 100),
      reference,
      callback_url: `${SITE_URL}/enroll/verify?reference=${reference}`,
      metadata: {
        enrollmentId: enrollment.id,
        programSlug: programDef.slug,
        cohort: displayName,
        paymentPlan: form.paymentPlan,
        custom_fields: [
          {
            display_name: "Program",
            variable_name: "program",
            value: programDef.name,
          },
          {
            display_name: "Cohort",
            variable_name: "cohort",
            value: displayName,
          },
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: form.fullName,
          },
        ],
      },
    });

    // Send Lead event to Meta Conversions API (non-blocking)
    sendCRMLeadEvent({
      email: form.email,
      phone: form.phone ?? undefined,
      firstName: form.fullName?.split(" ")[0],
      lastName: form.fullName?.split(" ").slice(1).join(" ") || undefined,
      externalId: enrollment.id,
    }).catch(() => {});

    trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_STARTED, {
      entityType: "program",
      entityId: enrollment.id,
      metadata: { programSlug: programDef.slug, cohort: displayName, paymentPlan: form.paymentPlan },
      value: firstPaymentAmount,
    });

    return {
      success: true,
      authorizationUrl: paystack.authorization_url,
      reference: paystack.reference,
    };
  } catch (err: any) {
    // Roll back enrollment on payment init failure
    await db.installmentPayment.deleteMany({
      where: { enrollmentId: enrollment.id },
    });
    await db.programEnrollment.delete({
      where: { id: enrollment.id },
    });

    return {
      success: false,
      error: err?.message || "Payment initialization failed. Please try again.",
    };
  }
}

/**
 * Verify enrollment payment after Paystack redirect.
 */
export async function verifyEnrollmentPayment(reference: string) {
  if (!reference) {
    return { success: false, error: "No payment reference provided" };
  }

  // ── Find installment by reference ──
  const installment = await db.installmentPayment.findUnique({
    where: { paystackRef: reference },
    include: {
      enrollment: {
        include: {
          program: true,
          cohort: true,
        },
      },
    },
  });

  if (!installment) {
    return { success: false, error: "Payment record not found" };
  }

  if (installment.status === "PAID") {
    return {
      success: true,
      alreadyVerified: true,
      enrollment: installment.enrollment,
    };
  }

  // ── Verify with Paystack ──
  try {
    const verification = await paystackVerify(reference);

    if (verification.status !== "success") {
      return { success: false, error: "Payment was not successful" };
    }

    // ── Mark installment as paid ──
    await db.installmentPayment.update({
      where: { id: installment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        transactionData: verification as any,
      },
    });

    // ── Update enrollment status & amount paid ──
    const enrollment = installment.enrollment;
    const newAmountPaid = enrollment.amountPaid + installment.amount;
    const isFullyPaid = newAmountPaid >= enrollment.totalAmount;

    await db.programEnrollment.update({
      where: { id: enrollment.id },
      data: {
        amountPaid: newAmountPaid,
        status: isFullyPaid ? "FULLY_PAID" : "FIRST_INSTALLMENT_PAID",
      },
    });

    // ── Increment seats taken ──
    if (enrollment.status === "PENDING_PAYMENT") {
      await db.programCohort.update({
        where: { id: enrollment.cohortId },
        data: { seatsTaken: { increment: 1 } },
      });
    }

    const newStatus = isFullyPaid ? "FULLY_PAID" : "FIRST_INSTALLMENT_PAID";

    // Send Purchase event to Meta Conversions API (non-blocking)
    sendCRMPurchaseEvent(
      {
        email: enrollment.email,
        phone: enrollment.phone ?? undefined,
        firstName: enrollment.fullName?.split(" ")[0],
        lastName:
          enrollment.fullName?.split(" ").slice(1).join(" ") || undefined,
        externalId: enrollment.id,
      },
      {
        currency: "NGN",
        value: newAmountPaid,
        contentName: enrollment.program.name,
      },
    ).catch(() => {});

    // ── Provision user account ──
    let accountInfo: Awaited<ReturnType<typeof provisionUserAccount>> | null =
      null;
    try {
      accountInfo = await provisionUserAccount({
        id: enrollment.id,
        email: enrollment.email,
        fullName: enrollment.fullName,
        phone: enrollment.phone,
      });
    } catch (err) {
      console.error(
        "[verifyEnrollmentPayment] Account provisioning failed:",
        err,
      );
    }

    trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_PAID, {
      userId: accountInfo?.userId || undefined,
      entityType: "program",
      entityId: enrollment.id,
      metadata: { programName: enrollment.program.name, status: newStatus, installmentNo: installment.installmentNo },
      value: newAmountPaid,
    });

    // ── Send confirmation email (non-blocking) ──
    sendEnrollmentConfirmation({
      email: enrollment.email,
      fullName: enrollment.fullName,
      programName: enrollment.program.name,
      cohortName: enrollment.cohort.displayName,
      learningMode: enrollment.learningMode,
      paymentPlan: enrollment.paymentPlan,
      amountPaid: newAmountPaid,
      totalAmount: enrollment.totalAmount,
      status: newStatus,
      // Account credentials (only for new users)
      isNewAccount: accountInfo?.isNew ?? false,
      tempPassword: accountInfo?.isNew ? accountInfo.tempPassword : undefined,
      resetLink: accountInfo?.isNew ? accountInfo.resetLink : undefined,
      loginUrl: `${SITE_URL}/login`,
    }).catch((err) =>
      console.error("[verifyEnrollmentPayment] Email send failed:", err),
    );

    // ── Notify admin (non-blocking) ──
    sendAdminEnrollmentNotification({
      fullName: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone,
      programName: enrollment.program.name,
      cohortName: enrollment.cohort.displayName,
      learningMode: enrollment.learningMode,
      paymentPlan: enrollment.paymentPlan,
      amountPaid: newAmountPaid,
      totalAmount: enrollment.totalAmount,
      status: newStatus,
      isNewAccount: accountInfo?.isNew ?? false,
    }).catch((err) =>
      console.error(
        "[verifyEnrollmentPayment] Admin notification failed:",
        err,
      ),
    );

    return {
      success: true,
      alreadyVerified: false,
      enrollment: {
        ...enrollment,
        amountPaid: newAmountPaid,
        status: newStatus,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Payment verification failed",
    };
  }
}
