import "server-only";

import { testPaymentsAllowed } from "@/lib/payments/test-mode";

/**
 * Paystack's HTTP API, server-side only.
 *
 * THIS FILE MUST NEVER CARRY `"use server"`, AND MUST NEVER LIVE IN actions/.
 *
 * It used to be actions/paystack.ts with `"use server"` at the top, which
 * makes every exported function a Server Action: a public POST endpoint, as
 * Next's own guidance puts it, "reachable via a direct POST request, not just
 * through your application's UI... even if a Server Action or utility function
 * is not imported elsewhere in your code, it can still be called externally."
 *
 * None of these functions authorises its caller, because none of them was ever
 * meant to face the network. Exposed as actions they were a money-out-the-door
 * chain: paystackCreateTransferRecipient to register an attacker's own bank
 * account, paystackTransfer to send the balance to it, paystackCreateRefund to
 * refund any payment whose reference was known, each bypassing the admin
 * workflow and every ledger reversal behind it.
 *
 * `import "server-only"` is what keeps that from coming back: importing this
 * module from a client component is now a build error rather than a quiet
 * expansion of the attack surface. Authorisation belongs in the callers, which
 * are Server Actions in actions/ and do check it.
 */

const BASE = "https://api.paystack.co";

export type InitPayload = {
  email: string;
  amountKobo: number;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
};

export async function paystackInitialize({
  email,
  amountKobo,
  reference,
  callback_url,
  metadata,
}: InitPayload) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url,
      metadata,
    }),
    keepalive: true,
  });

  const paymentResponse = await res.json();
  console.log("Transaction Initialization Response:", paymentResponse);

  if (!res.ok || !paymentResponse.status) {
    throw new Error(paymentResponse.message || "Paystack initialize failed");
  }

  return paymentResponse.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function paystackVerify(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack verify failed");
  }
  const data = json.data as {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    customer: { email: string };
    /** Paystack reports which key made the payment. */
    domain?: "test" | "live";
    gateway_response?: string;
    authorization?: any;
    metadata?: any;
  };

  // Every caller treats anything but "success" as a failed payment, so
  // downgrading it here keeps test money from enrolling, crediting or counting
  // anywhere. See lib/payments/test-mode.ts.
  if (data.domain === "test" && !testPaymentsAllowed()) {
    console.warn(`[paystack] Rejected test-mode payment ${data.reference}`);
    return {
      ...data,
      status: "failed" as const,
      gateway_response: "Test-mode payment rejected",
    };
  }

  return data;
}

export async function paystackTransfer({
  amountKobo,
  recipientCode,
  reference,
  reason,
}: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}) {
  const res = await fetch(`${BASE}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountKobo,
      recipient: recipientCode,
      reference,
      reason,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack transfer failed");
  }

  return json.data as {
    transfer_code: string;
    reference: string;
    status: "success" | "failed" | "pending";
  };
}

export async function paystackListBanks() {
  const res = await fetch(`${BASE}/bank?currency=NGN`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack bank list failed");
  }

  return (json.data || []) as Array<{
    id: number;
    name: string;
    code: string;
    currency: string;
  }>;
}

export async function paystackResolveAccount({
  accountNumber,
  bankCode,
}: {
  accountNumber: string;
  bankCode: string;
}) {
  const params = new URLSearchParams({
    account_number: accountNumber,
    bank_code: bankCode,
  });
  const res = await fetch(`${BASE}/bank/resolve?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack bank resolve failed");
  }

  return json.data as {
    account_name: string;
    account_number: string;
    bank_id: number;
  };
}

export async function paystackCreateTransferRecipient({
  name,
  accountNumber,
  bankCode,
}: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) {
  const res = await fetch(`${BASE}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack recipient creation failed");
  }

  return json.data as {
    recipient_code: string;
    details?: Record<string, any>;
  };
}

export async function paystackCreateSubaccount({
  businessName,
  settlementBank,
  accountNumber,
  percentageCharge = 0,
  contactEmail,
}: {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge?: number;
  contactEmail?: string;
}) {
  const res = await fetch(`${BASE}/subaccount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: percentageCharge,
      primary_contact_email: contactEmail,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Paystack subaccount creation failed");
  }

  return json.data as {
    subaccount_code: string;
  };
}

/**
 * Create a refund against a settled Paystack transaction.
 *
 * Returns `alreadyRefunded` instead of throwing when Paystack says the
 * transaction has been refunded before. That is not a failure: it is the state
 * we were trying to reach, and it is the normal case when the money was
 * refunded by hand in the Paystack dashboard and the platform is only now
 * catching up on its own records.
 *
 * Paystack processes a refund asynchronously. A successful call here means the
 * refund has been accepted and the amount deducted from the Paystack balance,
 * not that it has landed in the customer's account, which depends on their
 * bank.
 */
export async function paystackCreateRefund({
  reference,
  amountKobo,
  reason,
}: {
  /** The original transaction reference, not a refund id. */
  reference: string;
  /** Omit to refund the full original amount. */
  amountKobo?: number;
  reason?: string;
}): Promise<
  | { ok: true; alreadyRefunded: false; refund: Record<string, any> }
  | { ok: true; alreadyRefunded: true; message: string }
  | { ok: false; error: string }
> {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return { ok: false, error: "PAYSTACK_SECRET_KEY is not set" };
  }

  let res: Response;
  let json: any;
  try {
    res = await fetch(`${BASE}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: reference,
        ...(amountKobo !== undefined ? { amount: amountKobo } : {}),
        ...(reason ? { merchant_note: reason } : {}),
      }),
    });
    json = await res.json();
  } catch (error) {
    // Network failure. Nothing was refunded, so the caller must not record one.
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Could not reach Paystack: ${error.message}`
          : "Could not reach Paystack",
    };
  }

  if (res.ok && json?.status) {
    return { ok: true, alreadyRefunded: false, refund: json.data };
  }

  const message = String(json?.message ?? "Paystack refund failed");
  if (/already|duplicate|refunded/i.test(message)) {
    return { ok: true, alreadyRefunded: true, message };
  }

  return { ok: false, error: message };
}
