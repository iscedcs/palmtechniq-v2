"use server";

import { db } from "@/lib/db";
import { accrueProgramEarning } from "@/actions/program-earnings";
import type { InstallmentPayment, ProgramEnrollment } from "@prisma/client";
import { auth } from "@/auth";
import { paystackInitialize, paystackVerify } from "./paystack";
import { randomUUID } from "crypto";
import {
  sendBalancePaymentConfirmation,
  sendAdminBalancePaymentNotification,
} from "@/lib/mail";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:2026";

/**
 * Initiate balance payment for a program enrollment's second installment.
 * Called when a student clicks "Pay Remaining Balance" button.
 */
export async function initiateBalancePayment(enrollmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch enrollment with related data
    const enrollment = await db.programEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        program: true,
        installments: true,
        user: true,
      },
    });

    if (!enrollment) {
      return { success: false, error: "Enrollment not found" };
    }

    // Verify user owns this enrollment
    if (
      enrollment.userId !== session.user.id &&
      enrollment.email !== session.user.email
    ) {
      return { success: false, error: "Unauthorized" };
    }

    // Find second installment (balance payment)
    const secondInstallment = enrollment.installments.find(
      (i: InstallmentPayment) => i.installmentNo === 2,
    );

    if (!secondInstallment) {
      return { success: false, error: "No balance payment record found" };
    }

    // Check if already paid
    if (secondInstallment.status === "PAID") {
      return {
        success: false,
        error: "This balance has already been paid",
      };
    }

    // Check first installment is paid
    const firstInstallment = enrollment.installments.find(
      (i: InstallmentPayment) => i.installmentNo === 1,
    );

    if (!firstInstallment || firstInstallment.status !== "PAID") {
      return {
        success: false,
        error: "First payment must be completed before paying balance",
      };
    }

    // Generate unique reference
    const reference = `balance_${randomUUID()}`;

    // Initialize Paystack payment
    const paystackRes = await paystackInitialize({
      email: enrollment.email,
      amountKobo: Math.round(secondInstallment.amount * 100),
      reference,
      callback_url: `${SITE_URL}/student/programs?reference=${reference}`,
      metadata: {
        enrollmentId: enrollment.id,
        installmentId: secondInstallment.id,
        installmentNo: 2,
        type: "PROGRAM_BALANCE_PAYMENT",
        programName: enrollment.program.name,
      },
    });

    // Update installment with paystack reference
    await db.installmentPayment.update({
      where: { id: secondInstallment.id },
      data: { paystackRef: reference },
    });

    // Track event without breaking the main payment flow
    try {
      await trackEvent(PLATFORM_EVENTS.PROGRAM_ENROLLMENT_STARTED, {
        userId: session.user.id,
        entityType: "program_enrollment",
        entityId: enrollmentId,
        metadata: {
          installmentNo: secondInstallment.installmentNo,
          paymentType: "PROGRAM_BALANCE",
        },
        value: secondInstallment.amount,
      });
    } catch (eventError) {
      console.error("[initiateBalancePayment] analytics failed", eventError);
    }

    if (!paystackRes?.authorization_url) {
      console.error("[initiateBalancePayment] missing Paystack authorization URL", paystackRes);
      return {
        success: false,
        error: "Paystack did not return an authorization URL",
      };
    }

    return {
      success: true,
      authorizationUrl: paystackRes.authorization_url,
      accessCode: paystackRes.access_code,
      reference,
    };
  } catch (error) {
    console.error("[initiateBalancePayment]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate payment",
    };
  }
}

/**
 * Verify and complete balance payment after successful Paystack transaction.
 * Called from webhook or client after redirect.
 */
