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
  /** In-app notices created. This is the channel that actually works offline. */
  sent: number;
  /** Emails accepted by the provider. */
  emailsSent: number;
  emailsFailed: number;
  /** The provider's own words, surfaced so a broken key is not a silent failure. */
  emailError?: string;
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
): Promise<{ delivered: string[]; failed: number; error?: string }> {
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
    const message = "RESEND_API_KEY is not set";
    console.warn(`[exam-notifications] ${message}; no email sent.`);
    return { delivered: [], failed: recipients.length, error: message };
  }

  const resend = new Resend(apiKey);
  const delivered: string[] = [];
  let failed = 0;
  let error: string | undefined;

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
        error ??= result.error.message ?? String(result.error);
      } else {
        delivered.push(...chunk.map((r) => r.candidateId));
      }
    } catch (thrown) {
      console.error("[exam-notifications] batch threw:", thrown);
      failed += chunk.length;
      error ??= thrown instanceof Error ? thrown.message : String(thrown);
    }

    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_BATCHES_MS));
    }
  }

  return { delivered, failed, error };
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
  if (!exam) return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Exam not found" };

  const candidates = await client.examCandidate.findMany({
    where: { examId, notifiedAt: null, excludedAt: null },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (candidates.length === 0) {
    return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Everyone has already been told" };
  }

  const recipients: Recipient[] = candidates.map((c) => ({
    candidateId: c.id,
    userId: c.user.id,
    email: c.user.email,
    name: c.user.name,
  }));

  const questionCount = await client.examQuestion.count({ where: { examId } });
  const url = appUrl(`/student/exams/${examId}`);

  const emails = await sendEmails(
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

  // In-app goes to EVERYONE, whatever the mail provider did. These are separate
  // channels and the reliable one must not be held hostage by the flaky one —
  // an expired API key silently cost students both notices until this was split.
  await Promise.all(
    recipients.map((r) =>
      notifyInApp(
        r.userId,
        "You have an exam scheduled",
        `${exam.title}${exam.opensAt ? ` opens ${formatWhen(exam.opensAt, exam.timezone)}` : ""}`,
        url,
      ),
    ),
  );

  // Stamped because they HAVE been told, in-app. Email can be retried
  // independently with resendExamEmails once a provider problem is fixed.
  await client.examCandidate.updateMany({
    where: { id: { in: recipients.map((r) => r.candidateId) } },
    data: { notifiedAt: new Date() },
  });

  return {
    attempted: recipients.length,
    sent: recipients.length,
    emailsSent: emails.delivered.length,
    emailsFailed: emails.failed,
    emailError: emails.error,
    skipped: 0,
  };
}

/**
 * Re-send the scheduled-exam email to everyone on the roster, ignoring
 * `notifiedAt`.
 *
 * The recovery path for when email was down at publish time: the students were
 * told in-app, and this gets the email out once the provider works again.
 */
export async function resendExamEmails(
  examId: string,
  client: PrismaClient = defaultClient,
): Promise<NotifyReport> {
  const exam = await client.exam.findUnique({
    where: { id: examId },
    include: { course: { select: { title: true } } },
  });
  if (!exam) {
    return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Exam not found" };
  }

  const candidates = await client.examCandidate.findMany({
    where: { examId, excludedAt: null },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  const recipients: Recipient[] = candidates.map((c) => ({
    candidateId: c.id,
    userId: c.user.id,
    email: c.user.email,
    name: c.user.name,
  }));

  if (recipients.length === 0) {
    return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Nobody on the roster" };
  }

  const questionCount = await client.examQuestion.count({ where: { examId } });
  const url = appUrl(`/student/exams/${examId}`);

  const emails = await sendEmails(
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

  return {
    attempted: recipients.length,
    sent: 0,
    emailsSent: emails.delivered.length,
    emailsFailed: emails.failed,
    emailError: emails.error,
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
  let lastError: string | undefined;

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
    lastError ??= result.error;

    if (result.delivered.length > 0) {
      await client.examCandidate.updateMany({
        where: { id: { in: result.delivered } },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  return {
    attempted,
    sent,
    emailsSent: sent,
    emailsFailed: failed,
    emailError: lastError,
    skipped: 0,
  };
}

// ─── Retry granted ───────────────────────────────────────────────────────────

/**
 * Tell one candidate their tutor has reopened the exam for them.
 *
 * Not gated on any timestamp: a retry is an explicit, deliberate act by the
 * tutor, and granting a second one should say so again.
 */
export async function notifyRetryGranted(
  candidateId: string,
  windowClosesAt: Date | null,
  client: PrismaClient = defaultClient,
): Promise<NotifyReport> {
  const candidate = await client.examCandidate.findUnique({
    where: { id: candidateId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      exam: {
        select: {
          id: true,
          title: true,
          timezone: true,
          durationMinutes: true,
          course: { select: { title: true } },
        },
      },
    },
  });

  if (!candidate) {
    return {
      attempted: 0,
      sent: 0,
      emailsSent: 0,
      emailsFailed: 0,
      skipped: 0,
      reason: "Candidate not found",
    };
  }

  const url = appUrl(`/student/exams/${candidate.exam.id}`);
  const recipient: Recipient = {
    candidateId: candidate.id,
    userId: candidate.user.id,
    email: candidate.user.email,
    name: candidate.user.name,
  };

  const emails = await sendEmails(
    [recipient],
    () => `You can sit ${candidate.exam.title} again`,
    () => ({
      examTitle: candidate.exam.title,
      courseTitle: candidate.exam.course?.title ?? null,
      durationMinutes: candidate.exam.durationMinutes,
      examUrl: url,
      retryClosesAt: formatWhen(windowClosesAt, candidate.exam.timezone),
    }),
    "RETRY_GRANTED",
  );

  await notifyInApp(
    candidate.user.id,
    "You can sit this exam again",
    windowClosesAt
      ? `Your tutor reopened ${candidate.exam.title}. You have until ${formatWhen(windowClosesAt, candidate.exam.timezone)}.`
      : `Your tutor has given you another attempt at ${candidate.exam.title}.`,
    url,
  );

  return {
    attempted: 1,
    sent: 1,
    emailsSent: emails.delivered.length,
    emailsFailed: emails.failed,
    emailError: emails.error,
    skipped: 0,
  };
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
  if (!exam) return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Exam not found" };

  const grades = await client.examGrade.findMany({
    where: { examId, status: "RELEASED" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (grades.length === 0) {
    return { attempted: 0, sent: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, reason: "Nothing released yet" };
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
      emailsSent: 0,
      emailsFailed: 0,
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

  const emails = await sendEmails(
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

  // Independent of email — see notifyExamScheduled.
  await Promise.all(
    recipients.map((r) =>
      notifyInApp(
        r.userId,
        "Your exam result is available",
        `Your result for ${exam.title} has been released.`,
        url,
      ),
    ),
  );

  await client.examCandidate.updateMany({
    where: { id: { in: recipients.map((r) => r.candidateId) } },
    data: { resultsNotifiedAt: new Date() },
  });

  return {
    attempted: recipients.length,
    sent: recipients.length,
    emailsSent: emails.delivered.length,
    emailsFailed: emails.failed,
    emailError: emails.error,
    skipped: grades.length - pending.length,
  };
}
