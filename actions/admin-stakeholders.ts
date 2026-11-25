"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateShareTotal } from "@/lib/payments/distribution";
import { paystackListBanks, paystackResolveAccount } from "@/lib/payments/paystack-api";

/**
 * The stakeholder registry: who shares the platform's revenue, at what rate,
 * and where their money is sent.
 *
 * This screen owns the inputs to a distribution run. The run itself is in
 * actions/admin-distributions.ts and is deliberately separate, because the two
 * have different risks: editing the registry changes what FUTURE runs compute,
 * while a run that has been approved is frozen.
 *
 * Three things are worth knowing before changing anything here:
 *
 *  1. Percentages are only checked when a run is computed, not when they are
 *     saved. There is no way to move from one valid split to another without
 *     passing through invalid intermediate states, so saving is permitted and
 *     the running total is shown instead. A run refuses to compute unless the
 *     active rates total exactly 100.
 *  2. Past runs are immune. DistributionShare stores its own sharePercent and
 *     amountKobo, so a rate edited today never rewrites what was already
 *     computed, approved or paid.
 *  3. Stakeholders are retired, not deleted, so historic rows keep a name
 *     against them. Deletion is only allowed for someone who has never
 *     appeared in a run.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user;
}

/** NUBAN account numbers are exactly 10 digits. */
const ACCOUNT_NUMBER = /^\d{10}$/;

type StakeholderInput = {
  name: string;
  role: string;
  sharePercent: number;
  priority: number;
};

function validateDetails(input: StakeholderInput) {
  const name = input.name?.trim();
  const role = input.role?.trim();

  if (!name) return "A name is required.";
  if (!role) return "A role is required.";
  if (!Number.isFinite(input.sharePercent)) return "The share must be a number.";
  if (input.sharePercent < 0 || input.sharePercent > 100) {
    return "The share must be between 0 and 100.";
  }
  if (!Number.isInteger(input.priority) || input.priority < 1) {
    return "Priority must be a whole number, 1 or higher.";
  }
  return null;
}

/**
 * Everyone in the registry, with what they have actually been paid.
 *
 * The total is computed over active stakeholders only, because that is the set
 * a run is validated against. A retired stakeholder's rate is ignored.
 */
export async function listStakeholders() {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const stakeholders = await db.stakeholder.findMany({
    orderBy: [{ isActive: "desc" }, { priority: "asc" }],
    include: {
      shares: {
        select: { amountKobo: true, status: true },
      },
    },
  });

  type ShareRow = { amountKobo: number; status: string };

  /** Explicit, because the Prisma include type does not infer through map. */
  type Row = {
    id: string;
    name: string;
    role: string;
    sharePercent: number;
    priority: number;
    isActive: boolean;
    bankName: string | null;
    bankCode: string | null;
    accountName: string | null;
    accountNumber: string | null;
    recipientCode: string | null;
    notes: string | null;
    paidKobo: number;
    pendingKobo: number;
    runCount: number;
  };

  const rows: Row[] = stakeholders.map((s: (typeof stakeholders)[number]) => {
    const shares = (s.shares ?? []) as ShareRow[];
    const sum = (subset: ShareRow[]) =>
      subset.reduce((total, row) => total + row.amountKobo, 0);

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      sharePercent: s.sharePercent,
      priority: s.priority,
      isActive: s.isActive,
      bankName: s.bankName,
      bankCode: s.bankCode,
      accountName: s.accountName,
      accountNumber: s.accountNumber,
      recipientCode: s.recipientCode,
      notes: s.notes,
      paidKobo: sum(shares.filter((r) => r.status === "PAID")),
      pendingKobo: sum(shares.filter((r) => r.status === "PENDING")),
      runCount: shares.length,
    };
  });

  const active = rows.filter((r) => r.isActive);
  const validity = validateShareTotal(
    active.map((r) => ({
      id: r.id,
      name: r.name,
      sharePercent: r.sharePercent,
      priority: r.priority,
    })),
  );

  // A draft was computed against whatever the rates were at the time. If they
  // have moved since, the draft is stale and has to be recomputed before it is
  // approved, so the screen says so rather than letting it be approved quietly.
  const staleDraft = await db.distribution.findFirst({
    where: { status: "DRAFT" },
    select: { id: true, periodStart: true, computedAt: true },
    orderBy: { periodStart: "desc" },
  });

  return {
    ok: true as const,
    stakeholders: rows,
    // Summed in basis points for the same reason validateShareTotal does it:
    // adding these rates as floats displays 99.99999999999999.
    activeTotal:
      active.reduce((t, r) => t + Math.round(r.sharePercent * 100), 0) / 100,
    validity,
    staleDraft: staleDraft
      ? {
          id: staleDraft.id,
          periodStart: staleDraft.periodStart.toISOString(),
          computedAt: staleDraft.computedAt.toISOString(),
        }
      : null,
  };
}