export async function verifyAndCompleteBalancePayment(
  reference: string,
  enrollmentId?: string,
) {
  try {
    // Verify with Paystack
    const data = await paystackVerify(reference);

    if (data.status !== "success") {
      return {
        success: false,
        error: `Payment status: ${data.status}`,
      };
    }

    const effectiveEnrollmentId =
      enrollmentId || data.metadata?.enrollmentId || data.metadata?.enrollment_id;

    if (!effectiveEnrollmentId) {
      return { success: false, error: "Enrollment information not available" };
    }

    // Fetch enrollment
    const enrollment = await db.programEnrollment.findUnique({
      where: { id: effectiveEnrollmentId },
      include: { installments: true },
    });

    if (!enrollment) {
      return { success: false, error: "Enrollment not found" };
    }

    // Find second installment
    const secondInstallment = enrollment.installments.find(
      (i: InstallmentPayment) => i.installmentNo === 2,
    );

    if (!secondInstallment) {
      return { success: false, error: "Balance record not found" };
    }

    // Update installment as paid
    const updatedInstallment = await db.installmentPayment.update({
      where: { id: secondInstallment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        transactionData: {
          paystackReference: data.reference,
          authorizationCode: data.authorization?.authorization_code,
          channel: data.channel,
          paidAt: data.paid_at,
          amount: data.amount,
        },
      },
    });

    // Accrue the lead instructor's share of this installment. Non-fatal:
    // if the cohort has no instructor yet, assignment back-fills it.
    try {
      await accrueProgramEarning(secondInstallment.id);
    } catch (error) {
      console.error("[verifyAndCompleteBalancePayment] accrual failed", error);
    }

    // Check if all installments are paid
    const allInstallments = await db.installmentPayment.findMany({
      where: { enrollmentId: enrollment.id },
    });

    const allPaid = allInstallments.every(
      (i: InstallmentPayment) => i.status === "PAID",
    );

    // Update enrollment status and amount paid
    const updatedEnrollment = await db.programEnrollment.update({
      where: { id: enrollment.id },
      data: {
        amountPaid: enrollment.totalAmount, // All paid
        status: allPaid ? "ACTIVE" : "ACTIVE", // Both statuses use ACTIVE for active enrollment
      },
      include: {
        program: true,
        user: true,
      },
    });

    // Send confirmation emails
    await Promise.all([
      sendBalancePaymentConfirmation({
        enrollmentId: enrollment.id,
        programName: enrollment.program.name,
        fullName: enrollment.fullName,
        email: enrollment.email,
        amount: secondInstallment.amount,
        reference: data.reference,
      }),
      sendAdminBalancePaymentNotification({
        enrollmentId: enrollment.id,
        programName: enrollment.program.name,
        studentName: enrollment.fullName,
        studentEmail: enrollment.email,
        amount: secondInstallment.amount,
        reference: data.reference,
      }),
    ]);

    // Track event after payment completion
    await trackEvent(PLATFORM_EVENTS.INSTALLMENT_PAID, {
      userId: updatedEnrollment.userId,
      entityType: "program_enrollment",
      entityId: effectiveEnrollmentId,
      metadata: {
        installmentNo: secondInstallment.installmentNo,
        paymentType: "PROGRAM_BALANCE",
        allInstallmentsPaid: allPaid,
      },
      value: secondInstallment.amount,
    });

    return {
      success: true,
      message: "Balance payment completed successfully",
      enrollmentId: effectiveEnrollmentId,
      allInstallmentsPaid: allPaid,
    };
  } catch (error) {
    console.error("[verifyAndCompleteBalancePayment]", error);
    return { success: false, error: "Failed to complete payment" };
  }
}

/**
 * Get student's program enrollments with balance payment info.
 * Used to display on student dashboard.
 */
export async function getStudentProgramEnrollments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const [enrollments, certificates] = await Promise.all([
      db.programEnrollment.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          program: true,
          cohort: {
            include: {
              leadInstructor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  avatar: true,
                  tutorProfile: { select: { id: true, referralCode: true, title: true } },
                },
              },
            },
          },
          installments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.certificate.findMany({
        where: {
          userId: session.user.id,
          isRevoked: false,
        },
        select: {
          id: true,
          certificateId: true,
          programId: true,
          cohortId: true,
          certificateUrl: true,
          title: true,
          issuedAt: true,
        },
      }),
    ]);

    // Calculate balance info for each enrollment
    const enrollmentsWithBalance = enrollments.map(
      (
        enrollment: any,
      ) => {
        const secondInstallment = enrollment.installments.find(
          (i: InstallmentPayment) => i.installmentNo === 2,
        );
        const firstInstallment = enrollment.installments.find(
          (i: InstallmentPayment) => i.installmentNo === 1,
        );

        const remainingBalance =
          enrollment.totalAmount - enrollment.amountPaid;

        const matchingCert = certificates.find(
          (c: any) =>
            (c.programId && c.programId === enrollment.programId) ||
            (c.cohortId && c.cohortId === enrollment.cohortId),
        );

        const instructor = enrollment.cohort?.leadInstructor;
        const instructorTutorId =
          instructor?.tutorProfile?.referralCode ||
          instructor?.tutorProfile?.id ||
          instructor?.id ||
          null;

      return {
        id: enrollment.id,
        programId: enrollment.programId,
        programName: enrollment.program.name,
        cohortName: enrollment.cohort.displayName,
        totalAmount: enrollment.totalAmount,
        amountPaid: enrollment.amountPaid,
        remainingBalance,
        status: enrollment.status,
        learningMode: enrollment.learningMode,
        paymentPlan: enrollment.paymentPlan,
        
        // Lead Instructor Info
        leadInstructor: instructor
          ? {
              id: instructor.id,
              name: instructor.name || "Lead Instructor",
              title: instructor.tutorProfile?.title || "Lead Instructor",
              avatar: instructor.avatar || instructor.image || null,
              tutorReviewId: instructorTutorId,
            }
          : null,

        // Balance payment specific info
        hasBalancePayment: !!secondInstallment,
        balanceAmount: secondInstallment?.amount || 0,
        balanceDueDate: secondInstallment?.dueDate,
        balancePaid: secondInstallment?.status === "PAID",
        balanceOverdue: secondInstallment?.dueDate
          ? new Date() > secondInstallment.dueDate &&
            secondInstallment.status !== "PAID"
          : false,

        // First installment status
        firstInstallmentPaid: firstInstallment?.status === "PAID",

        // Certificate if issued
        certificate: matchingCert
          ? {
              id: matchingCert.id,
              credentialId: matchingCert.certificateId,
              certificateUrl: matchingCert.certificateUrl || undefined,
              title: matchingCert.title,
              issuedAt: matchingCert.issuedAt,
            }
          : null,

        createdAt: enrollment.createdAt,
      };
    });

    return {
      success: true,
      enrollments: enrollmentsWithBalance,
    };
  } catch (error) {
    console.error("[getStudentProgramEnrollments]", error);
    return {
      success: false,
      error: "Failed to fetch enrollments",
      enrollments: [],
    };
  }
}
