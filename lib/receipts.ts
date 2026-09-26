import "server-only";

import { db } from "@/lib/db";
import { sendPaymentReceiptEmail } from "@/lib/mail";
import { REVENUE } from "@/lib/payments/revenue";
import { SITE_URL } from "@/lib/site";
import type { PrismaClient } from "@prisma/client";

/**
 * PalmTechnIQ's own payment receipts.
 *
 * Paystack emails a receipt of its own for every payment, on its own template.
 * These replace it, for everyone who pays: a student buying a course, bundle or
 * group place, someone booking a mentorship session, a tutor paying a promotion
 * fee, a student paying a program instalment.
 *
 * TWO RULES
 *
 *   1. A receipt is built from what was RECORDED, never recomputed. The figures
 *      come from the transaction and its line items as they were written when the
 *      payment settled, so a receipt cannot disagree with the ledger or with what
 *      the payer was actually charged.
 *   2. Sending never breaks the payment. Every entry point catches its own
 *      failures: a payment that has settled must stay settled whether or not the
 *      email goes out.
 *
 * Exactly-once is the CALLER'S job, as with the tutor emails: each call site
 * invokes this only from the request that won its conditional claim.
 */

const prisma = db as PrismaClient;

export type ReceiptData = Parameters<typeof sendPaymentReceiptEmail>[0];

/** What Paystack reports about a payment, of which receipts use a little. */
export type PaystackVerification = {
  paid_at?: string;
  channel?: string;
  authorization?: {
    last4?: string | null;
    card_type?: string | null;
    brand?: string | null;
  } | null;
} | null;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "PTQ-20260925-1A2B3C4D": unique, readable, and traceable to the payment. */
export function receiptNumber(reference: string, paidAt: Date): string {
  const day = paidAt.toISOString().slice(0, 10).replace(/-/g, "");
  const tail = reference.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `PTQ-${day}-${tail || "PAYMENT"}`;
}

/** "7.5%" from the rate the platform actually charges. */
export function vatRateLabel(): string {
  return `${Math.round(REVENUE.vatRate * 1000) / 10}%`;
}

const titleCase = (s: string) =>
  s.trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** How the payer paid, in words: "Visa card ending 4081", "Bank transfer". */
export function describePaymentMethod(v?: PaystackVerification): string {
  const channel = (v?.channel ?? "").toLowerCase().trim();
  const auth = v?.authorization ?? null;

  if (channel === "card") {
    const brand = titleCase(auth?.card_type ?? auth?.brand ?? "");
    const last4 = auth?.last4 ? ` ending ${auth.last4}` : "";
    return `${brand ? `${brand} card` : "Card"}${last4}`;
  }
  const known: Record<string, string> = {
    bank_transfer: "Bank transfer",
    bank: "Bank account",
    ussd: "USSD",
    mobile_money: "Mobile money",
    qr: "QR code",
    eft: "EFT",
    apple_pay: "Apple Pay",
  };
  if (known[channel]) return known[channel];
  return channel ? titleCase(channel.replace(/_/g, " ")) : "Paystack";
}

const paidAtOf = (v: PaystackVerification, fallback: Date): Date => {
  const parsed = v?.paid_at ? new Date(v.paid_at) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
};

// ---------------------------------------------------------------------------
// Course purchases, bundles, group places and mentorship sessions: anything that
// settles through finalizePaystackByReference and is recorded on a Transaction.
// ---------------------------------------------------------------------------

export async function buildTransactionReceipt(
  transactionId: string,
  verification?: PaystackVerification,
): Promise<ReceiptData | null> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      transactionId: true,
      amount: true,
      description: true,
      subtotalAmount: true,
      vatAmount: true,
      metadata: true,
      paymentDate: true,
      groupPurchaseId: true,
      user: { select: { email: true, name: true } },
      groupPurchase: { select: { memberLimit: true, inviteCode: true } },
      lineItems: {
        select: {
          basePrice: true,
          discountedPrice: true,
          vatAmount: true,
          course: { select: { title: true } },
        },
      },
    },
  });

  if (!tx?.user?.email || !tx.transactionId) return null;

  const paidAt = paidAtOf(verification ?? null, tx.paymentDate);
  const metadata = (tx.metadata ?? {}) as Record<string, unknown>;
  const base = {
    email: tx.user.email,
    name: tx.user.name ?? undefined,
    receiptNumber: receiptNumber(tx.transactionId, paidAt),
    reference: tx.transactionId,
    paidAt,
    paymentMethod: describePaymentMethod(verification),
    vatRateLabel: vatRateLabel(),
  };

  // ---- Courses, bundles, groups: itemised from the recorded line items ----
  if (tx.lineItems.length > 0) {
    const lines = tx.lineItems.map((item: any) => ({
      label: item.course.title,
      detail: tx.groupPurchase ? `Group of ${tx.groupPurchase.memberLimit}` : undefined,
      amount: item.basePrice,
    }));
    const discount = round2(
      tx.lineItems.reduce(
        (sum: number, i: any) => sum + Math.max(0, i.basePrice - i.discountedPrice),
        0,
      ),
    );
    const subtotal = round2(
      tx.lineItems.reduce((sum: number, i: any) => sum + i.discountedPrice, 0),
    );
    const vat = round2(tx.lineItems.reduce((sum: number, i: any) => sum + i.vatAmount, 0));
    const total = round2(subtotal + vat);
    // What the payer's wallet covered, so the receipt still adds up to what the
    // card was actually charged.
    const walletCredit = Math.max(0, round2(total - tx.amount));

    const isBundle = metadata.type === "bundle";
    const title = tx.groupPurchase
      ? "Group purchase"
      : isBundle
        ? "Bundle purchase"
        : lines.length > 1
          ? `Purchase of ${lines.length} courses`
          : "Course purchase";

    return {
      ...base,
      title,
      lines,
      discount,
      subtotal,
      vat,
      total,
      walletCredit,
      amountPaid: tx.amount,
      note: tx.groupPurchase
        ? `This was a group purchase for ${tx.groupPurchase.memberLimit} seats.`
        : undefined,
      cta: tx.groupPurchase
        ? { label: "View your group", href: `${SITE_URL}/group/${tx.groupPurchase.inviteCode}` }
        : { label: "Start learning", href: `${SITE_URL}/student/courses` },
    };
  }

  // ---- Mentorship (and anything else without line items) ----
  const hasVat = (tx.subtotalAmount ?? 0) > 0 && (tx.vatAmount ?? 0) > 0;
  const subtotal = hasVat ? (tx.subtotalAmount as number) : tx.amount;
  const vat = hasVat ? (tx.vatAmount as number) : 0;

  return {
    ...base,
    title: "Mentorship session",
    lines: [
      {
        label: tx.description?.trim() || "Mentorship session",
        amount: subtotal,
      },
    ],
    discount: 0,
    subtotal,
    vat,
    total: round2(subtotal + vat),
    walletCredit: 0,
    amountPaid: tx.amount,
    cta: { label: "View my sessions", href: `${SITE_URL}/student/mentorship` },
  };
}

