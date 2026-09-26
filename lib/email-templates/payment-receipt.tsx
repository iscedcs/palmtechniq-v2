import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

/**
 * PalmTechnIQ's own payment receipt.
 *
 * It replaces the receipt Paystack emails on its own template, so every payer —
 * a student buying a course, a tutor paying a promotion fee, someone paying for a
 * mentorship session or a program — gets the same branded document with the same
 * layout, and it can say things Paystack's cannot: which courses, what was
 * discounted, how much wallet credit was used, what balance is still due.
 *
 * Only figures that apply are shown. A line for VAT, a discount, or wallet credit
 * appears when there is one, never as a row of zeros.
 */

export type ReceiptLine = {
  label: string;
  /** A second, smaller line under the label: the plan, the duration, the seats. */
  detail?: string;
  amount: number;
};

export interface PaymentReceiptEmailProps {
  name?: string;
  receiptNumber: string;
  reference: string;
  /** Already formatted for display, in the payer's own time zone where known. */
  paidAt: string;
  paymentMethod: string;
  /** "Course purchase", "Mentorship session", "Promotion fee" … */
  title: string;
  lines: ReceiptLine[];
  /** Savings already reflected in the line items, shown for information. */
  discount: number;
  subtotal: number;
  /** e.g. "7.5%". Only used when `vat` is above zero. */
  vatRateLabel?: string;
  vat: number;
  total: number;
  /** Wallet credit applied, which reduced the amount charged. */
  walletCredit: number;
  amountPaid: number;
  /** What is still owed, for an instalment plan. */
  balanceRemaining?: number;
  note?: string;
  cta: { label: string; href: string };
  supportEmail?: string;
}

const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

const cell = { padding: "8px 0", fontSize: "14px", color: "#1f2937" } as const;
const label = { ...cell, color: "#475569" } as const;
const amountCell = { ...cell, textAlign: "right", whiteSpace: "nowrap" } as const;

export const PaymentReceiptEmail = ({
  name,
  receiptNumber,
  reference,
  paidAt,
  paymentMethod,
  title,
  lines,
  discount,
  subtotal,
  vatRateLabel,
  vat,
  total,
  walletCredit,
  amountPaid,
  balanceRemaining,
  note,
  cta,
  supportEmail = process.env.SUPPORT_EMAIL_ADDRESS || "support@palmtechniq.com",
}: PaymentReceiptEmailProps) => {
  const displayName = name?.trim() || "there";
  const hasBalance = typeof balanceRemaining === "number" && balanceRemaining > 0.005;

  return (
    <EmailLayout
      preview={`Payment receipt ${receiptNumber} — ${money(amountPaid)}`}
      footerReason="You are receiving this email because a payment was made on PalmTechnIQ. Please keep it as your record of payment.">
      <Text className="mt-[20px] text-[20px] font-bold mb-3">
        ✅ Payment received
      </Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>
      <Text className="text-base leading-relaxed">
        Thank you — we&apos;ve received your payment. Here is your receipt for{" "}
        <strong>{title.toLowerCase()}</strong>.
      </Text>

      {/* Identifying details */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "14px 18px",
          margin: "18px 0",
        }}>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            {[
              ["Receipt no.", receiptNumber],
              ["Date", paidAt],
              ["Paid with", paymentMethod],
              ["Payment reference", reference],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ ...label, padding: "4px 0", fontSize: "13px" }}>{k}</td>
                <td
                  style={{
                    ...cell,
                    padding: "4px 0",
                    fontSize: "13px",
                    textAlign: "right",
                    fontWeight: 600,
                    wordBreak: "break-all",
                  }}>
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* What was paid for */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          {lines.map((line, i) => (
            <tr key={`${line.label}-${i}`} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ ...cell, padding: "10px 12px 10px 0" }}>
                <strong>{line.label}</strong>
                {line.detail ? (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {line.detail}
                  </div>
                ) : null}
              </td>
              <td style={{ ...amountCell, padding: "10px 0" }}>{money(line.amount)}</td>
            </tr>
          ))}

          {discount > 0.005 ? (
            <tr>
              <td style={{ ...label, color: "#166534" }}>Discount applied</td>
              <td style={{ ...amountCell, color: "#166534" }}>−{money(discount)}</td>
            </tr>
          ) : null}

          {vat > 0.005 ? (
            <>
              <tr>
                <td style={label}>Subtotal</td>
                <td style={amountCell}>{money(subtotal)}</td>
              </tr>
              <tr>
                <td style={label}>VAT{vatRateLabel ? ` (${vatRateLabel})` : ""}</td>
                <td style={amountCell}>{money(vat)}</td>
              </tr>
            </>
          ) : null}

          <tr style={{ borderTop: "1px solid #e5e7eb" }}>
            <td style={{ ...cell, fontWeight: 600 }}>Total</td>
            <td style={{ ...amountCell, fontWeight: 600 }}>{money(total)}</td>
          </tr>

          {walletCredit > 0.005 ? (
            <tr>
              <td style={label}>Wallet credit applied</td>
              <td style={amountCell}>−{money(walletCredit)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* The figure that matters */}
      <div
        style={{
          backgroundColor: "#f0fdf4",
          borderLeft: "4px solid #16a34a",
          padding: "14px 18px",
          borderRadius: "4px",
          margin: "18px 0",
          color: "#166534",
        }}>
        <p style={{ margin: "0", fontSize: "13px" }}>Amount paid</p>
        <p style={{ margin: "4px 0 0 0", fontSize: "26px", fontWeight: "bold" }}>
          {money(amountPaid)}
        </p>
      </div>

      {hasBalance ? (
        <div
          style={{
            backgroundColor: "#fffbeb",
            borderLeft: "4px solid #d97706",
            padding: "12px 16px",
            borderRadius: "4px",
            margin: "0 0 18px 0",
            fontSize: "14px",
            color: "#92400e",
            lineHeight: "1.6",
          }}>
          <strong>Balance remaining: {money(balanceRemaining as number)}</strong>
          <p style={{ margin: "4px 0 0 0" }}>
            This payment is part of an instalment plan. The balance is still due.
          </p>
        </div>
      ) : null}

      {note ? (
        <Text className="text-sm text-gray-600 leading-relaxed">{note}</Text>
      ) : null}

      <EmailButton href={cta.href}>{cta.label}</EmailButton>

      <Text className="text-xs text-gray-500 leading-relaxed text-center">
        Questions about this payment? Write to{" "}
        <a href={`mailto:${supportEmail}`} style={{ color: "#16a34a", textDecoration: "underline" }}>
          {supportEmail}
        </a>{" "}
        and quote the receipt number.
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default PaymentReceiptEmail;
