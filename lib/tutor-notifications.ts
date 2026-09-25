import "server-only";

import { db } from "@/lib/db";
import {
  sendCourseApprovedEmail,
  sendTutorCourseSaleEmail,
  sendTutorGroupPurchaseEmail,
} from "@/lib/mail";
import { notify } from "@/lib/notify";
import { SITE_URL, coursePath } from "@/lib/site";
import { allowsEmail } from "@/lib/user-preferences";
import type { PrismaClient } from "@prisma/client";

/**
 * Tutor notifications: a course being approved (first time, or after an edit),
 * a course being bought, and a group purchase starting and completing.
 *
 * Rules this module exists to hold, in the same spirit as the exam-center
 * notifications:
 *
 *   1. Sending NEVER breaks what triggered it. Approving a course or settling
 *      a payment must succeed even if Resend is down, so nothing here throws.
 *   2. The in-app notice does not depend on the email. A tutor who has turned
 *      email off, or whose email bounced, still finds out on the platform.
 *   3. A tutor's own settings are honoured. The toggles under Profile ->
 *      Notifications were previously read by nothing at all.
 *   4. Nobody is told twice. Approvals are claimed atomically on the course
 *      row; sale and group notices are sent only by the caller that won the
 *      conditional claim on the payment or the group.
 */

const prisma = db as PrismaClient;

const naira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export type ApprovalKind = "first" | "later" | "updated";

export type ApprovalReport =
  | { sent: true; emailed: boolean; kind: ApprovalKind; reason?: string }
  | { sent: false; reason: string };

type ApprovalCourse = {
  id: string;
  title: string;
  slug: string | null;
  tutor: {
    userId: string;
    user: {
      email: string | null;
      name: string | null;
      preferences: unknown;
    } | null;
  };
};

/**
 * Tell the tutor, in-app and (if they allow it) by email.
 *
 * `release` hands the caller's claim back if the email fails, so the next
 * approval can try again rather than the tutor being marked as told when they
 * never received anything.
 */
async function announceApproval(
  course: ApprovalCourse,
  kind: ApprovalKind,
  release: () => Promise<unknown>,
): Promise<ApprovalReport> {
  const courseUrl = `${SITE_URL}${coursePath(course)}`;

  // In-app first and unconditionally: it is the channel that still works when
  // email is switched off, bounces, or the provider is down.
  await notify
    .user(course.tutor.userId, {
      type: "success",
      title:
        kind === "first"
          ? "Congratulations — your first course is live! 🎉"
          : kind === "updated"
            ? "Your changes are now live"
            : "Your course is live",
      message:
        kind === "updated"
          ? `Your changes to "${course.title}" have been approved and the course is live again.`
          : `"${course.title}" has been approved and is now live. Share the link to start bringing students in.`,
      actionUrl: coursePath(course),
      actionLabel: "View Course",
      metadata: {
        category: kind === "updated" ? "course_reapproved" : "course_approved",
        courseId: course.id,
      },
    })
    .catch((error: unknown) =>
      console.error(
        "[tutor-notifications] in-app approval notice failed:",
        error,
      ),
    );

  const user = course.tutor.user;
  if (!user?.email) {
    return { sent: true, emailed: false, kind, reason: "no_email" };
  }
  if (!allowsEmail(user.preferences)) {
    return {
      sent: true,
      emailed: false,
      kind,
      reason: "email_disabled_by_tutor",
    };
  }

  const result = await sendCourseApprovedEmail({
    email: user.email,
    name: user.name ?? undefined,
    courseTitle: course.title,
    courseUrl,
    dashboardUrl: `${SITE_URL}/tutor`,
    kind,
  });

  if ("error" in result) {
    await release().catch(() => undefined);
    return {
      sent: true,
      emailed: false,
      kind,
      reason: `email_failed: ${result.error}`,
    };
  }

  return { sent: true, emailed: true, kind };
}

