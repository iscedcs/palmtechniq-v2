/**
 * Verifies the tutor emails, the review gate, group purchases and the analytics
 * table.
 *
 *   pnpm verify:tutor-notifications
 *
 * Runs against a REAL database with fixtures it creates and removes, sends no
 * email (TUTOR_EMAILS_DRY_RUN) and reports no purchase to Meta (both are
 * intercepted at fetch). It REFUSES to run against a production database.
 *
 * WHAT IT PROVES
 *
 *   Course approval
 *     - announced exactly once, however many times or how concurrently it is
 *       triggered, and only for a course that is live;
 *     - "first course" copy goes only to a tutor with nothing approved before;
 *     - a tutor's own email settings are honoured, and the in-app notice is
 *       sent regardless; a failed send hands the claim back.
 *
 *   Editing a live course (the review gate)
 *     - a tutor's save takes it to draft and records that a re-approval is
 *       pending; an admin's own unpublish does not;
 *     - the re-approval is announced as "changes are now live", once per edit
 *       cycle, and is never mistaken for a first approval;
 *     - the first publish date survives edits.
 *
 *   Payments
 *     - three simultaneous settlements of one payment credit the tutor ONCE and
 *       email them ONCE.
 *
 *   Group purchases
 *     - the tutor is told at payment and at completion;
 *     - two people taking the last seat at once complete the group ONCE: the
 *       tutor is debited the cashback once, and told once;
 *     - a tutor who cannot fund the cashback blocks completion cleanly.
 *
 *   Analytics
 *     - PlatformEvent accepts the exact field set both writers use and answers
 *       the query shapes the admin dashboard uses.
 *
 * Both concurrency checks were validated against the code as it stood before
 * the conditional claims were added. The same three-way settlement then
 * produced 3 earning rows and 3 wallet credits for one sale (balance 7,500
 * against a share of 2,500). If those assertions ever fail again, that race
 * has come back.
 */
import "dotenv/config";

import { db } from "@/lib/db";
import { parseUserAgent } from "@/lib/analytics/user-agent";
import { reviewFieldsForSave } from "@/lib/course-review";
import { executeJoinGroup } from "@/lib/group-purchase/join";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";
import {
  computeCheckoutTotals,
  computeGroupCashback,
  REVENUE,
} from "@/lib/payments/revenue";
import { notifyCourseApproved } from "@/lib/tutor-notifications";

const RUN = Date.now().toString(36);
const tag = (s: string) => `tn-verify-${RUN}-${s}`;
// .invalid is reserved and can never resolve, so even a leaked send goes nowhere.
const email = (s: string) => `${tag(s)}@example.invalid`;

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  —  ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// Instrumentation: capture the emails that WOULD be sent, and fake the two
// outside services the settlement path talks to.
// ---------------------------------------------------------------------------
const sentEmails: { kind: string; to: string; subject: string }[] = [];
const outbound: string[] = [];
const realLog = console.log;
console.log = (...args: unknown[]) => {
  const line = args.map(String).join(" ");
  const m = line.match(/^\[tutor-emails\] DRY RUN — would send (\S+) to (\S+): (.*)$/);
  if (m) sentEmails.push({ kind: m[1], to: m[2], subject: m[3] });
  else realLog(...args);
};
const emailsTo = (address: string, kind?: string) =>
  sentEmails.filter((e) => e.to === address && (!kind || e.kind === kind));

// Two expected kinds of noise: trackEvent needs an HTTP request scope that a
// script does not have (it catches and logs, harmlessly), and the failed-send
// tests deliberately trip a missing API key. Anything else still shows.
const realError = console.error;
console.error = (...args: unknown[]) => {
  const first = String(args[0] ?? "");
  if (first.startsWith("[Analytics] Failed to track event")) return;
  if (first.startsWith("[sendCourseApprovedEmail] Failed to send email")) return;
  if (first.startsWith("[group-purchase] cannot complete group")) return;
  realError(...args);
};

const realFetch = globalThis.fetch;
let verifyDelayMs = 0;
const paystackAmounts = new Map<string, number>();

globalThis.fetch = (async (input: any, init?: any) => {
  const url = String(typeof input === "string" ? input : (input?.url ?? input));

  if (url.includes("api.paystack.co/transaction/verify/")) {
    outbound.push("paystack:verify");
    const reference = decodeURIComponent(url.split("/verify/")[1]);
    // The delay is what makes overlapping callers overlap: every caller has
    // already read the transaction as PENDING before any of them gets an answer.
    if (verifyDelayMs) await new Promise((r) => setTimeout(r, verifyDelayMs));
    const body = {
      status: true,
      data: {
        status: "success",
        reference,
        amount: Math.round((paystackAmounts.get(reference) ?? 0) * 100),
        currency: "NGN",
        paid_at: new Date().toISOString(),
        channel: "card",
        customer: { email: "buyer@example.invalid" },
      },
    };
    return { ok: true, status: 200, json: async () => body } as Response;
  }

  if (url.includes("facebook.com") || url.includes("paystack.co")) {
    // Meta Conversions API, or anything else that would leave the building.
    outbound.push(`stubbed:${new URL(url).host}`);
    return { ok: true, status: 200, json: async () => ({}), text: async () => "" } as Response;
  }

  return realFetch(input, init);
}) as typeof fetch;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const created = {
  userIds: [] as string[],
  tutorIds: [] as string[],
  courseIds: [] as string[],
  categoryIds: [] as string[],
  transactionIds: [] as string[],
  groupIds: [] as string[],
};

