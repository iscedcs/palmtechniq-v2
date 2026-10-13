/**
 * Which kind of money a Transaction row represents, and how to total it.
 *
 * The table holds three different things, and summing them together was how
 * the admin dashboard reported N45M of revenue when about N461K had been
 * collected:
 *
 *   live    A payment that went through Paystack in live mode. The only kind
 *           that is revenue.
 *   legacy  A payment logged by hand before checkout ran through the platform
 *           (reference `course-<slug>-<timestamp>`, tagged
 *           metadata.source = "legacy-manual" by the October 2026 cleanup).
 *           Real money, but historical and not from Paystack.
 *   test    A payment Paystack verified in TEST mode (metadata.verify.domain).
 *           Never real money. paystackVerify now rejects these, so new ones
 *           arrive as FAILED, but the label keeps them out of every total.
 *
 * Like revenue.ts this module is PURE: no `db`, no I/O, so client components
 * can import it for display. The loader that reads the table is in
 * transaction-totals.ts.
 *
 * Amounts are naira, not kobo. Totals are accumulated in kobo and converted
 * back at the end, so adding many floats never drifts.
 */

export type TransactionOrigin = "live" | "legacy" | "test";

export type SummaryStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";

export const SUMMARY_STATUSES: SummaryStatus[] = [
  "COMPLETED",
  "PENDING",
  "FAILED",
  "REFUNDED",
];

export type MoneyBucket = {
  count: number;
  /** What the buyer paid, VAT included. */
  gross: number;
  /** VAT owed onward; not the platform's money. */
  vat: number;
  /** The tutors' combined share, before VAT. */
  tutorShare: number;
  /** The platform's share, before VAT. */
  platformShare: number;
};

export type OriginSummary = Record<SummaryStatus, MoneyBucket>;
export type TransactionSummary = Record<TransactionOrigin, OriginSummary>;

export type ClassifiableTransaction = {
  transactionId?: string | null;
  metadata?: unknown;
};

export type SummarisableTransaction = ClassifiableTransaction & {
  status: string;
  amount: number;
  vatAmount?: number | null;
  tutorShareAmount?: number | null;
  platformShareAmount?: number | null;
};

type Meta = {
  source?: unknown;
  verify?: { domain?: unknown } | null;
} | null;

const LEGACY_REFERENCE = /^course-.+-\d{10,}$/;

export function classifyTransaction(t: ClassifiableTransaction): TransactionOrigin {
  const meta = (t.metadata ?? null) as Meta;

  if (meta?.source === "legacy-manual") return "legacy";
  // A hand-logged row that was never tagged is still legacy. Rows that went
  // through Paystack always carry a verify payload, so it cannot be one.
  if (!meta?.verify && LEGACY_REFERENCE.test(String(t.transactionId ?? ""))) {
    return "legacy";
  }
  if (meta?.verify?.domain === "test") return "test";
  return "live";
}

const toKobo = (naira: number) => Math.round(naira * 100);
const fromKobo = (kobo: number) => kobo / 100;

type KoboBucket = {
  count: number;
  gross: number;
  vat: number;
  tutorShare: number;
  platformShare: number;
};

const emptyKoboBucket = (): KoboBucket => ({
  count: 0,
  gross: 0,
  vat: 0,
  tutorShare: 0,
  platformShare: 0,
});

export function summariseTransactions(
  rows: SummarisableTransaction[],
): TransactionSummary {
  const origins: TransactionOrigin[] = ["live", "legacy", "test"];
  const acc = {} as Record<TransactionOrigin, Record<SummaryStatus, KoboBucket>>;
  for (const origin of origins) {
    acc[origin] = {} as Record<SummaryStatus, KoboBucket>;
    for (const status of SUMMARY_STATUSES) acc[origin][status] = emptyKoboBucket();
  }

  for (const row of rows) {
    if (!SUMMARY_STATUSES.includes(row.status as SummaryStatus)) continue;
    const bucket = acc[classifyTransaction(row)][row.status as SummaryStatus];
    bucket.count += 1;
    bucket.gross += toKobo(row.amount);
    bucket.vat += toKobo(row.vatAmount ?? 0);
    bucket.tutorShare += toKobo(row.tutorShareAmount ?? 0);
    bucket.platformShare += toKobo(row.platformShareAmount ?? 0);
  }

  const out = {} as TransactionSummary;
  for (const origin of origins) {
    out[origin] = {} as OriginSummary;
    for (const status of SUMMARY_STATUSES) {
      const b = acc[origin][status];
      out[origin][status] = {
        count: b.count,
        gross: fromKobo(b.gross),
        vat: fromKobo(b.vat),
        tutorShare: fromKobo(b.tutorShare),
        platformShare: fromKobo(b.platformShare),
      };
    }
  }
  return out;
}

/** Every transaction of one origin, whatever its status. */
export function countByOrigin(summary: TransactionSummary, origin: TransactionOrigin) {
  return SUMMARY_STATUSES.reduce((n, s) => n + summary[origin][s].count, 0);
}
