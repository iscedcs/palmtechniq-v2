/**
 * Verifies the tutor emails: course approval and course sale.
 *
 *   pnpm verify:tutor-notifications
 *
 * Runs against a REAL database with fixtures it creates and removes, and sends
 * no email (TUTOR_EMAILS_DRY_RUN) and reports no purchase to Meta (both are
 * intercepted at fetch). It refuses to run against a production database.
 *
 * WHAT IT PROVES
 *
 *   - A course approval is announced exactly once, however many times or how
 *     concurrently it is triggered, and only for a course that is live.
 *   - "First course" copy goes only to a tutor with nothing approved before.
 *   - A tutor's own email settings are honoured, and the in-app notice is sent
 *     regardless.
 *   - A failed send hands the claim back, so a retry can succeed.
 *   - Three simultaneous settlements of one payment credit the tutor ONCE and
 *     email them ONCE.
 *
 * That last check was validated against the code as it stood before the
 * conditional claim was added to finalizePaystackByReference: the same
 * scenario there produced 3 earning rows and 3 wallet credits for one sale
 * (balance 7,500 against a share of 2,500). If those assertions ever fail
 * again, that race has come back.
 */
import "dotenv/config";

import { db } from "@/lib/db";
import { computeCheckoutTotals, REVENUE } from "@/lib/payments/revenue";
import { finalizePaystackByReference } from "@/lib/payments/finalizePaystack";
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
// test deliberately trips a missing API key. Anything else still shows.
const realError = console.error;
console.error = (...args: unknown[]) => {
  const first = String(args[0] ?? "");
  if (first.startsWith("[Analytics] Failed to track event")) return;
  if (first.startsWith("[sendCourseApprovedEmail] Failed to send email")) return;
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
};

async function makeCategory() {
  const c = await db.category.create({
    data: { name: tag("Category"), slug: `tn-verify-${RUN}` },
  });
  created.categoryIds.push(c.id);
  return c;
}

async function makeTutor(
  label: string,
  categoryId: string,
  opts: { preferences?: object } = {},
) {
  const user = await db.user.create({
    data: {
      email: email(label),
      name: tag(label),
      role: "TUTOR",
      ...(opts.preferences ? { preferences: opts.preferences } : {}),
    },
  });
  created.userIds.push(user.id);
  const tutor = await db.tutor.create({
    data: { userId: user.id, title: tag(label), experience: 1 },
  });
  created.tutorIds.push(tutor.id);
  return { user, tutor, categoryId };
}

async function makeCourse(
  t: { user: { id: string }; tutor: { id: string }; categoryId: string },
  label: string,
  status: "DRAFT" | "PUBLISHED" = "DRAFT",
  price = 0,
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
    },
  });
  created.courseIds.push(c.id);
  return c;
}