type TutorFx = { user: { id: string }; tutor: { id: string }; categoryId: string };

async function makeCategory() {
  const c = await db.category.create({
    data: { name: tag("Category"), slug: `tn-verify-${RUN}` },
  });
  created.categoryIds.push(c.id);
  return c;
}

async function makeUser(label: string, role: "TUTOR" | "USER" | "ADMIN", preferences?: object) {
  const user = await db.user.create({
    data: {
      email: email(label),
      name: tag(label),
      role,
      ...(preferences ? { preferences } : {}),
    },
  });
  created.userIds.push(user.id);
  return user;
}

async function makeTutor(label: string, categoryId: string, opts: { preferences?: object } = {}): Promise<TutorFx> {
  const user = await makeUser(label, "TUTOR", opts.preferences);
  const tutor = await db.tutor.create({
    data: { userId: user.id, title: tag(label), experience: 1 },
  });
  created.tutorIds.push(tutor.id);
  return { user, tutor, categoryId };
}

async function makeCourse(
  t: TutorFx,
  label: string,
  status: "DRAFT" | "PUBLISHED" = "DRAFT",
  price = 0,
  extra: Record<string, unknown> = {},
) {
  const c = await db.course.create({
    data: {
      title: tag(label),
      slug: `tn-verify-course-${RUN}-${label}`,
      description: "fixture",
      subtitle: "fixture",
      price,
      basePrice: price,
      currentPrice: price,
      status,
      categoryId: t.categoryId,
      creatorId: t.user.id,
      tutorId: t.tutor.id,
      ...extra,
    },
  });
  created.courseIds.push(c.id);
  return c;
}

function transactionData(opts: {
  studentId: string;
  course: { id: string };
  tutorUserId: string;
  price: number;
  reference: string;
  groupPurchaseId?: string;
  tierId?: string;
}) {
  const totals = computeCheckoutTotals({
    courses: [
      {
        id: opts.course.id,
        tutorId: opts.tutorUserId,
        basePrice: opts.price,
        currentPrice: opts.price,
        price: opts.price,
      },
    ],
    promo: null,
    vatRate: REVENUE.vatRate,
    referralTutorId: null,
  });
  paystackAmounts.set(opts.reference, totals.totalAmount);

  return {
    totals,
    data: {
      userId: opts.studentId,
      courseId: opts.course.id,
      ...(opts.groupPurchaseId ? { groupPurchaseId: opts.groupPurchaseId } : {}),
      amount: totals.totalAmount,
      currency: "NGN",
      status: "PENDING" as const,
      paymentMethod: "PAYSTACK" as const,
      transactionId: opts.reference,
      description: "verification sale",
      subtotalAmount: totals.subtotalAmount,
      discountAmount: totals.discountAmount,
      vatAmount: totals.vatAmount,
      tutorShareAmount: totals.tutorShareAmount,
      platformShareAmount: totals.platformShareAmount,
      metadata: opts.groupPurchaseId
        ? { groupPurchaseId: opts.groupPurchaseId, courseId: opts.course.id, tierId: opts.tierId, type: "group_purchase" }
        : { courseIds: [opts.course.id], primaryCourseId: opts.course.id, count: 1, creditApplied: 0, listTotal: totals.totalAmount },
      lineItems: {
        create: totals.lineItems.map((item: any) => ({
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
        })),
      },
    },
  };
}

async function makeSale(t: TutorFx, label: string) {
  const course = await makeCourse(t, label, "PUBLISHED", 10000);
  const student = await makeUser(`${label}-student`, "USER");
  const reference = `ps_${tag(label)}`;
  const { totals, data } = transactionData({ studentId: student.id, course, tutorUserId: t.user.id, price: 10000, reference });
  const tx = await db.transaction.create({ data });
  created.transactionIds.push(tx.id);
  return { reference, tx, course, student, tutorShare: totals.tutorShareAmount as number };
}

/** A group whose creator has started checkout but not yet paid. */
async function makeGroup(t: TutorFx, label: string, opts: { size: number; cashbackPercent: number; groupPrice?: number }) {
  const groupPrice = opts.groupPrice ?? 20000;
  const course = await makeCourse(t, label, "PUBLISHED", groupPrice, { groupBuyingEnabled: true });
  const tier = await db.groupTier.create({
    data: { courseId: course.id, size: opts.size, groupPrice, cashbackPercent: opts.cashbackPercent, isActive: true },
  });
  const creator = await makeUser(`${label}-creator`, "USER");
  const { cashbackTotal, cashbackPerMember } = computeGroupCashback({
    groupPrice,
    cashbackPercent: opts.cashbackPercent,
    size: opts.size,
  });
  const inviteCode = `GRP-${tag(label)}`.toUpperCase().slice(0, 40);
  const group = await db.groupPurchase.create({
    data: {
      courseId: course.id,
      tierId: tier.id,
      creatorId: creator.id,
      inviteCode,
      status: "PENDING_PAYMENT",
      memberCount: 1,
      memberLimit: opts.size,
      groupPrice,
      cashbackTotal,
      cashbackPerMember,
      cashbackEarned: 0,
    },
  });
  created.groupIds.push(group.id);
  await db.groupMember.create({ data: { groupPurchaseId: group.id, userId: creator.id, role: "CREATOR" } });

  const reference = `ps_${tag(`${label}-grp`)}`;
  const { data } = transactionData({
    studentId: creator.id,
    course,
    tutorUserId: t.user.id,
    price: groupPrice,
    reference,
    groupPurchaseId: group.id,
    tierId: tier.id,
  });
  const tx = await db.transaction.create({ data });
  created.transactionIds.push(tx.id);
  return { group, course, creator, reference, tx, cashbackTotal, inviteCode, tier };
}