/**
 * Tell a tutor their course was approved.
 *
 * Three situations, told apart by two columns on the course:
 *
 *   reapprovalPendingSince set     -> an edit to a live course, now approved.
 *                                     "Your changes are live." Once per edit
 *                                     cycle: the marker is cleared as the claim.
 *   else approvalNotifiedAt set    -> already announced; a plain re-publish
 *                                     (an admin unpublishing and republishing,
 *                                     say) stays silent.
 *   else                           -> never announced: the first approval of
 *                                     this course, "first" or "later"
 *                                     depending on the tutor's history.
 *
 * Safe to call from every place that can publish a course, and safe to call
 * repeatedly: each situation is claimed with a conditional update, so a
 * double-click on "Publish", two admins acting together, or a course flipping
 * back and forth produce exactly one email per approval.
 */
export async function notifyCourseApproved(
  courseId: string,
): Promise<ApprovalReport> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        approvalNotifiedAt: true,
        reapprovalPendingSince: true,
        tutor: {
          select: {
            id: true,
            userId: true,
            user: { select: { email: true, name: true, preferences: true } },
          },
        },
      },
    });

    if (!course) return { sent: false, reason: "course_not_found" };
    // Only announce a course that is actually live. Callers invoke this right
    // after publishing, but a stale call must never congratulate a draft.
    if (course.status !== "PUBLISHED") {
      return { sent: false, reason: "not_published" };
    }

    // ---- Re-approval of an edit ------------------------------------------
    const pendingSince = course.reapprovalPendingSince;
    if (pendingSince) {
      // Claim by clearing the marker, guarded on the value we read, so of two
      // simultaneous approvals exactly one matches. A course that predates this
      // feature has no approvalNotifiedAt; it has plainly been approved before
      // (it was live to be edited), so stamp it — that keeps a later "first
      // course" check from ever treating it as a newcomer.
      const claim = await prisma.course.updateMany({
        where: {
          id: courseId,
          status: "PUBLISHED",
          reapprovalPendingSince: pendingSince,
        },
        data: {
          reapprovalPendingSince: null,
          ...(course.approvalNotifiedAt
            ? {}
            : { approvalNotifiedAt: new Date() }),
        },
      });
      if (claim.count === 0) return { sent: false, reason: "already_notified" };

      return announceApproval(course, "updated", () =>
        // Only restores it if nothing has re-set it since (a fresh edit would
        // have written a newer value, and that must not be overwritten).
        prisma.course.updateMany({
          where: { id: courseId, reapprovalPendingSince: null },
          data: { reapprovalPendingSince: pendingSince },
        }),
      );
    }

    // ---- Already announced, nothing pending -------------------------------
    if (course.approvalNotifiedAt) {
      return { sent: false, reason: "already_notified" };
    }

    // ---- First approval of this course ------------------------------------
    // Claim before sending. A read-then-write here would let two simultaneous
    // approvals both see "not yet notified" and both send.
    const claimedAt = new Date();
    const claim = await prisma.course.updateMany({
      where: {
        id: courseId,
        approvalNotifiedAt: null,
        reapprovalPendingSince: null,
        status: "PUBLISHED",
      },
      data: { approvalNotifiedAt: claimedAt },
    });
    if (claim.count === 0) return { sent: false, reason: "already_notified" };

    // "First" means the tutor has nothing else that has been through this
    // before: no other course that was announced, is live now, or has ever
    // sold. Courses that predate this feature have no approvalNotifiedAt, so
    // the last two conditions are what stop a long-standing tutor being
    // congratulated on their "first" course the day this ships.
    const otherApproved = await prisma.course.count({
      where: {
        tutorId: course.tutor.id,
        id: { not: courseId },
        OR: [
          { approvalNotifiedAt: { not: null } },
          { status: "PUBLISHED" },
          { enrollments: { some: {} } },
        ],
      },
    });

    return announceApproval(
      course,
      otherApproved === 0 ? "first" : "later",
      () =>
        // Guarded on our own timestamp so it cannot release someone else's.
        prisma.course.updateMany({
          where: { id: courseId, approvalNotifiedAt: claimedAt },
          data: { approvalNotifiedAt: null },
        }),
    );
  } catch (error) {
    console.error("[tutor-notifications] notifyCourseApproved failed:", error);
    return { sent: false, reason: "error" };
  }
}