export async function createStakeholder(input: StakeholderInput) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const invalid = validateDetails(input);
  if (invalid) return { ok: false as const, error: invalid };

  const name = input.name.trim();

  const clash = await db.stakeholder.findFirst({
    where: { name },
    select: { id: true },
  });
  if (clash) {
    return {
      ok: false as const,
      error: `${name} is already in the registry. Edit that entry instead, so past runs stay attached to one person.`,
    };
  }

  const created = await db.stakeholder.create({
    data: {
      name,
      role: input.role.trim(),
      sharePercent: input.sharePercent,
      priority: input.priority,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id };
}

/** Name, role, rate and order. Bank details are saved separately. */
export async function updateStakeholder(
  id: string,
  input: StakeholderInput & { notes?: string | null },
) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const invalid = validateDetails(input);
  if (invalid) return { ok: false as const, error: invalid };

  const existing = await db.stakeholder.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false as const, error: "Stakeholder not found." };

  await db.stakeholder.update({
    where: { id },
    data: {
      name: input.name.trim(),
      role: input.role.trim(),
      sharePercent: input.sharePercent,
      priority: input.priority,
      notes: input.notes?.trim() || null,
    },
  });

  return { ok: true as const };
}

/**
 * Saves a payout account, having first asked Paystack who owns it.
 *
 * The account name is never typed in: it is whatever Paystack resolves, so a
 * transposed digit shows up here as the wrong person's name rather than as a
 * failed or misdirected transfer weeks later.
 */
export async function setStakeholderAccount({
  id,
  bankCode,
  accountNumber,
}: {
  id: string;
  bankCode: string;
  accountNumber: string;
}) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const trimmed = accountNumber.replace(/\s/g, "");
  if (!ACCOUNT_NUMBER.test(trimmed)) {
    return {
      ok: false as const,
      error: "An account number is 10 digits.",
    };
  }
  if (!bankCode) return { ok: false as const, error: "Choose a bank." };

  const stakeholder = await db.stakeholder.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!stakeholder) {
    return { ok: false as const, error: "Stakeholder not found." };
  }

  let banks: Awaited<ReturnType<typeof paystackListBanks>>;
  try {
    banks = await paystackListBanks();
  } catch (error) {
    return {
      ok: false as const,
      error: `Could not read the bank list from Paystack: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  const bank = banks.find((b) => b.code === bankCode);
  if (!bank) {
    return {
      ok: false as const,
      error: "That bank is not in Paystack's list. Reload and choose again.",
    };
  }

  let resolved: Awaited<ReturnType<typeof paystackResolveAccount>>;
  try {
    resolved = await paystackResolveAccount({
      accountNumber: trimmed,
      bankCode,
    });
  } catch (error) {
    // Paystack returns a plain refusal for an account it cannot find, which is
    // the common case here: a wrong digit or the wrong bank.
    return {
      ok: false as const,
      error: `${bank.name} could not confirm that account: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  // The recipient code belongs to the old account number, so it is cleared.
  // It is recreated against the new account when transfers are automated.
  await db.stakeholder.update({
    where: { id },
    data: {
      bankName: bank.name,
      bankCode: bank.code,
      accountNumber: trimmed,
      accountName: resolved.account_name,
      recipientCode: null,
    },
  });

  return { ok: true as const, accountName: resolved.account_name };
}

export async function clearStakeholderAccount(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  await db.stakeholder.update({
    where: { id },
    data: {
      bankName: null,
      bankCode: null,
      accountName: null,
      accountNumber: null,
      recipientCode: null,
    },
  });

  return { ok: true as const };
}

/**
 * Retires or restores a stakeholder.
 *
 * Retiring changes the active total, so it will usually leave the registry
 * short of 100% until the remaining rates are adjusted. That is intended:
 * the alternative is redistributing someone else's share automatically, which
 * is a decision for a person.
 */
export async function setStakeholderActive(id: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const stakeholder = await db.stakeholder.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!stakeholder) {
    return { ok: false as const, error: "Stakeholder not found." };
  }

  // An unpaid share from an approved run is money already committed to this
  // person. Retiring them would hide it from the screen that pays it out.
  if (!isActive) {
    const owed = await db.distributionShare.count({
      where: {
        stakeholderId: id,
        status: "PENDING",
        distribution: { status: "APPROVED" },
      },
    });
    if (owed > 0) {
      return {
        ok: false as const,
        error: `${stakeholder.name} has ${owed} approved share${owed === 1 ? "" : "s"} still to be paid. Pay or reverse those before retiring them.`,
      };
    }
  }

  await db.stakeholder.update({ where: { id }, data: { isActive } });
  return { ok: true as const };
}

/** Only for someone added by mistake who has never been in a run. */
export async function deleteStakeholder(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  const shares = await db.distributionShare.count({
    where: { stakeholderId: id },
  });
  if (shares > 0) {
    return {
      ok: false as const,
      error: `This stakeholder appears in ${shares} distribution run${shares === 1 ? "" : "s"}, so deleting them would leave those rows nameless. Retire them instead.`,
    };
  }

  await db.stakeholder.delete({ where: { id } });
  return { ok: true as const };
}

/** Paystack's bank list, for the account form. */
export async function listBanks() {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Forbidden" };

  try {
    const banks = await paystackListBanks();
    const seen = new Set<string>();
    const unique = banks.filter((b) => {
      if (seen.has(b.code)) return false;
      seen.add(b.code);
      return true;
    });
    return {
      ok: true as const,
      banks: unique
        .map((b) => ({ code: b.code, name: b.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Bank list unavailable",
    };
  }
}