// ---------------------------------------------------------------------------
// Program instalments
// ---------------------------------------------------------------------------

export function buildInstallmentReceipt(input: {
  email: string;
  name?: string | null;
  programName: string;
  cohortName?: string | null;
  installmentNo: number;
  planLabel: string;
  installmentAmount: number;
  /** Total paid toward the program INCLUDING this instalment. */
  paidToDate: number;
  programTotal: number;
  reference: string;
  verification?: PaystackVerification;
  fallbackPaidAt?: Date;
}): ReceiptData {
  const paidAt = paidAtOf(input.verification ?? null, input.fallbackPaidAt ?? new Date());
  const remaining = round2(Math.max(0, input.programTotal - input.paidToDate));

  return {
    email: input.email,
    name: input.name ?? undefined,
    receiptNumber: receiptNumber(input.reference, paidAt),
    reference: input.reference,
    paidAt,
    paymentMethod: describePaymentMethod(input.verification),
    title: "Program payment",
    lines: [
      {
        label: input.programName,
        detail: [input.cohortName, input.planLabel].filter(Boolean).join(" · ") || undefined,
        amount: input.installmentAmount,
      },
    ],
    discount: 0,
    subtotal: input.installmentAmount,
    vat: 0,
    total: input.installmentAmount,
    walletCredit: 0,
    amountPaid: input.installmentAmount,
    balanceRemaining: remaining > 0 ? remaining : undefined,
    cta: { label: "View my enrollment", href: `${SITE_URL}/student/programs` },
  };
}

// ---------------------------------------------------------------------------
// Tutor promotion fees
// ---------------------------------------------------------------------------

export function buildPromotionReceipt(input: {
  email: string;
  name?: string | null;
  courseTitle: string;
  headline?: string | null;
  fee: number;
  durationDays: number;
  reference: string;
  verification?: PaystackVerification;
  fallbackPaidAt?: Date;
}): ReceiptData {
  const paidAt = paidAtOf(input.verification ?? null, input.fallbackPaidAt ?? new Date());

  return {
    email: input.email,
    name: input.name ?? undefined,
    receiptNumber: receiptNumber(input.reference, paidAt),
    reference: input.reference,
    paidAt,
    paymentMethod: describePaymentMethod(input.verification),
    title: "Promotion fee",
    lines: [
      {
        label: `Course promotion — ${input.headline?.trim() || input.courseTitle}`,
        detail: `${input.durationDays} day${input.durationDays === 1 ? "" : "s"}`,
        amount: input.fee,
      },
    ],
    discount: 0,
    subtotal: input.fee,
    vat: 0,
    total: input.fee,
    walletCredit: 0,
    amountPaid: input.fee,
    cta: { label: "View my promotions", href: `${SITE_URL}/tutor/promotions` },
  };
}

// ---------------------------------------------------------------------------
// Sending. Never throws.
// ---------------------------------------------------------------------------

export async function sendReceipt(data: ReceiptData | null): Promise<void> {
  if (!data) return;
  try {
    const result = await sendPaymentReceiptEmail(data);
    if ("error" in result) {
      console.error(`[receipts] receipt ${data.receiptNumber} failed:`, result.error);
    }
  } catch (error) {
    console.error(`[receipts] receipt ${data.receiptNumber} threw:`, error);
  }
}

/** For the payments recorded on a Transaction. Call only from the request that settled it. */
export async function emailTransactionReceipt(
  transactionId: string,
  verification?: PaystackVerification,
): Promise<void> {
  try {
    await sendReceipt(await buildTransactionReceipt(transactionId, verification));
  } catch (error) {
    console.error("[receipts] could not build the receipt:", error);
  }
}
