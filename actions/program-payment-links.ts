"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import {
  createProgramPaymentLinkSchema,
  type CreateProgramPaymentLinkInput,
} from "@/schemas/payment-link";
import {
  buildPaymentLinkAllocation,
  ensureProgramsAndCohorts,
  getProgramPaymentLinkForPayment,
  beginProgramPaymentLinkPayment,
  verifyProgramPaymentLinkPayment,
} from "@/lib/payments/program-payment-link";
import { SITE_URL } from "@/lib/site";
import { getAvailableCohorts } from "@/lib/cohort";
import { PROGRAMS } from "@/data/programs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session;
}

/**
 * Create a payment link for a negotiated multi-program deal. Quotes are never
 * edited in place — cancel + recreate keeps the audit trail of what the
 * client was quoted.
 */
export async function createProgramPaymentLink(data: CreateProgramPaymentLinkInput) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Forbidden" };

  const parsed = createProgramPaymentLinkSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || "Invalid data",
    };
  }

  const form = parsed.data;

  const allocation = buildPaymentLinkAllocation(form.items, form.amount);
  if (!allocation.ok) return { ok: false as const, error: allocation.error };

  const expiresAt = form.expiresAt ? new Date(form.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { ok: false as const, error: "Invalid expiry date" };
  }

  let resolved;
  try {
    resolved = await ensureProgramsAndCohorts(form.items);
  } catch (err: any) {
    return { ok: false as const, error: err?.message || "Invalid program or cohort" };
  }

  const token = randomBytes(24).toString("base64url");

  const link = await db.programPaymentLink.create({
    data: {
      token,
      createdById: session.user.id,
      studentName: form.studentName,
      email: form.email,
      phone: form.phone || null,
      note: form.note || null,
      amount: form.amount,
      learningMode: form.learningMode,
      expiresAt,
      items: {
        create: form.items.map((item, i) => ({
          programId: resolved[i].programId,
          cohortId: resolved[i].cohortId,
          amount: allocation.allocations[i].amount,
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath("/admin/finance/payment-links");

  return {
    ok: true as const,
    id: link.id,
    token: link.token,
    url: `${SITE_URL}/pay/${link.token}`,
  };
}

/** Every link with its programs, for the admin table. */
export async function getProgramPaymentLinks() {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Forbidden" };

  const links = await db.programPaymentLink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      items: {
        include: {
          program: { select: { name: true, fullPrice: true, slug: true } },
          cohort: {
            select: { displayName: true, cycleNumber: true, year: true, month: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const now = new Date();

  return {
    ok: true as const,
    links: links.map((link: any) => ({
      id: link.id,
      token: link.token,
      url: `${SITE_URL}/pay/${link.token}`,
      studentName: link.studentName,
      email: link.email,
      phone: link.phone,
      note: link.note,
      amount: link.amount,
      learningMode: link.learningMode,
      status:
        link.status === "ACTIVE" && link.expiresAt && link.expiresAt < now
          ? ("EXPIRED" as const)
          : link.status,
      createdBy: link.createdBy,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      paidAt: link.paidAt ? link.paidAt.toISOString() : null,
      items: link.items.map((item: any) => ({
        programSlug: item.program.slug,
        programName: item.program.name,
        cohortName: item.cohort.displayName,
        cohortValue: `${item.cohort.cycleNumber}-${item.cohort.year}-${String(item.cohort.month).padStart(2, "0")}`,
        listPrice: item.program.fullPrice,
        amount: item.amount,
      })),
    })),
  };
}

/** Programs + cohorts for the create form. */
export async function getPaymentLinkFormOptions() {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Forbidden" };

  return {
    ok: true as const,
    programs: PROGRAMS.map((p) => ({
      slug: p.slug,
      name: p.name,
      durationLabel: p.durationLabel,
      fullPrice: p.fullPrice,
    })),
    cohorts: getAvailableCohorts().map((c) => ({
      value: c.value,
      label: c.displayName,
      startDate: c.startDate.toISOString(),
    })),
  };
}

/** Cancel an outstanding quote. Paid links are immutable financial records. */
export async function cancelProgramPaymentLink(id: string) {
  const session = await requireAdmin();
  if (!session) return { ok: false as const, error: "Forbidden" };

  const link = await db.programPaymentLink.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!link) return { ok: false as const, error: "Link not found" };
  if (link.status !== "ACTIVE") {
    return { ok: false as const, error: "Only active links can be cancelled" };
  }

  await db.programPaymentLink.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/finance/payment-links");
  return { ok: true as const };
}

// ── Public (no auth — the payer may not have an account yet) ────────────────

export async function getPublicPaymentLink(token: string) {
  return getProgramPaymentLinkForPayment(token);
}

export async function verifyProgramPaymentLink(reference: string) {
  return verifyProgramPaymentLinkPayment(reference);
}

export async function beginProgramPaymentLinkCheckout(token: string) {
  const result = await beginProgramPaymentLinkPayment(token);
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  redirect(result.authorizationUrl);
}
