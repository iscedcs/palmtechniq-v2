import { paystackVerify } from "@/actions/paystack";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  computeCheckoutTotals,
  computeMentorshipSplit,
  deriveSplitPercent,
  REVENUE,
} from "@/lib/payments/revenue";
import { createZoomMeeting } from "@/lib/zoom-integration";
import { resolveTutorReferralCode } from "@/lib/referral";
import { sendCRMPurchaseEvent } from "@/lib/meta-conversions";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

export async function finalizePaystackByReference(reference: string) {
  const tx = await db.transaction.findFirst({
    where: { transactionId: reference },
    include: {
      lineItems: true,
      promoCode: true,
    },
  });
  if (!tx) return { ok: false, reason: "tx_not_found" };

  if (tx.status === "COMPLETED")
    return { ok: true, alreadyDone: true, courseId: tx.courseId };

  const v = await paystackVerify(reference);
  if (v.status !== "success") {
    await db.transaction.update({
      where: { id: tx.id },
      data: {
        status: "FAILED",
        metadata: { ...((tx.metadata as any) || {}), verify: v },
      },
    });
    return { ok: false, reason: "failed" };
  }

  if (Math.abs(v.amount - Math.round(tx.amount * 100)) > 0) {
    console.log({ v });
  }

  // Track successful payment verification
  trackEvent(PLATFORM_EVENTS.CHECKOUT_COMPLETED, {
    userId: tx.userId,
    entityType: "transaction",
    entityId: tx.id,
    metadata: { reference, courseId: tx.courseId },
    value: tx.amount,
  });

  await db.$transaction(async (px: any) => {
    await px.transaction.update({
      where: { id: tx.id },
      data: {
        status: "COMPLETED",
        paymentId: v.reference,
        paymentDate: new Date(v.paid_at),
        metadata: { ...((tx.metadata as any) || {}), verify: v },
      },
    });

    const metadata = (v.metadata || tx.metadata || {}) as any;
    const isMentorshipPayment = metadata?.productType === "MENTORSHIP";
    if (isMentorshipPayment) {
      const mentorshipSessionId = metadata?.mentorshipSessionId as
        | string
        | undefined;
      if (mentorshipSessionId) {
        const session = await px.mentorshipSession.findUnique({
          where: { id: mentorshipSessionId },
          include: {
            student: { select: { email: true, name: true } },
            tutor: { select: { email: true, name: true } },
          },
        });

        if (session) {
          let meetingUrl = session.meetingUrl;

          // Create Zoom meeting if not already created
          if (!meetingUrl) {
            try {
              const zoomMeeting = await createZoomMeeting({
                topic: session.title,
                startTime: session.scheduledAt.toISOString(),
                duration: session.duration,
                mentorEmail: session.tutor.email,
                studentEmail: session.student.email,
                description: session.description || undefined,
              });
              meetingUrl = zoomMeeting.joinUrl;

              // Log Zoom creation for troubleshooting
              console.log(
                `[Zoom Meeting Created] Session: ${mentorshipSessionId}, Meeting ID: ${zoomMeeting.meetingId}`,
              );
            } catch (error) {
              // Fallback to manual meeting URL - log error but don't fail the payment
              console.error(
                `[Zoom Meeting Creation Failed] Session: ${mentorshipSessionId}, Error: ${error}`,
              );
              meetingUrl = null; // Will prompt tutor to add manually
            }
          }

          await px.mentorshipSession.update({
            where: { id: mentorshipSessionId },
            data: {
              status: "SCHEDULED",
              meetingUrl: meetingUrl || undefined,
              paymentStatus: "PAID",
              notes: `PAYMENT_CONFIRMED | ${new Date(v.paid_at).toISOString()}`,
            },
          });

          // Emit notifications to both student and tutor
          const tutorShare =
            tx.tutorShareAmount ?? computeMentorshipSplit(tx.amount || 0).tutorShareAmount;

          await notify.user(session.studentId, {
            type: "payment",
            title: "Mentorship Booking Confirmed",
            message: `Your mentorship session "${session.title}" has been paid. The meeting will start at the scheduled time.`,
            actionUrl: `/mentorship/session/${mentorshipSessionId}`,
            actionLabel: "View Session",
          });

          await notify.user(session.tutorId, {
            type: "payment",
            title: "Mentorship Payment Received",
            message: `Payment received for "${session.title}". You've earned ₦${tutorShare.toLocaleString()}.`,
            actionUrl: `/tutor/mentorship`,
            actionLabel: "View Sessions",
          });
        }
      }

      const tutorId = metadata?.tutorUserId as string | undefined;
      const tutorShare =
        tx.tutorShareAmount ?? computeMentorshipSplit(tx.amount || 0).tutorShareAmount;
      if (tutorId && tutorShare > 0) {
        // Record the earning in the same transaction as the wallet credit.
        // Without this the money is spendable but invisible to the ledger, and
        // wallet balance can never be reconciled against TutorEarning.
        const sessionId = metadata?.mentorshipSessionId as string | undefined;
        await px.tutorEarning.create({
          data: {
            tutorId,
            source: "MENTORSHIP",
            amount: tutorShare,
            splitPercent: deriveSplitPercent({
              discountedPrice: tx.amount || 0,
              tutorShareAmount: tutorShare,
            }),
            status: "AVAILABLE",
            transactionId: tx.id,
            mentorshipSessionId: sessionId ?? null,
          },
        });

        await px.user.update({
          where: { id: tutorId },
          data: {
            walletBalance: {
              increment: tutorShare,
            },
          },
        });
      }
      return;
    }

    const groupPurchaseId = metadata.groupPurchaseId ?? tx.groupPurchaseId;

    const isGroupPurchase = Boolean(groupPurchaseId);
    if (isGroupPurchase) {
      await px.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: {
          status: "ACTIVE",
          paidAt: new Date(v.paid_at),
        },
      });
    }

    const courseIds = Array.isArray(metadata.courseIds)
      ? metadata.courseIds
      : tx.courseId
        ? [tx.courseId]
        : [];

    let lineItems = tx.lineItems;
    if (!lineItems || lineItems.length === 0) {
      const courses = await px.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          basePrice: true,
          currentPrice: true,
          price: true,
          tutor: { select: { userId: true } },
        },
      });
      const promo =
        tx.promoCode &&
        tx.promoType &&
        tx.promoDiscountType &&
        tx.promoDiscountValue !== null &&
        tx.promoDiscountValue !== undefined
          ? {
              id: tx.promoCode.id,
              code: tx.promoCode.code,
              promoType: tx.promoType,
              discountType: tx.promoDiscountType,
              discountValue: tx.promoDiscountValue,
              isGlobal: tx.promoCode.isGlobal,
              courseId: tx.promoCode.courseId,
              creatorId: tx.promoCode.creatorId,
            }
          : null;

      // Resolve referral if present on the transaction
      const referralTutorId = tx.referralCode
        ? await resolveTutorReferralCode(tx.referralCode)
        : null;

      const totals = computeCheckoutTotals({
        courses: courses.map((course: any) => ({
          id: course.id,
          tutorId: course.tutor.userId,
          basePrice: course.basePrice,
          currentPrice: course.currentPrice,
          price: course.price,
        })),
        promo,
        vatRate: REVENUE.vatRate,
        referralTutorId,
      });

      await px.transaction.update({
        where: { id: tx.id },
        data: {
          subtotalAmount: totals.subtotalAmount,
          discountAmount: totals.discountAmount,
          vatAmount: totals.vatAmount,
          tutorShareAmount: totals.tutorShareAmount,
          platformShareAmount: totals.platformShareAmount,
        },
      });

      await px.transactionLineItem.createMany({
        data: totals.lineItems.map((item) => ({
          transactionId: tx.id,
          courseId: item.courseId,
          tutorId: item.tutorId,
          basePrice: item.basePrice,
          discountedPrice: item.discountedPrice,
          discountAmount: item.discountAmount,
          vatAmount: item.vatAmount,
          totalAmount: item.totalAmount,
          tutorShareAmount: item.tutorShareAmount,
          platformShareAmount: item.platformShareAmount,
          isReferralPurchase: item.isReferralPurchase,
          promoCodeId: item.promoCodeId ?? undefined,
          promoType: item.promoType,
          promoDiscountType: item.promoDiscountType,
          promoDiscountValue: item.promoDiscountValue ?? undefined,
        })),
      });

      // createMany does not return rows, and the earnings below need the
      // generated line item ids.
      lineItems = await px.transactionLineItem.findMany({
        where: { transactionId: tx.id },
      });
    }

    if (!isGroupPurchase && courseIds.length > 0) {
      // One round-trip instead of one per course. skipDuplicates matches the
      // previous upsert-with-empty-update: create if missing, leave existing
      // enrollments untouched.
      await px.enrollment.createMany({
        data: courseIds.map((courseId: string) => ({
          userId: tx.userId,
          courseId,
          status: "ACTIVE",
          enrolledAt: new Date(),
        })),
        skipDuplicates: true,
      });

      await px.cartItem.deleteMany({
        where: {
          userId: tx.userId,
          courseId: { in: courseIds },
        },
      });
    }

    if (tx.vatAmount && tx.vatAmount > 0) {
      await px.vatLedger.upsert({
        where: { transactionId: tx.id },
        create: {
          transactionId: tx.id,
          amount: tx.vatAmount,
          currency: tx.currency,
        },
        update: {},
      });
    }

    if (tx.promoCodeId) {
      const existingRedemption = await px.promoRedemption.findFirst({
        where: { promoCodeId: tx.promoCodeId, transactionId: tx.id },
        select: { id: true },
      });
      if (!existingRedemption) {
        await px.promoRedemption.create({
          data: {
            promoCodeId: tx.promoCodeId,
            userId: tx.userId,
            transactionId: tx.id,
            courseId: tx.courseId ?? undefined,
          },
        });
      }
    }

    if (lineItems && lineItems.length > 0) {
      // One insert for every earning rather than one per line item. A bundle
      // multiplies these by the number of courses, which is what pushed this
      // transaction past its timeout.
      await px.tutorEarning.createMany({
        data: lineItems.map((item: any) => ({
          tutorId: item.tutorId,
          transactionId: tx.id,
          transactionLineItemId: item.id,
          courseId: item.courseId,
          amount: item.tutorShareAmount,
          // Derived from the amounts that actually moved, not re-decided
          // from the scenario — the ledger cannot disagree with the money.
          splitPercent: deriveSplitPercent(item),
          status: "AVAILABLE",
        })),
      });

      // Credit each tutor once for the whole transaction. Every course in a
      // bundle belongs to the same tutor, so this collapses N updates to one
      // while moving exactly the same total.
      const creditByTutor = new Map<string, number>();
      for (const item of lineItems) {
        creditByTutor.set(
          item.tutorId,
          (creditByTutor.get(item.tutorId) ?? 0) + item.tutorShareAmount,
        );
      }

      for (const [tutorId, amount] of creditByTutor) {
        await px.user.update({
          where: { id: tutorId },
          data: { walletBalance: { increment: amount } },
        });
      }
    }

    if (!isGroupPurchase) {
      const user = await px.user.findUnique({
        where: { id: tx.userId },
        select: { role: true },
      });
      if (user && user.role === "USER") {
        await px.user.update({
          where: { id: tx.userId },
          data: { role: "STUDENT" },
        });
        await px.student.upsert({
          where: { userId: tx.userId },
          update: {},
          create: { userId: tx.userId, interests: [], goals: [] },
        });
      }
    }
  }, {
    // A bundle settles several courses at once, so this does proportionally
    // more work than a single-course sale. The 5s default was not enough and
    // left payments taken but unsettled.
    timeout: 30_000,
    maxWait: 15_000,
  });

  const metadata = (v.metadata || tx.metadata || {}) as any;
  if (metadata?.productType === "MENTORSHIP") {
    await notify.user(tx.userId, {
      type: "success",
      title: "Mentorship Booking Confirmed",
      message: "Payment successful. Your mentorship booking is now confirmed.",
      actionUrl: "/student/mentorship",
      actionLabel: "View Sessions",
      metadata: { category: "mentorship_payment_success", reference },
    });

    if (metadata?.tutorUserId) {
      await notify.user(metadata.tutorUserId, {
        type: "payment",
        title: "New Mentorship Booking",
        message: "A new mentorship session has been paid and scheduled.",
        actionUrl: "/tutor/mentorship",
        actionLabel: "Manage Sessions",
        metadata: { category: "mentorship_booking_paid", reference },
      });
    }
    return { ok: true, mentorshipSessionId: metadata?.mentorshipSessionId };
  }

  const groupPurchaseId = metadata.groupPurchaseId ?? tx.groupPurchaseId;
  if (groupPurchaseId) {
    const groupPurchase = await db.groupPurchase.findUnique({
      where: { id: groupPurchaseId },
      select: { inviteCode: true },
    });

    await notify.user(tx.userId, {
      type: "success",
      title: "Group Purchase Started",
      message:
        "Your group is live. Share your invite link to unlock access faster.",
      actionUrl: groupPurchase?.inviteCode
        ? `/group/${groupPurchase.inviteCode}`
        : "/student",
      actionLabel: "View Group",
      metadata: { category: "group_purchase_started", courseId: tx.courseId },
    });
    return { ok: true, courseId: tx.courseId, groupPurchaseId };
  }

  // A purchase can cover one course or many (cart, bundle). tx.courseId is
  // null for those, so resolve from metadata first — reading it as a single
  // course silently skipped every notification on a bundle sale.
  const purchasedCourseIds: string[] =
    Array.isArray(metadata.courseIds) && metadata.courseIds.length > 0
      ? metadata.courseIds
      : tx.courseId
        ? [tx.courseId]
        : [];

  const purchasedCourses = purchasedCourseIds.length
    ? await db.course.findMany({
        where: { id: { in: purchasedCourseIds } },
        select: {
          id: true,
          title: true,
          tutor: { select: { userId: true } },
        },
      })
    : [];

  const course = purchasedCourses[0] ?? null;
  const isBundle = metadata.type === "bundle";

  // Send Purchase event to Meta Conversions API (non-blocking)
  const buyer = await db.user.findUnique({
    where: { id: tx.userId },
    select: { email: true, name: true, phone: true },
  });
  if (buyer?.email) {
    sendCRMPurchaseEvent(
      {
        email: buyer.email,
        phone: buyer.phone ?? undefined,
        firstName: buyer.name?.split(" ")[0],
        lastName: buyer.name?.split(" ").slice(1).join(" ") || undefined,
        externalId: tx.userId,
      },
      {
        currency: tx.currency ?? "NGN",
        value: tx.amount,
        contentName: course?.title ?? "Course Purchase",
      },
    ).catch(() => {});
  }

  const courseCount = purchasedCourses.length;

  await notify.user(tx.userId, {
    type: "success",
    title: "Payment Successful",
    message:
      courseCount > 1
        ? `Your ${isBundle ? "bundle" : "purchase"} is confirmed — you now have access to all ${courseCount} courses.`
        : "Your enrollment is confirmed. Welcome aboard!",
    actionUrl: "/student/courses",
    actionLabel: "Start Learning",
    metadata: {
      category: "payment_success",
      courseId: tx.courseId,
      courseIds: purchasedCourseIds,
      reference,
    },
  });

  // Notify each course owner once, however many of their courses were bought.
  const coursesByTutor = new Map<string, string[]>();
  for (const purchased of purchasedCourses) {
    const tutorUserId = purchased.tutor?.userId;
    if (!tutorUserId) continue;
    coursesByTutor.set(tutorUserId, [
      ...(coursesByTutor.get(tutorUserId) ?? []),
      purchased.title,
    ]);
  }

  for (const [tutorUserId, titles] of coursesByTutor) {
    await notify.user(tutorUserId, {
      type: "payment",
      title: titles.length > 1 ? "Bundle Purchase" : "Course Purchase",
      message:
        titles.length > 1
          ? `${titles.length} of your courses were purchased together: ${titles.join(", ")}`
          : `Your course ${titles[0]} has been purchased`,
      actionUrl: "/tutor/wallet",
      actionLabel: "View Earnings",
      metadata: {
        category: "payment_received",
        courseId: tx.courseId,
        courseIds: purchasedCourseIds,
      },
    });
  }

  return { ok: true, courseId: tx.courseId, courseIds: purchasedCourseIds };
}