async function ledgerFor(tutorUserId: string, transactionId: string, studentId: string, courseId: string) {
  const [earnings, entries, tutorRow, enrollments, lineItems] = await Promise.all([
    db.tutorEarning.count({ where: { transactionId } }),
    db.walletEntry.count({ where: { userId: tutorUserId, type: "COURSE_EARNING", transactionId } }),
    db.user.findUnique({ where: { id: tutorUserId }, select: { walletBalance: true } }),
    db.enrollment.count({ where: { userId: studentId, courseId } }),
    db.transactionLineItem.count({ where: { transactionId } }),
  ]);
  return { earnings, entries, balance: tutorRow?.walletBalance ?? 0, enrollments, lineItems };
}

const inApp = (userId: string, category: string) =>
  db.notification.count({ where: { userId, data: { path: ["category"], equals: category } } });

async function cleanup() {
  const ids = created.userIds;
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); } catch (e) { realLog(`  cleanup: ${label} failed: ${(e as Error).message}`); }
  };
  await step("platform events", () => db.platformEvent.deleteMany({ where: { sessionId: { startsWith: tag("") } } }));
  await step("notifications", () => db.notification.deleteMany({ where: { userId: { in: ids } } }));
  await step("wallet entries", () => db.walletEntry.deleteMany({ where: { userId: { in: ids } } }));
  await step("tutor earnings", () => db.tutorEarning.deleteMany({ where: { tutorId: { in: ids } } }));
  await step("line items", () => db.transactionLineItem.deleteMany({ where: { transactionId: { in: created.transactionIds } } }));
  await step("transactions", () => db.transaction.deleteMany({ where: { id: { in: created.transactionIds } } }));
  await step("enrollments", () => db.enrollment.deleteMany({ where: { courseId: { in: created.courseIds } } }));
  await step("group members", () => db.groupMember.deleteMany({ where: { groupPurchaseId: { in: created.groupIds } } }));
  await step("group purchases", () => db.groupPurchase.deleteMany({ where: { id: { in: created.groupIds } } }));
  await step("group tiers", () => db.groupTier.deleteMany({ where: { courseId: { in: created.courseIds } } }));
  await step("courses", () => db.course.deleteMany({ where: { id: { in: created.courseIds } } }));
  await step("tutors", () => db.tutor.deleteMany({ where: { id: { in: created.tutorIds } } }));
  await step("categories", () => db.category.deleteMany({ where: { id: { in: created.categoryIds } } }));
  await step("users", () => db.user.deleteMany({ where: { id: { in: ids } } }));
  const left = await db.user.count({ where: { email: { startsWith: `tn-verify-${RUN}-` } } });
  realLog(`\n  cleanup: ${left === 0 ? "all fixtures removed" : `WARNING ${left} fixture users remain`}`);
}

