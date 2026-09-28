import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

/**
 * The four moments in a wallet withdrawal's life: requested, approved and
 * being sent, paid, or declined. One template, driven by `status`, so the
 * four read as one consistent thread rather than four different-looking
 * emails about the same request.
 */

export type PayoutStatus = "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED";

export interface PayoutStatusEmailProps {
  name?: string;
  amount: number;
  status: PayoutStatus;
  /** The withdrawal request's own id, shown as a reference. */
  reference: string;
  bankName?: string;
  /** Full account number; only the last 4 digits are ever shown. */
  accountNumber?: string;
  /** Admin's note — shown as the reason on a decline, optional elsewhere. */
  reason?: string;
  /** Wallet balance after this event, where the event actually moves it
   * (held at request, returned on decline). Omitted for approve/paid, since
   * the wallet was already debited when the request was made. */
  newBalance?: number;
  walletUrl: string;
  supportEmail?: string;
}

const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

const STATUS_COPY: Record<
  PayoutStatus,
  { emoji: string; heading: string; color: string; bg: string; border: string }
> = {
  REQUESTED: {
    emoji: "⏳",
    heading: "Withdrawal request received",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#d97706",
  },
  PROCESSING: {
    emoji: "🚀",
    heading: "Your payout is on its way",
    color: "#1e3a8a",
    bg: "#eff6ff",
    border: "#2563eb",
  },
  PAID: {
    emoji: "✅",
    heading: "Your payout has been sent",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#16a34a",
  },
  REJECTED: {
    emoji: "⚠️",
    heading: "Your withdrawal request was declined",
    color: "#991b1b",
    bg: "#fef2f2",
    border: "#dc2626",
  },
};

export const PayoutStatusEmail = ({
  name,
  amount,
  status,
  reference,
  bankName,
  accountNumber,
  reason,
  newBalance,
  walletUrl,
  supportEmail = process.env.SUPPORT_EMAIL_ADDRESS || "support@palmtechniq.com",
}: PayoutStatusEmailProps) => {
  const displayName = name?.trim() || "there";
  const copy = STATUS_COPY[status];
  const last4 = accountNumber ? accountNumber.slice(-4) : undefined;

  const bodyText: Record<PayoutStatus, string> = {
    REQUESTED: `We've received your request to withdraw ${money(amount)} from your wallet. It's now awaiting review, and ${money(amount)} has been held aside from your available balance while we process it.`,
    PROCESSING: `Your request to withdraw ${money(amount)} has been approved, and the transfer to your bank account is being processed. This usually clears within a few hours.`,
    PAID: `${money(amount)} has been sent to your bank account${bankName ? ` at ${bankName}` : ""}${last4 ? ` ending in ${last4}` : ""}.`,
    REJECTED: `Your request to withdraw ${money(amount)} could not be processed. The full amount has been returned to your wallet and is available again.`,
  };

  return (
    <EmailLayout
      preview={`${copy.heading} — ${money(amount)}`}
      footerReason="You are receiving this email because of activity on your PalmTechnIQ wallet.">
      <Text className="mt-[20px] text-[20px] font-bold mb-3">
        {copy.emoji} {copy.heading}
      </Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>
      <Text className="text-base leading-relaxed">{bodyText[status]}</Text>

      <div
        style={{
          backgroundColor: copy.bg,
          borderLeft: `4px solid ${copy.border}`,
          padding: "14px 18px",
          borderRadius: "4px",
          margin: "18px 0",
          color: copy.color,
        }}>
        <p style={{ margin: 0, fontSize: "13px" }}>
          {status === "REQUESTED" ? "Amount requested" : "Amount"}
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "26px", fontWeight: "bold" }}>
          {money(amount)}
        </p>
      </div>

      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td
              style={{
                padding: "4px 0",
                fontSize: "13px",
                color: "#475569",
              }}>
              Reference
            </td>
            <td
              style={{
                padding: "4px 0",
                fontSize: "13px",
                textAlign: "right",
                fontWeight: 600,
                color: "#1f2937",
                wordBreak: "break-all",
              }}>
              {reference}
            </td>
          </tr>
          {bankName ? (
            <tr>
              <td style={{ padding: "4px 0", fontSize: "13px", color: "#475569" }}>
                Bank
              </td>
              <td
                style={{
                  padding: "4px 0",
                  fontSize: "13px",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#1f2937",
                }}>
                {bankName}
                {last4 ? ` •••• ${last4}` : ""}
              </td>
            </tr>
          ) : null}
          {typeof newBalance === "number" ? (
            <tr>
              <td style={{ padding: "4px 0", fontSize: "13px", color: "#475569" }}>
                Wallet balance now
              </td>
              <td
                style={{
                  padding: "4px 0",
                  fontSize: "13px",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#1f2937",
                }}>
                {money(newBalance)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {status === "REJECTED" && reason ? (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "18px 0",
          }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Reason given</p>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#1f2937" }}>
            {reason}
          </p>
        </div>
      ) : null}

      <EmailButton href={walletUrl}>View my wallet</EmailButton>

      <Text className="text-xs text-gray-500 leading-relaxed text-center">
        Questions about this payout? Write to{" "}
        <a href={`mailto:${supportEmail}`} style={{ color: "#16a34a", textDecoration: "underline" }}>
          {supportEmail}
        </a>{" "}
        and quote the reference above.
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default PayoutStatusEmail;
