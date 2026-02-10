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
