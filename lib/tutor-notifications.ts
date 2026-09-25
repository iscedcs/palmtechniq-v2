import "server-only";

import { db } from "@/lib/db";
import { sendCourseApprovedEmail, sendTutorCourseSaleEmail } from "@/lib/mail";
import { notify } from "@/lib/notify";
import { SITE_URL, coursePath } from "@/lib/site";
import { allowsEmail } from "@/lib/user-preferences";
import type { PrismaClient } from "@prisma/client";

/**
 * Tutor notifications: a course being approved, and a course being bought.
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
 *   4. Nobody is told twice. The approval is claimed atomically on the course
 *      row; the sale email is sent only by the caller that settled the payment
 *      (see finalizePaystackByReference).
 */

const prisma = db as PrismaClient;

export type ApprovalReport =
  | { sent: true; emailed: boolean; isFirstCourse: boolean; reason?: string }
  | { sent: false; reason: string };

/**
 * Tell a tutor their course was approved.
 *
 * Safe to call from every place that can publish a course, and safe to call
 * repeatedly: `Course.approvalNotifiedAt` is claimed with a conditional update,
 * so a double-click on "Publish", two admins acting together, or a course that
 * flips back to draft and is approved again all produce exactly one email for
 * the course's first approval.
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
    if (course.approvalNotifiedAt) {
      return { sent: false, reason: "already_notified" };
    }

    // Claim before sending. A read-then-write here would let two simultaneous
    // approvals both see "not yet notified" and both send.
    const claimedAt = new Date();
    const claim = await prisma.course.updateMany({
      where: { id: courseId, approvalNotifiedAt: null, status: "PUBLISHED" },
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
    const isFirstCourse = otherApproved === 0;

    const courseUrl = `${SITE_URL}${coursePath(course)}`;

    // In-app first and unconditionally: it is the channel that still works
    // when email is switched off, bounces, or the provider is down.
    await notify
      .user(course.tutor.userId, {
        type: "success",
        title: isFirstCourse
          ? "Congratulations — your first course is live! 🎉"
          : "Your course is live",
        message: `"${course.title}" has been approved and is now live. Share the link to start bringing students in.`,
        actionUrl: coursePath(course),
        actionLabel: "View Course",
        metadata: { category: "course_approved", courseId },
      })
      .catch((error: unknown) =>
        console.error(
          "[tutor-notifications] in-app approval notice failed:",
          error,
        ),
      );

    const user = course.tutor.user;
    if (!user?.email) {
      return { sent: true, emailed: false, isFirstCourse, reason: "no_email" };
    }
    if (!allowsEmail(user.preferences)) {
      return {
        sent: true,
        emailed: false,
        isFirstCourse,
        reason: "email_disabled_by_tutor",
      };
    }

    const result = await sendCourseApprovedEmail({
      email: user.email,
      name: user.name ?? undefined,
      courseTitle: course.title,
      courseUrl,
      dashboardUrl: `${SITE_URL}/tutor`,
      isFirstCourse,
    });

    if ("error" in result) {
      // Give the claim back so the next approval can try again, rather than
      // marking a tutor as told when they never received anything. Guarded on
      // our own timestamp so it cannot release someone else's claim.
      await prisma.course
        .updateMany({
          where: { id: courseId, approvalNotifiedAt: claimedAt },
          data: { approvalNotifiedAt: null },
        })
        .catch(() => undefined);
      return {
        sent: true,
        emailed: false,
        isFirstCourse,
        reason: `email_failed: ${result.error}`,
      };
    }

    return { sent: true, emailed: true, isFirstCourse };
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