/**
 * Email each tutor whose course was just bought.
 *
 * Called once per settled payment, after the in-app notice, with the tutors
 * and course titles the caller has already resolved. The amount is read from
 * the TutorEarning rows written for this transaction rather than recomputed,
 * so the email cannot disagree with what was actually credited.
 *
 * NOT idempotent by itself: the caller must invoke it only for the request
 * that settled the payment. finalizePaystackByReference guarantees that with
 * its conditional claim on the transaction row.
 */
export async function emailTutorsAboutSale(
  transactionId: string,
  coursesByTutor: Map<string, string[]>,
): Promise<void> {
  try {
    const tutorIds = [...coursesByTutor.keys()];
    if (tutorIds.length === 0) return;

    const [earnings, users] = await Promise.all([
      prisma.tutorEarning.findMany({
        where: { transactionId, tutorId: { in: tutorIds } },
        select: { tutorId: true, amount: true },
      }),
      prisma.user.findMany({
        where: { id: { in: tutorIds } },
        select: { id: true, email: true, name: true, preferences: true },
      }),
    ]);

    const earnedByTutor = new Map<string, number>();
    for (const earning of earnings) {
      earnedByTutor.set(
        earning.tutorId,
        (earnedByTutor.get(earning.tutorId) ?? 0) + earning.amount,
      );
    }

    for (const user of users) {
      const titles = coursesByTutor.get(user.id) ?? [];
      const earned = earnedByTutor.get(user.id) ?? 0;

      if (!user.email || titles.length === 0) continue;
      // "New Student Enrollments" in the tutor's notification settings. Its
      // stored key is the misleadingly named `courseReminders`.
      if (!allowsEmail(user.preferences, "courseReminders")) continue;
      // Nothing was credited (a fully discounted sale, say), so there is no
      // earning to announce.
      if (earned <= 0) continue;

      const result = await sendTutorCourseSaleEmail({
        email: user.email,
        name: user.name ?? undefined,
        courseTitles: titles,
        earned,
        walletUrl: `${SITE_URL}/tutor/wallet`,
      });
      if ("error" in result) {
        console.error(
          `[tutor-notifications] sale email to ${user.id} failed:`,
          result.error,
        );
      }
    }
  } catch (error) {
    console.error("[tutor-notifications] emailTutorsAboutSale failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Group purchases
//
// One student pays for the group; the tutor is credited at that moment. When
// the last seat fills, the group's cashback is DEBITED from the tutor's wallet
// and paid to the student who started it. Until now the tutor was told about
// neither, so their balance rose and then fell with no explanation — and a
// tutor who had withdrawn in between could leave the group unable to complete.
// ---------------------------------------------------------------------------

async function loadGroupForTutor(groupPurchaseId: string) {
  return prisma.groupPurchase.findUnique({
    where: { id: groupPurchaseId },
    select: {
      id: true,
      memberLimit: true,
      memberCount: true,
      cashbackTotal: true,
      course: {
        select: {
          title: true,
          tutor: {
            select: {
              userId: true,
              user: { select: { email: true, name: true, preferences: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * The creator has paid and the group is open. Called once, by the caller that
 * settled the payment (see finalizePaystackByReference).
 */
export async function notifyTutorOfGroupStart(params: {
  transactionId: string;
  groupPurchaseId: string;
}): Promise<void> {
  try {
    const group = await loadGroupForTutor(params.groupPurchaseId);
    const tutor = group?.course.tutor;
    if (!group || !tutor) return;

    const earnings = await prisma.tutorEarning.findMany({
      where: { transactionId: params.transactionId, tutorId: tutor.userId },
      select: { amount: true },
    });
    const earned = earnings.reduce((sum, e) => sum + e.amount, 0);

    await notify
      .user(tutor.userId, {
        type: "payment",
        title: "Group Purchase Started",
        message:
          `A group purchase for "${group.course.title}" has started` +
          (earned > 0 ? ` and ${naira(earned)} was added to your wallet.` : ".") +
          (group.cashbackTotal > 0
            ? ` If all ${group.memberLimit} seats fill, ${naira(group.cashbackTotal)} cashback is funded from your wallet.`
            : ""),
        actionUrl: "/tutor/wallet",
        actionLabel: "View Wallet",
        metadata: {
          category: "group_purchase_started_tutor",
          groupPurchaseId: group.id,
        },
      })
      .catch((error: unknown) =>
        console.error("[tutor-notifications] group start notice failed:", error),
      );

    // A group purchase is a sale, so it follows the same settings as one.
    if (
      !tutor.user?.email ||
      earned <= 0 ||
      !allowsEmail(tutor.user.preferences, "courseReminders")
    ) {
      return;
    }

    const result = await sendTutorGroupPurchaseEmail({
      email: tutor.user.email,
      name: tutor.user.name ?? undefined,
      variant: "STARTED",
      courseTitle: group.course.title,
      memberLimit: group.memberLimit,
      earned,
      cashbackTotal: group.cashbackTotal,
      walletUrl: `${SITE_URL}/tutor/wallet`,
    });
    if ("error" in result) {
      console.error("[tutor-notifications] group start email failed:", result.error);
    }
  } catch (error) {
    console.error("[tutor-notifications] notifyTutorOfGroupStart failed:", error);
  }
}

/**
 * The last seat filled. Called once, by the join that completed the group
 * (see lib/group-purchase/join.ts, which guarantees that with a conditional
 * claim on the group row).
 */
export async function notifyTutorOfGroupCompletion(
  groupPurchaseId: string,
): Promise<void> {
  try {
    const group = await loadGroupForTutor(groupPurchaseId);
    const tutor = group?.course.tutor;
    if (!group || !tutor) return;

    const debited = group.cashbackTotal > 0;

    await notify
      .user(tutor.userId, {
        type: debited ? "warning" : "success",
        title: "Group Complete",
        message:
          `Your group for "${group.course.title}" is complete — ${group.memberCount} students now have access.` +
          (debited
            ? ` ${naira(group.cashbackTotal)} cashback was deducted from your wallet and paid to the student who started the group.`
            : ""),
        actionUrl: "/tutor/wallet",
        actionLabel: "View Wallet",
        metadata: {
          category: "group_purchase_completed_tutor",
          groupPurchaseId: group.id,
        },
      })
      .catch((error: unknown) =>
        console.error(
          "[tutor-notifications] group completion notice failed:",
          error,
        ),
      );

    if (!tutor.user?.email) return;
    // A deduction from the wallet is a financial notice, so it follows only the
    // master email switch. A completion with no money movement is an enrolment
    // notice and follows "New Student Enrollments" like any other sale.
    const wanted = debited
      ? allowsEmail(tutor.user.preferences)
      : allowsEmail(tutor.user.preferences, "courseReminders");
    if (!wanted) return;

    const result = await sendTutorGroupPurchaseEmail({
      email: tutor.user.email,
      name: tutor.user.name ?? undefined,
      variant: "COMPLETED",
      courseTitle: group.course.title,
      memberLimit: group.memberLimit,
      cashbackTotal: group.cashbackTotal,
      walletUrl: `${SITE_URL}/tutor/wallet`,
    });
    if ("error" in result) {
      console.error(
        "[tutor-notifications] group completion email failed:",
        result.error,
      );
    }
  } catch (error) {
    console.error(
      "[tutor-notifications] notifyTutorOfGroupCompletion failed:",
      error,
    );
  }
}
