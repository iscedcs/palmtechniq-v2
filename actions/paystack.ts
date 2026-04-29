"use server";

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
  return json.data as {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    customer: { email: string };
    authorization?: any;
    metadata?: any;
  };
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
