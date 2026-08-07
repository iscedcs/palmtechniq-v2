import "server-only";

import { db } from "@/lib/db";
import ExamNotification, {
  type ExamEmailVariant,
} from "@/lib/email-templates/exam-notification";
import { notify } from "@/lib/notify";
import type { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

/**
 * Exam Center — student notifications.
 *
 * Three rules this module exists to hold:
 *
 *   1. Sending NEVER breaks the thing that triggered it. Publishing an exam or
 *      releasing results must succeed even if Resend is down, so every send is
 *      wrapped and failures are counted and logged, not thrown.
 *   2. Nobody is mailed twice. Each notice has its own timestamp column on
 *      ExamCandidate, written only after a successful send, so re-publishing, a
 *      roster re-sync, or the reminder sweep running every five minutes cannot
 *      produce duplicates.
 *   3. Recipients are batched. A 200-student cohort is 200 emails, and firing
 *      them one at a time would hit Resend's rate limit and drop the tail.
 */

const defaultClient = db as PrismaClient;

/** Resend's batch endpoint accepts up to 100 messages per call. */
const BATCH_SIZE = 100;
const PAUSE_BETWEEN_BATCHES_MS = 600;

export type NotifyReport = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  reason?: string;
};

type Recipient = {
  candidateId: string;
  userId: string;
  email: string;
  name: string;
};

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

function formatWhen(date: Date | null | undefined, timezone: string): string | null {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  } catch {
    // An invalid stored timezone must not stop the email going out.
    return date.toUTCString();
  }
}

/**
 * Send one batch of exam emails.
 *
 * Returns the candidate ids that were definitely delivered to Resend, so only
 * those get their timestamp written — a candidate whose send failed stays
 * un-notified and is picked up next time rather than being silently skipped.
 */
async function sendEmails(
  recipients: Recipient[],
  subject: (r: Recipient) => string,
  props: (r: Recipient) => Record<string, unknown>,
  variant: ExamEmailVariant,
): Promise<{ delivered: string[]; failed: number }> {
  if (recipients.length === 0) return { delivered: [], failed: 0 };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL_ADDRESS ?? "PalmTechnIQ <support@palmtechniq.com>";

  // Dry run: pretend every message was accepted without contacting Resend. Lets
  // the idempotency rules be exercised in tests and staging without mailing real
  // students, which is the only way to test "nobody is mailed twice" honestly.
  if (process.env.EXAM_NOTIFICATIONS_DRY_RUN === "1") {
    console.log(
      `[exam-notifications] DRY RUN — would send ${recipients.length} ${variant} email(s) to:`,
      recipients.map((r) => r.email).join(", "),
    );
    return { delivered: recipients.map((r) => r.candidateId), failed: 0 };
  }

  if (!apiKey) {
    console.warn("[exam-notifications] RESEND_API_KEY is not set; no email sent.");
    return { delivered: [], failed: 0 };
  }

  const resend = new Resend(apiKey);
  const delivered: string[] = [];
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);

    try {
      const payload = chunk.map((r) => ({
        from,
        to: r.email,
        subject: subject(r),
        react: ExamNotification({
          variant,
          studentName: r.name,
          ...props(r),
        } as never),
      }));

      const result = await resend.batch.send(payload);

      if (result.error) {
        console.error("[exam-notifications] batch rejected:", result.error);
        failed += chunk.length;
      } else {
        delivered.push(...chunk.map((r) => r.candidateId));
      }
    } catch (error) {
      console.error("[exam-notifications] batch threw:", error);
      failed += chunk.length;
    }

    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_BATCHES_MS));
    }
  }

  return { delivered, failed };
}

/** In-app notification. Best-effort — never allowed to fail a send. */
async function notifyInApp(
  userId: string,
  title: string,
  message: string,
  actionUrl: string,
) {
  try {
    await notify.user(userId, {
      type: "info",
      title,
      message,
      actionUrl,
      actionLabel: "View exam",
    });
  } catch (error) {
    console.error("[exam-notifications] in-app notify failed:", error);
  }
}

// ─── Scheduled ───────────────────────────────────────────────────────────────

/**
 * Tell candidates an exam has been scheduled for them.
 *
 * Called after publish, and again after a roster re-sync or a manual addition —
 * `notifiedAt` means only the people who have not already been told get an email.
 */
export async function notifyExamScheduled(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<NotifyReport> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    include: { course: { select: { title: true } } },
  });
  if (!exam) return { attempted: 0, sent: 0, failed: 0, skipped: 0, reason: "Exam not found" };

  const candidates = await client.examCandidate.findMany({
    where: { examId, notifiedAt: null, excludedAt: null },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (candidates.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, skipped: 0, reason: "Everyone has already been told" };
  }

  const recipients: Recipient[] = candidates.map((c) => ({
    candidateId: c.id,
    userId: c.user.id,
    email: c.user.email,
    name: c.user.name,
  }));

  const questionCount = await client.examQuestion.count({ where: { examId } });
  const url = appUrl(`/student/exams/${examId}`);

  const { delivered, failed } = await sendEmails(
    recipients,
    () => `Exam scheduled: ${exam.title}`,
    () => ({
      examTitle: exam.title,
      courseTitle: exam.course?.title ?? null,
      opensAt: formatWhen(exam.opensAt, exam.timezone),
      closesAt: formatWhen(exam.closesAt, exam.timezone),
      durationMinutes: exam.durationMinutes,
      questionCount,
      examUrl: url,
    }),
    "SCHEDULED",
  );

  if (delivered.length > 0) {
    await client.examCandidate.updateMany({
      where: { id: { in: delivered } },
      data: { notifiedAt: new Date() },
    });
  }

  await Promise.all(
    recipients
      .filter((r) => delivered.includes(r.candidateId))
      .map((r) =>
        notifyInApp(
          r.userId,
          "You have an exam scheduled",
          `${exam.title}${exam.opensAt ? ` opens ${formatWhen(exam.opensAt, exam.timezone)}` : ""}`,
          url,
        ),
      ),
  );

  return {
    attempted: recipients.length,
    sent: delivered.length,
    failed,
    skipped: 0,
  };
}