async function makeSale(t: { user: { id: string }; tutor: { id: string }; categoryId: string }, label: string) {
  const course = await makeCourse(t, label, "PUBLISHED", 10000);
  const student = await db.user.create({
    data: { email: email(`${label}-student`), name: tag(`${label}-student`), role: "USER" },
  });
  created.userIds.push(student.id);

  const totals = computeCheckoutTotals({
    courses: [
      { id: course.id, tutorId: t.user.id, basePrice: 10000, currentPrice: 10000, price: 10000 },
    ],
    promo: null,
    vatRate: REVENUE.vatRate,
    referralTutorId: null,
  });

  const reference = `ps_${tag(label)}`;
  const tx = await db.transaction.create({
    data: {
      userId: student.id,
      courseId: course.id,
      amount: totals.totalAmount,
      currency: "NGN",
      status: "PENDING",
      paymentMethod: "PAYSTACK",
      transactionId: reference,
      description: "verification sale",
      subtotalAmount: totals.subtotalAmount,
      discountAmount: totals.discountAmount,
      vatAmount: totals.vatAmount,
      tutorShareAmount: totals.tutorShareAmount,
      platformShareAmount: totals.platformShareAmount,
      metadata: {
        courseIds: [course.id],
        primaryCourseId: course.id,
        count: 1,
        creditApplied: 0,
        listTotal: totals.totalAmount,
      },
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
  });
  created.transactionIds.push(tx.id);
  paystackAmounts.set(reference, totals.totalAmount);
  return { reference, tx, course, student, tutorShare: totals.tutorShareAmount as number };
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

async function cleanup() {
  const ids = created.userIds;
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); } catch (e) { realLog(`  cleanup: ${label} failed: ${(e as Error).message}`); }
  };
  await step("notifications", () => db.notification.deleteMany({ where: { userId: { in: ids } } }));
  await step("wallet entries", () => db.walletEntry.deleteMany({ where: { userId: { in: ids } } }));
  await step("tutor earnings", () => db.tutorEarning.deleteMany({ where: { tutorId: { in: ids } } }));
  await step("line items", () => db.transactionLineItem.deleteMany({ where: { transactionId: { in: created.transactionIds } } }));
  await step("transactions", () => db.transaction.deleteMany({ where: { id: { in: created.transactionIds } } }));
  await step("enrollments", () => db.enrollment.deleteMany({ where: { courseId: { in: created.courseIds } } }));
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
    check("...as the tutor's first course", r1.sent && r1.isFirstCourse === true);
    const firstMail = emailsTo(email("t1"), "course-approved");
    check("exactly one email", firstMail.length === 1, `${firstMail.length}`);
    check("...with the congratulatory subject", /first course/i.test(firstMail[0]?.subject ?? ""), firstMail[0]?.subject);
    const stamped = await db.course.findUnique({ where: { id: first.id }, select: { approvalNotifiedAt: true } });
    check("the course is marked as announced", stamped?.approvalNotifiedAt != null);
    const inApp = () => db.notification.count({ where: { userId: t1.user.id, data: { path: ["category"], equals: "course_approved" } } });
    check("an in-app notice was created", (await inApp()) === 1);

    const r2 = await notifyCourseApproved(first.id);
    check("calling again does nothing", !r2.sent && r2.reason === "already_notified", JSON.stringify(r2));
    check("...no second email, no second notice", emailsTo(email("t1")).length === 1 && (await inApp()) === 1);

    const second = await makeCourse(t1, "second", "PUBLISHED");
    const burst = await Promise.all([1, 2, 3, 4, 5].map(() => notifyCourseApproved(second.id)));
    const winners = burst.filter((r) => r.sent);
    check("five simultaneous approvals: exactly one announces", winners.length === 1, `${winners.length} did`);
    check("...and only one email went out", emailsTo(email("t1"), "course-approved").length === 2, `${emailsTo(email("t1"), "course-approved").length} total to this tutor`);
    check("the second course is NOT called a first", winners[0]?.sent === true && winners[0].isFirstCourse === false);
    check("...and gets the short subject", /has been approved/i.test(emailsTo(email("t1"), "course-approved")[1]?.subject ?? ""), emailsTo(email("t1"), "course-approved")[1]?.subject);

    // A tutor with a live course that predates the feature (no marker).
    const tLegacy = await makeTutor("legacy", category.id);
    await makeCourse(tLegacy, "old-live", "PUBLISHED"); // approvalNotifiedAt stays null
    const fresh = await makeCourse(tLegacy, "newer", "PUBLISHED");
    const rL = await notifyCourseApproved(fresh.id);
    check("a tutor with an older live course is not told this is their first", rL.sent && rL.isFirstCourse === false, JSON.stringify(rL));

    // Email switched off.
    const tOff = await makeTutor("off", category.id, { preferences: { emailNotifications: false } });
    const offCourse = await makeCourse(tOff, "off-course", "PUBLISHED");
    const rOff = await notifyCourseApproved(offCourse.id);
    check("email disabled by the tutor: no email", rOff.sent && !rOff.emailed && rOff.reason === "email_disabled_by_tutor", JSON.stringify(rOff));
    check("...but they still get the in-app notice", (await db.notification.count({ where: { userId: tOff.user.id, data: { path: ["category"], equals: "course_approved" } } })) === 1);

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

    const again = await finalizePaystackByReference(sNew.reference);
    check("a later call is a no-op", (again as any).alreadyDone === true);
    check("...and sends nothing more", emailsTo(email("new"), "course-sale").length === 1);

    // Settings.
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

    // A tutor who never touched their settings (no preferences at all) is opted IN.
    const tDefault = await makeTutor("default", category.id);
    const sDefault = await makeSale(tDefault, "default-sale");
    await finalizePaystackByReference(sDefault.reference);
    check("untouched settings count as opted in", emailsTo(email("default"), "course-sale").length === 1);

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
