import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

/**
 * A generic "money landed in your wallet" notice, for credits that are not a
 * course sale — right now that's a program cohort's earnings being released
 * by an admin, which otherwise only shows up as an in-app notification.
 */

export interface WalletCreditEmailProps {
  name?: string;
  amount: number;
  /** What the credit is for, e.g. "Program cohort earnings — Cycle 6 (26Q3 India)". */
  description: string;
  /** Wallet balance after this credit. */
  newBalance: number;
  walletUrl: string;
}

const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

export const WalletCreditEmail = ({
  name,
  amount,
  description,
  newBalance,
  walletUrl,
}: WalletCreditEmailProps) => {
  const displayName = name?.trim() || "there";

  return (
    <EmailLayout
      preview={`${money(amount)} has been added to your wallet`}
      footerReason="You are receiving this email because of activity on your PalmTechnIQ wallet. You can change which emails you receive in your profile settings.">
      <Text className="mt-[20px] text-[20px] font-bold mb-3">
        💰 Funds added to your wallet
      </Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>
      <Text className="text-base leading-relaxed">{description}</Text>

      <div
        style={{
          backgroundColor: "#f0fdf4",
          borderLeft: "4px solid #16a34a",
          padding: "14px 18px",
          borderRadius: "4px",
          margin: "18px 0",
          color: "#166534",
        }}>
        <p style={{ margin: 0, fontSize: "13px" }}>Amount added</p>
        <p style={{ margin: "4px 0 0 0", fontSize: "26px", fontWeight: "bold" }}>
          {money(amount)}
        </p>
        <p style={{ margin: "6px 0 0 0", fontSize: "13px" }}>
          Wallet balance now: {money(newBalance)}
        </p>
      </div>

      <EmailButton href={walletUrl}>View my wallet</EmailButton>

      <Text className="text-sm text-gray-600 text-center leading-relaxed">
        You can see your balance, your earnings history, and request a
        withdrawal from your wallet at any time.
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default WalletCreditEmail;