// ─── Reminder ────────────────────────────────────────────────────────────────

/**
 * Remind candidates about exams opening within `hoursAhead`.
 *
 * Driven by the sweep, so it must be cheap and safe to run every few minutes.
 * `reminderSentAt` is what makes that safe.
 */
export async function notifyUpcomingExams(
  client: PrismaClient = defaultClient,
  now: Date = new Date(),
  hoursAhead = 24,
): Promise<NotifyReport> {
  const horizon = new Date(now.getTime() + hoursAhead * 3_600_000);

  const exams = await client.exam.findMany({
    where: {
      status: "SCHEDULED",
      opensAt: { gt: now, lte: horizon },
    },
    include: { course: { select: { title: true } } },
  });

  let attempted = 0;
  let sent = 0;
  let failed = 0;

  for (const exam of exams) {
    const candidates = await client.examCandidate.findMany({
      where: { examId: exam.id, reminderSentAt: null, excludedAt: null },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (candidates.length === 0) continue;

    const recipients: Recipient[] = candidates.map((c) => ({
      candidateId: c.id,
      userId: c.user.id,
      email: c.user.email,
      name: c.user.name,
    }));
    attempted += recipients.length;

    const hours = exam.opensAt
      ? Math.max(1, Math.round((exam.opensAt.getTime() - now.getTime()) / 3_600_000))
      : null;
    const startsIn = hours ? `in about ${hours} hour${hours === 1 ? "" : "s"}` : "soon";
    const url = appUrl(`/student/exams/${exam.id}`);

    const result = await sendEmails(
      recipients,
      () => `Reminder: ${exam.title}`,
      () => ({
        examTitle: exam.title,
        courseTitle: exam.course?.title ?? null,
        opensAt: formatWhen(exam.opensAt, exam.timezone),
        closesAt: formatWhen(exam.closesAt, exam.timezone),
        durationMinutes: exam.durationMinutes,
        examUrl: url,
        startsIn,
      }),
      "REMINDER",
    );

    sent += result.delivered.length;
    failed += result.failed;

    if (result.delivered.length > 0) {
      await client.examCandidate.updateMany({
        where: { id: { in: result.delivered } },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  return { attempted, sent, failed, skipped: 0 };
}

// ─── Results ─────────────────────────────────────────────────────────────────

/**
 * Tell candidates their result is out.
 *
 * Only for grades actually RELEASED — releasing part of an exam must not email
 * the students whose papers are still being marked.
 */
export async function notifyResultsReleased(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<NotifyReport> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    select: { title: true, showCorrectAnswers: true },
  });
  if (!exam) return { attempted: 0, sent: 0, failed: 0, skipped: 0, reason: "Exam not found" };

  const grades = await client.examGrade.findMany({
    where: { examId, status: "RELEASED" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (grades.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, skipped: 0, reason: "Nothing released yet" };
  }

  const candidates = await client.examCandidate.findMany({
    where: {
      examId,
      userId: { in: grades.map((g) => g.userId) },
      resultsNotifiedAt: null,
      excludedAt: null,
    },
    select: { id: true, userId: true },
  });

  const candidateByUser = new Map(candidates.map((c) => [c.userId, c.id]));

  const pending = grades.filter((g) => candidateByUser.has(g.userId));
  if (pending.length === 0) {
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: grades.length,
      reason: "Everyone has already been told",
    };
  }

  const url = appUrl(`/student/exams/${examId}`);
  const gradeByCandidate = new Map(
    pending.map((g) => [candidateByUser.get(g.userId)!, g]),
  );

  const recipients: Recipient[] = pending.map((g) => ({
    candidateId: candidateByUser.get(g.userId)!,
    userId: g.user.id,
    email: g.user.email,
    name: g.user.name,
  }));

  const { delivered, failed } = await sendEmails(
    recipients,
    () => `Your result for ${exam.title}`,
    (r) => {
      const grade = gradeByCandidate.get(r.candidateId);
      return {
        examTitle: exam.title,
        examUrl: url,
        percentage: grade?.percentage ?? null,
        passed: grade?.passed ?? null,
      };
    },
    "RESULTS",
  );

  if (delivered.length > 0) {
    await client.examCandidate.updateMany({
      where: { id: { in: delivered } },
      data: { resultsNotifiedAt: new Date() },
    });
  }

  await Promise.all(
    recipients
      .filter((r) => delivered.includes(r.candidateId))
      .map((r) =>
        notifyInApp(
          r.userId,
          "Your exam result is available",
          `Your result for ${exam.title} has been released.`,
          url,
        ),
      ),
  );

  return {
    attempted: recipients.length,
    sent: delivered.length,
    failed,
    skipped: grades.length - pending.length,
  };
}
