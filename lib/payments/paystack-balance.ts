import "server-only";

const BASE = "https://api.paystack.co";

export type PaystackBalanceResult =
  | { ok: true; naira: number }
  | { ok: false; error: string };

/**
 * The NGN balance in the Paystack account, in naira. Read-only.
 *
 * Never throws: callers use it for display and for a pre-flight check, and
 * neither should fail just because Paystack is slow or unreachable. This is a
 * plain server-only module on purpose, not part of the "use server" actions in
 * actions/paystack.ts, so it cannot be invoked as an endpoint from the browser.
 */
export async function getPaystackBalance(): Promise<PaystackBalanceResult> {
  try {
    const res = await fetch(`${BASE}/balance`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { currency: string; balance: number }[];
    };

    if (!res.ok || !json.status || !Array.isArray(json.data)) {
      return { ok: false, error: json.message || "Paystack balance unavailable" };
    }

    const ngn = json.data.find((b) => b.currency === "NGN");
    if (!ngn) return { ok: false, error: "No NGN balance on this Paystack account" };

    // Paystack reports balances in kobo.
    return { ok: true, naira: ngn.balance / 100 };
  } catch (error) {
    console.error("[paystack] balance lookup failed:", error);
    return { ok: false, error: "Could not reach Paystack" };
  }
}
