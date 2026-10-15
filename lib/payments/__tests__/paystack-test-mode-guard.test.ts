import { afterEach, describe, expect, it, vi } from "vitest";

import { paystackVerify } from "@/actions/paystack";

const verifyResponse = (domain: "test" | "live") => ({
  ok: true,
  json: async () => ({
    status: true,
    data: {
      status: "success",
      reference: "ps_abc",
      amount: 537500,
      currency: "NGN",
      paid_at: "2026-10-13T10:00:00.000Z",
      channel: "card",
      customer: { email: "a@b.co" },
      domain,
    },
  }),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("paystackVerify test-mode guard", () => {
  it("passes a live payment through as success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse("live")));
    const v = await paystackVerify("ps_abc");
    expect(v.status).toBe("success");
  });

  it("downgrades a test-mode payment to failed, so nothing is credited", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse("test")));
    const v = await paystackVerify("ps_abc");
    expect(v.status).toBe("failed");
    expect(v.domain).toBe("test");
    expect(v.gateway_response).toBe("Test-mode payment rejected");
  });

  it("lets a test-mode payment through only when explicitly allowed", async () => {
    vi.stubEnv("ALLOW_TEST_PAYMENTS", "true");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse("test")));
    const v = await paystackVerify("ps_abc");
    expect(v.status).toBe("success");
  });

  it("does not treat any other value of the setting as permission", async () => {
    vi.stubEnv("ALLOW_TEST_PAYMENTS", "1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse("test")));
    const v = await paystackVerify("ps_abc");
    expect(v.status).toBe("failed");
  });
});