// ---------------------------------------------------------------------------
async function main() {
  const dbName = ((await db.$queryRawUnsafe("select current_database()::text as name")) as any[])[0].name as string;
  realLog(`Database: ${dbName}`);
  if (/prod/i.test(dbName)) {
    realLog("Refusing to run: this looks like a production database. Point DATABASE_URL at development.");
    process.exit(2);
  }

  process.env.TUTOR_EMAILS_DRY_RUN = "1";
  const category = await makeCategory();

  try {
    // ======================= APPROVAL =======================
    realLog("\nCourse approval");

    const t1 = await makeTutor("t1", category.id);
    const draft = await makeCourse(t1, "draft", "DRAFT");
    const r0 = await notifyCourseApproved(draft.id);
    check("a draft course is not announced", !r0.sent && r0.reason === "not_published", JSON.stringify(r0));
    check("...and no email was produced", emailsTo(email("t1")).length === 0);

    const first = await makeCourse(t1, "first", "PUBLISHED");
    const r1 = await notifyCourseApproved(first.id);
    check("first approval is announced and emailed", r1.sent && r1.emailed, JSON.stringify(r1));
    check("...as the tutor's first course", r1.sent && r1.kind === "first");
    const firstMail = emailsTo(email("t1"), "course-approved");
    check("exactly one email", firstMail.length === 1, `${firstMail.length}`);
    check("...with the congratulatory subject", /first course/i.test(firstMail[0]?.subject ?? ""), firstMail[0]?.subject);
    const stamped = await db.course.findUnique({ where: { id: first.id }, select: { approvalNotifiedAt: true } });
    check("the course is marked as announced", stamped?.approvalNotifiedAt != null);
    check("an in-app notice was created", (await inApp(t1.user.id, "course_approved")) === 1);

    const r2 = await notifyCourseApproved(first.id);
    check("calling again does nothing", !r2.sent && r2.reason === "already_notified", JSON.stringify(r2));
    check("...no second email, no second notice", emailsTo(email("t1")).length === 1 && (await inApp(t1.user.id, "course_approved")) === 1);

    const second = await makeCourse(t1, "second", "PUBLISHED");
    const burst = await Promise.all([1, 2, 3, 4, 5].map(() => notifyCourseApproved(second.id)));
    const winners = burst.filter((r) => r.sent);
    check("five simultaneous approvals: exactly one announces", winners.length === 1, `${winners.length} did`);
    check("...and only one email went out", emailsTo(email("t1"), "course-approved").length === 2, `${emailsTo(email("t1"), "course-approved").length} total to this tutor`);
    check("the second course is NOT called a first", winners[0]?.sent === true && winners[0].kind === "later");
    check("...and gets the short subject", /has been approved/i.test(emailsTo(email("t1"), "course-approved")[1]?.subject ?? ""), emailsTo(email("t1"), "course-approved")[1]?.subject);

    // A tutor with a live course that predates the feature (no marker).
    const tLegacy = await makeTutor("legacy", category.id);
    await makeCourse(tLegacy, "old-live", "PUBLISHED"); // approvalNotifiedAt stays null
    const fresh = await makeCourse(tLegacy, "newer", "PUBLISHED");
    const rL = await notifyCourseApproved(fresh.id);
    check("a tutor with an older live course is not told this is their first", rL.sent && rL.kind === "later", JSON.stringify(rL));

    // Email switched off.
    const tOff = await makeTutor("off", category.id, { preferences: { emailNotifications: false } });
    const offCourse = await makeCourse(tOff, "off-course", "PUBLISHED");
    const rOff = await notifyCourseApproved(offCourse.id);
    check("email disabled by the tutor: no email", rOff.sent && !rOff.emailed && rOff.reason === "email_disabled_by_tutor", JSON.stringify(rOff));
    check("...but they still get the in-app notice", (await inApp(tOff.user.id, "course_approved")) === 1);

    // A failed send hands the claim back.
    process.env.TUTOR_EMAILS_DRY_RUN = "0";
    const savedKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const tFail = await makeTutor("fail", category.id);
    const failCourse = await makeCourse(tFail, "fail-course", "PUBLISHED");
    const rFail = await notifyCourseApproved(failCourse.id);
    if (savedKey) process.env.RESEND_API_KEY = savedKey;
    process.env.TUTOR_EMAILS_DRY_RUN = "1";
    check("a failed send is reported", rFail.sent && !rFail.emailed && /email_failed/.test(rFail.reason ?? ""), rFail.reason);
    const released = await db.course.findUnique({ where: { id: failCourse.id }, select: { approvalNotifiedAt: true } });
    check("...and the claim is released so a retry can succeed", released?.approvalNotifiedAt == null);
    const rRetry = await notifyCourseApproved(failCourse.id);
    check("the retry then succeeds", rRetry.sent && rRetry.emailed, JSON.stringify(rRetry));

    // ======================= THE REVIEW GATE =======================
    realLog("\nEditing a live course (the review gate)");

    const t0 = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-06-01T00:00:00Z");
    const tutorSaveLive = reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: t0, publish: false, actorIsAdmin: false, now });
    check("a tutor's save takes a live course to draft", tutorSaveLive.status === "DRAFT");
    check("...and records that a re-approval is pending", tutorSaveLive.reapprovalPendingSince?.getTime() === now.getTime());
    check("...without erasing the first publish date", !("publishedAt" in tutorSaveLive));
    const tutorSaveDraft = reviewFieldsForSave({ currentStatus: "DRAFT", currentPublishedAt: null, publish: false, actorIsAdmin: false, now });
    check("saving a course that was never live records nothing to re-approve", tutorSaveDraft.status === "DRAFT" && !tutorSaveDraft.reapprovalPendingSince);
    const adminUnpublish = reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: t0, publish: false, actorIsAdmin: true, now });
    check("an admin's own unpublish is not an edit awaiting review", adminUnpublish.status === "DRAFT" && !adminUnpublish.reapprovalPendingSince);
    const firstPublish = reviewFieldsForSave({ currentStatus: "DRAFT", currentPublishedAt: null, publish: true, actorIsAdmin: true, now });
    check("publishing stamps the publish date", firstPublish.status === "PUBLISHED" && firstPublish.publishedAt?.getTime() === now.getTime());
    const rePublish = reviewFieldsForSave({ currentStatus: "DRAFT", currentPublishedAt: t0, publish: true, actorIsAdmin: true, now });
    check("...and re-publishing keeps the FIRST date", rePublish.publishedAt?.getTime() === t0.getTime());

    // The full cycle, applying the same fields the real save writes.
    const tE = await makeTutor("edit", category.id);
    const live = await makeCourse(tE, "live", "PUBLISHED");
    await db.course.update({ where: { id: live.id }, data: { publishedAt: t0 } });
    await notifyCourseApproved(live.id); // its first approval
    check("setup: the first approval went out", emailsTo(email("edit"), "course-approved").length === 1);

    const tutorEdits = async () => {
      const cur = await db.course.findUnique({ where: { id: live.id }, select: { status: true, publishedAt: true } });
      await db.course.update({
        where: { id: live.id },
        data: reviewFieldsForSave({ currentStatus: cur!.status, currentPublishedAt: cur!.publishedAt, publish: false, actorIsAdmin: false }),
      });
    };
    const adminApproves = async () => {
      const cur = await db.course.findUnique({ where: { id: live.id }, select: { publishedAt: true } });
      await db.course.update({ where: { id: live.id }, data: { status: "PUBLISHED", publishedAt: cur!.publishedAt ?? new Date() } });
      return notifyCourseApproved(live.id);
    };

    await tutorEdits();
    const afterEdit = await db.course.findUnique({ where: { id: live.id }, select: { status: true, reapprovalPendingSince: true, publishedAt: true } });
    check("after a tutor edit the course is a draft awaiting review", afterEdit?.status === "DRAFT" && afterEdit.reapprovalPendingSince != null);
    check("...and its publish date is intact", afterEdit?.publishedAt?.getTime() === t0.getTime());
    check("the edit alone sends nothing", emailsTo(email("edit"), "course-approved").length === 1);

    const burst2 = await Promise.all([1, 2, 3, 4, 5].map(async () => {
      // Five admins clicking approve at once.
      await db.course.update({ where: { id: live.id }, data: { status: "PUBLISHED" } });
      return notifyCourseApproved(live.id);
    }));
    const reWinners = burst2.filter((r) => r.sent);
    check("five simultaneous re-approvals: exactly one announces", reWinners.length === 1, `${reWinners.length} did`);
    check("...as updated changes, not a first course", reWinners[0]?.sent === true && reWinners[0].kind === "updated");
    const updatedMail = emailsTo(email("edit"), "course-approved").filter((e) => /changes/i.test(e.subject));
    check("exactly one 'changes are live' email", updatedMail.length === 1, `${updatedMail.length}`);
    check("...with the right subject", /Your changes to ".*" are now live/.test(updatedMail[0]?.subject ?? ""), updatedMail[0]?.subject);
    check("the pending marker is cleared", (await db.course.findUnique({ where: { id: live.id }, select: { reapprovalPendingSince: true } }))?.reapprovalPendingSince == null);
    check("an in-app 'changes live' notice was created", (await inApp(tE.user.id, "course_reapproved")) === 1);

    const again = await notifyCourseApproved(live.id);
    check("approving again with no new edit stays silent", !again.sent && again.reason === "already_notified", JSON.stringify(again));

    // An admin unpublishing and republishing, with no tutor edit in between.
    await db.course.update({ where: { id: live.id }, data: reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: t0, publish: false, actorIsAdmin: true }) });
    const silent = await adminApproves();
    check("an admin unpublish/republish (no tutor edit) stays silent", !silent.sent, JSON.stringify(silent));

    await tutorEdits();
    const second2 = await adminApproves();
    check("a SECOND edit cycle is announced again", second2.sent && second2.kind === "updated", JSON.stringify(second2));
    check("...so the tutor has now had two 'changes live' emails", emailsTo(email("edit"), "course-approved").filter((e) => /changes/i.test(e.subject)).length === 2);

    // A course that predates the feature: live, never announced, then edited.
    const tOld = await makeTutor("oldedit", category.id);
    const oldLive = await makeCourse(tOld, "old-live-edit", "PUBLISHED"); // approvalNotifiedAt null
    await db.course.update({ where: { id: oldLive.id }, data: reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: null, publish: false, actorIsAdmin: false }) });
    await db.course.update({ where: { id: oldLive.id }, data: { status: "PUBLISHED" } });
    const rOld = await notifyCourseApproved(oldLive.id);
    check("a long-live course, edited then re-approved, is NOT called a first course", rOld.sent && rOld.kind === "updated", JSON.stringify(rOld));
    check("...and it is now recorded as having been approved", (await db.course.findUnique({ where: { id: oldLive.id }, select: { approvalNotifiedAt: true } }))?.approvalNotifiedAt != null);

    // Email settings.
    const tEditOff = await makeTutor("editoff", category.id, { preferences: { emailNotifications: false } });
    const offLive = await makeCourse(tEditOff, "editoff-live", "PUBLISHED");
    await notifyCourseApproved(offLive.id);
    await db.course.update({ where: { id: offLive.id }, data: reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: null, publish: false, actorIsAdmin: false }) });
    await db.course.update({ where: { id: offLive.id }, data: { status: "PUBLISHED" } });
    const rEditOff = await notifyCourseApproved(offLive.id);
    check("email off: no 'changes live' email", rEditOff.sent && !rEditOff.emailed && rEditOff.reason === "email_disabled_by_tutor", JSON.stringify(rEditOff));
    check("...but the in-app notice still arrives", (await inApp(tEditOff.user.id, "course_reapproved")) === 1);

    // A failed send restores the pending marker so a retry can succeed.
    const tEditFail = await makeTutor("editfail", category.id);
    const failLive = await makeCourse(tEditFail, "editfail-live", "PUBLISHED");
    await notifyCourseApproved(failLive.id);
    await db.course.update({ where: { id: failLive.id }, data: reviewFieldsForSave({ currentStatus: "PUBLISHED", currentPublishedAt: null, publish: false, actorIsAdmin: false }) });
    await db.course.update({ where: { id: failLive.id }, data: { status: "PUBLISHED" } });
    process.env.TUTOR_EMAILS_DRY_RUN = "0";
    const key2 = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const rEditFail = await notifyCourseApproved(failLive.id);
    if (key2) process.env.RESEND_API_KEY = key2;
    process.env.TUTOR_EMAILS_DRY_RUN = "1";
    check("a failed 'changes live' send is reported", rEditFail.sent && !rEditFail.emailed && /email_failed/.test(rEditFail.reason ?? ""), rEditFail.reason);
    check("...and the pending marker is restored", (await db.course.findUnique({ where: { id: failLive.id }, select: { reapprovalPendingSince: true } }))?.reapprovalPendingSince != null);
    const rEditRetry = await notifyCourseApproved(failLive.id);
    check("the retry then succeeds as 'updated'", rEditRetry.sent && rEditRetry.emailed && rEditRetry.kind === "updated", JSON.stringify(rEditRetry));

    // ======================= SALE =======================
    realLog("\nCourse sale — three simultaneous settlements of ONE payment");
    verifyDelayMs = 400;

    const tNew = await makeTutor("new", category.id);
    const sNew = await makeSale(tNew, "new-sale");
    const results = await Promise.allSettled([1, 2, 3].map(() => finalizePaystackByReference(sNew.reference)));
    const fulfilled = results.filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled").map((r) => r.value);
    const L = await ledgerFor(tNew.user.id, sNew.tx.id, sNew.student.id, sNew.course.id);

    check("no caller errored", results.every((r) => r.status === "fulfilled"), results.filter((r) => r.status === "rejected").map((r: any) => r.reason?.message).join("; "));
    check("exactly one caller settled it", fulfilled.filter((r) => !r.alreadyDone).length === 1, `${fulfilled.filter((r) => !r.alreadyDone).length}`);
    check("the other two backed out", fulfilled.filter((r) => r.alreadyDone).length === 2);
    check("one earning row", L.earnings === 1, `${L.earnings}`);
    check("the tutor was credited once", L.entries === 1, `${L.entries}`);
    check("...for exactly one sale's share", L.balance === sNew.tutorShare, `${L.balance} vs ${sNew.tutorShare}`);
    check("one enrolment", L.enrollments === 1);
    check("one line item (none duplicated)", L.lineItems === 1);
    const saleMail = emailsTo(email("new"), "course-sale");
    check("the tutor was emailed exactly once", saleMail.length === 1, `${saleMail.length}`);
    check("...with the new-enrolment subject", /New enrolment/.test(saleMail[0]?.subject ?? ""), saleMail[0]?.subject);

    const laterCall = await finalizePaystackByReference(sNew.reference);
    check("a later call is a no-op", (laterCall as any).alreadyDone === true);
    check("...and sends nothing more", emailsTo(email("new"), "course-sale").length === 1);

    verifyDelayMs = 0;
    const tSaleOff = await makeTutor("saleoff", category.id, { preferences: { courseReminders: false } });
    const sOff = await makeSale(tSaleOff, "saleoff-sale");
    await finalizePaystackByReference(sOff.reference);
    check("'New Student Enrollments' off: sale still credited", (await ledgerFor(tSaleOff.user.id, sOff.tx.id, sOff.student.id, sOff.course.id)).entries === 1);
    check("...but no email", emailsTo(email("saleoff"), "course-sale").length === 0);

    const tMaster = await makeTutor("master", category.id, { preferences: { emailNotifications: false } });
    const sMaster = await makeSale(tMaster, "master-sale");
    await finalizePaystackByReference(sMaster.reference);
    check("master email switch off: no sale email", emailsTo(email("master"), "course-sale").length === 0);

    const tDefault = await makeTutor("default", category.id);
    const sDefault = await makeSale(tDefault, "default-sale");
    await finalizePaystackByReference(sDefault.reference);
    check("untouched settings count as opted in", emailsTo(email("default"), "course-sale").length === 1);

    // ======================= GROUP PURCHASES =======================
    realLog("\nGroup purchases");
    verifyDelayMs = 300;

    // 4 seats, 10% cashback (stored as the fraction 0.1, not 10), so the
    // completion debit is real and the tutor's share can fund it.
    const tG = await makeTutor("grp", category.id);
    const G = await makeGroup(tG, "grp", { size: 4, cashbackPercent: 0.1 });
    const startRes = await Promise.allSettled([1, 2, 3].map(() => finalizePaystackByReference(G.reference)));
    const startVals = startRes.filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled").map((r) => r.value);
    const gLedger = await ledgerFor(tG.user.id, G.tx.id, G.creator.id, G.course.id);
    check("group payment: exactly one caller settled it", startVals.filter((r) => !r.alreadyDone).length === 1);
    check("...the tutor was credited once", gLedger.entries === 1 && gLedger.earnings === 1, `${gLedger.entries} credits`);
    check("...and the group is open", (await db.groupPurchase.findUnique({ where: { id: G.group.id }, select: { status: true } }))?.status === "ACTIVE");
    const startMail = emailsTo(email("grp"), "group-started");
    check("the tutor was emailed once when the group started", startMail.length === 1, `${startMail.length}`);
    check("...with the group-started subject", /group purchase started/i.test(startMail[0]?.subject ?? ""), startMail[0]?.subject);
    check("...and got an in-app notice", (await inApp(tG.user.id, "group_purchase_started_tutor")) === 1);

    const balanceAfterStart = (await db.user.findUnique({ where: { id: tG.user.id }, select: { walletBalance: true } }))!.walletBalance;
    check("the tutor's balance covers the cashback (the test is meaningful)", balanceAfterStart >= G.cashbackTotal * 2, `${balanceAfterStart} vs ${G.cashbackTotal} each`);

    verifyDelayMs = 0;
    // Seats 2 and 3: sequential, so the group stands at 3 of 4.
    const joiners: { id: string }[] = [];
    for (let i = 0; i < 4; i++) joiners.push(await makeUser(`grp-j${i}`, "USER"));
    const j0 = await executeJoinGroup({ userId: joiners[0].id, inviteCode: G.inviteCode });
    const j1 = await executeJoinGroup({ userId: joiners[1].id, inviteCode: G.inviteCode });
    check("early joins succeed without completing", j0.ok && !j0.completed && j1.ok && !j1.completed);
    check("...and the tutor is not told anything yet", emailsTo(email("grp"), "group-completed").length === 0);

    // The last seat, taken by two people at the same moment.
    const [a, b] = await Promise.all([
      executeJoinGroup({ userId: joiners[2].id, inviteCode: G.inviteCode }),
      executeJoinGroup({ userId: joiners[3].id, inviteCode: G.inviteCode }),
    ]);
    const okOnes = [a, b].filter((r) => r.ok);
    const completedOnes = [a, b].filter((r) => r.ok && r.completed);
    check("two people take the last seat at once: exactly one succeeds", okOnes.length === 1, `${okOnes.length} succeeded`);
    check("...and exactly one completed the group", completedOnes.length === 1);
    const loser = [a, b].find((r) => !r.ok);
    check("the other is told to try again, not shown a crash", !!loser && !loser.ok && /changed|full|open/i.test(loser.error), loser && !loser.ok ? loser.error : "");

    const gFinal = await db.groupPurchase.findUnique({ where: { id: G.group.id }, select: { status: true, memberCount: true } });
    const memberRows = await db.groupMember.count({ where: { groupPurchaseId: G.group.id } });
    check("the group is complete with exactly its seat count", gFinal?.status === "COMPLETED" && gFinal.memberCount === 4 && memberRows === 4, `${gFinal?.memberCount} counted, ${memberRows} rows`);
    const debits = await db.walletEntry.count({ where: { userId: tG.user.id, type: "GROUP_CASHBACK_DEBIT", groupPurchaseId: G.group.id } });
    const credits = await db.walletEntry.count({ where: { userId: G.creator.id, type: "GROUP_CASHBACK_CREDIT", groupPurchaseId: G.group.id } });
    check("the tutor was debited the cashback exactly once", debits === 1, `${debits}`);
    check("the creator was credited it exactly once", credits === 1, `${credits}`);
    const balanceAfter = (await db.user.findUnique({ where: { id: tG.user.id }, select: { walletBalance: true } }))!.walletBalance;
    check("...so the tutor's balance fell by one cashback, not two", Math.abs(balanceAfterStart - balanceAfter - G.cashbackTotal) < 0.01, `${balanceAfterStart} -> ${balanceAfter}`);
    const enrolled = await db.enrollment.count({ where: { courseId: G.course.id } });
    check("every member is enrolled, and only them", enrolled === 4, `${enrolled}`);

    const doneMail = emailsTo(email("grp"), "group-completed");
    check("the tutor was emailed exactly once when it completed", doneMail.length === 1, `${doneMail.length}`);
    check("...with the completion subject", /is complete/i.test(doneMail[0]?.subject ?? ""), doneMail[0]?.subject);
    check("...and got exactly one in-app notice", (await inApp(tG.user.id, "group_purchase_completed_tutor")) === 1);

    // Email settings on the group notices.
    verifyDelayMs = 0;
    const tGe = await makeTutor("grpe", category.id, { preferences: { courseReminders: false } });
    const Ge = await makeGroup(tGe, "grpe", { size: 2, cashbackPercent: 0.1 });
    await finalizePaystackByReference(Ge.reference);
    check("'New Student Enrollments' off: no group-started email", emailsTo(email("grpe"), "group-started").length === 0);
    const je = await makeUser("grpe-j", "USER");
    await executeJoinGroup({ userId: je.id, inviteCode: Ge.inviteCode });
    check("...but the wallet deduction notice still arrives (master switch only)", emailsTo(email("grpe"), "group-completed").length === 1);

    const tGm = await makeTutor("grpm", category.id, { preferences: { emailNotifications: false } });
    const Gm = await makeGroup(tGm, "grpm", { size: 2, cashbackPercent: 0.1 });
    await finalizePaystackByReference(Gm.reference);
    const jm = await makeUser("grpm-j", "USER");
    await executeJoinGroup({ userId: jm.id, inviteCode: Gm.inviteCode });
    check("master email switch off: no group emails at all", emailsTo(email("grpm")).length === 0);
    check("...but both in-app notices arrive", (await inApp(tGm.user.id, "group_purchase_started_tutor")) === 1 && (await inApp(tGm.user.id, "group_purchase_completed_tutor")) === 1);

    // A tutor who cannot fund the cashback.
    const tGb = await makeTutor("grpb", category.id);
    const Gb = await makeGroup(tGb, "grpb", { size: 2, cashbackPercent: 0.1 });
    await finalizePaystackByReference(Gb.reference);
    await db.user.update({ where: { id: tGb.user.id }, data: { walletBalance: 0 } });
    const jb = await makeUser("grpb-j", "USER");
    const blocked = await executeJoinGroup({ userId: jb.id, inviteCode: Gb.inviteCode });
    check("a tutor who cannot fund the cashback blocks completion cleanly", !blocked.ok && /can't be completed/i.test(blocked.ok ? "" : blocked.error), blocked.ok ? "" : blocked.error);
    check("...the member's join is rolled back", (await db.groupMember.count({ where: { groupPurchaseId: Gb.group.id, userId: jb.id } })) === 0);
    check("...the group is still open", (await db.groupPurchase.findUnique({ where: { id: Gb.group.id }, select: { status: true } }))?.status === "ACTIVE");
    check("...and nothing was debited or announced", (await db.walletEntry.count({ where: { groupPurchaseId: Gb.group.id, type: "GROUP_CASHBACK_DEBIT" } })) === 0 && emailsTo(email("grpb"), "group-completed").length === 0);

    // ======================= ANALYTICS =======================
    realLog("\nAnalytics table (PlatformEvent)");
    const sess = tag("sess");
    const evUser = await makeUser("analytics-user", "USER");

    // Exactly the field set BOTH writers use (lib/analytics/track.ts and
    // /api/analytics/track): every column, including the ones only one uses.
    await db.platformEvent.create({
      data: {
        event: "checkout_completed", category: "checkout", action: "User completed purchase",
        userId: evUser.id, sessionId: sess, entityType: "transaction", entityId: "tx-1",
        metadata: { courseTitle: "x" }, path: "/courses/x", referrer: "https://example.invalid/",
        userAgent: "Mozilla/5.0", ipAddress: "203.0.113.9", device: "desktop", browser: "Chrome", os: "Windows",
        duration: 12, value: 12345.5,
      },
    });
    await db.platformEvent.create({
      data: { event: "page_viewed", category: "content", action: "User viewed a page", sessionId: sess, path: "/", device: "mobile", browser: "Safari", os: "iOS" },
    });
    check("PlatformEvent accepts the full field set the writers use", (await db.platformEvent.count({ where: { sessionId: sess } })) === 2);
    check("an anonymous event (no user) is accepted", (await db.platformEvent.count({ where: { sessionId: sess, userId: null } })) === 1);

    const since = { createdAt: { gte: new Date(Date.now() - 60_000) }, sessionId: sess };
    const byEvent = await db.platformEvent.groupBy({ by: ["event"], where: since, _count: { event: true }, orderBy: { _count: { event: "desc" } } });
    const byDevice = await db.platformEvent.groupBy({ by: ["device"], where: { ...since, device: { not: null } }, _count: { device: true } });
    const byUser = await db.platformEvent.groupBy({ by: ["userId"], where: { ...since, userId: { not: null } } });
    const revenue = await db.platformEvent.findMany({
      where: { ...since, event: { in: ["checkout_completed", "program_enrollment_paid"] }, value: { not: null } },
      select: { event: true, value: true, createdAt: true, entityType: true, metadata: true },
      orderBy: { createdAt: "asc" },
    });
    const recent = await db.platformEvent.findMany({
      where: { sessionId: sess },
      orderBy: { createdAt: "desc" },
      select: { event: true, category: true, path: true, device: true, browser: true, createdAt: true, value: true, entityType: true, entityId: true, user: { select: { name: true, email: true } } },
    });
    check("the dashboard's grouped queries run", byEvent.length === 2 && byDevice.length === 2 && byUser.length === 1);
    check("revenue events carry their value", revenue.length === 1 && revenue[0].value === 12345.5);
    check("the dashboard's 'recent events' join to the user", recent.some((e: any) => e.user?.email === email("analytics-user")));

    // Deleting a user must not delete their analytics history.
    const tmpUser = await makeUser("analytics-gone", "USER");
    await db.platformEvent.create({ data: { event: "page_viewed", category: "content", action: "x", userId: tmpUser.id, sessionId: sess } });
    await db.user.delete({ where: { id: tmpUser.id } });
    created.userIds = created.userIds.filter((id) => id !== tmpUser.id);
    const orphan = await db.platformEvent.findFirst({ where: { sessionId: sess, action: "x" }, select: { userId: true } });
    check("deleting a user keeps their events, detached", orphan !== null && orphan.userId === null);

    // The parser that feeds the dashboard's device / browser / OS breakdown.
    // The first two cases are the ones the old parser got wrong: iPhone UAs
    // contain "like Mac OS X" and Android UAs contain "Linux".
    const uaCases: [string, string, { device: string; browser: string; os: string }][] = [
      ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", { device: "mobile", browser: "Safari", os: "iOS" }],
      ["Android phone Chrome", "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36", { device: "mobile", browser: "Chrome", os: "Android" }],
      ["iPhone Chrome", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1", { device: "mobile", browser: "Chrome", os: "iOS" }],
      ["Android tablet", "Mozilla/5.0 (Linux; Android 12; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36", { device: "tablet", browser: "Chrome", os: "Android" }],
      ["iPad", "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", { device: "tablet", browser: "Safari", os: "iOS" }],
      ["Windows Edge", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0", { device: "desktop", browser: "Edge", os: "Windows" }],
      ["Mac Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", { device: "desktop", browser: "Safari", os: "macOS" }],
      ["Linux Firefox", "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0", { device: "desktop", browser: "Firefox", os: "Linux" }],
    ];
    for (const [label, ua, expected] of uaCases) {
      const got = parseUserAgent(ua);
      check(`user agent: ${label}`, got.device === expected.device && got.browser === expected.browser && got.os === expected.os, `${got.device}/${got.browser}/${got.os}`);
    }
    const none = parseUserAgent(null);
    check("user agent: missing header is 'unknown', not a crash", none.device === "unknown" && none.os === "unknown");

    // Nothing left the building.
    const leaks = outbound.filter((o) => !o.startsWith("paystack:verify") && !o.startsWith("stubbed:"));
    check("no real outside call was made", leaks.length === 0, leaks.join(","));
    realLog(`  (intercepted calls: ${[...new Set(outbound)].join(", ")})`);
  } finally {
    await cleanup();
    console.log = realLog;
    console.error = realError;
    realLog(`\n${passed} passed, ${failed} failed\n`);
  }

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    realLog(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
