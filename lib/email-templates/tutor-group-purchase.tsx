import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

/**
 * The two emails a tutor gets about a group purchase of their course.
 *
 *   STARTED   — a student has paid for the group. The tutor is credited now,
 *               and is told what will be taken from their wallet if the group
 *               fills.
 *   COMPLETED — the last seat filled and the cashback has been deducted from
 *               the tutor's wallet.
 *
 * The cashback is funded by the tutor, so both emails say so plainly: a
 * balance that rises and then falls with no explanation is what this exists to
 * prevent.
 */
export type GroupEmailVariant = "STARTED" | "COMPLETED";

interface TutorGroupPurchaseEmailProps {
  variant: GroupEmailVariant;
  name?: string;
  courseTitle: string;
  memberLimit: number;
  /** What this payment added to the tutor's wallet. STARTED only. */
  earned?: number;
  /** The group's total cashback; 0 when the tier has none. */
  cashbackTotal: number;
  walletUrl: string;
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

export const TutorGroupPurchaseEmail = ({
  variant,
  name,
  courseTitle,
  memberLimit,
  earned,
  cashbackTotal,
  walletUrl,
}: TutorGroupPurchaseEmailProps) => {
  const displayName = name?.trim() || "there";
  const hasCashback = cashbackTotal > 0;
  const started = variant === "STARTED";

  return (
    <EmailLayout
      preview={
        started
          ? `A group purchase for "${courseTitle}" has started`
          : `Your group for "${courseTitle}" is complete`
      }
      footerReason="You are receiving this email because a group purchase was made for a course you teach on PalmTechnIQ. You can change which emails you receive in your tutor profile settings.">
      <Text className="mt-[20px] text-[20px] font-bold mb-3">
        {started ? "🎉 A group purchase has started" : "✅ Your group is complete"}
      </Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>

      {started ? (
        <Text className="text-base leading-relaxed">
          Someone just started a group purchase for{" "}
          <strong>&ldquo;{courseTitle}&rdquo;</strong>. The group has{" "}
          <strong>{memberLimit} seats</strong>, and they&apos;ll share an
          invite link to fill them.
        </Text>
      ) : (
        <Text className="text-base leading-relaxed">
          All <strong>{memberLimit} seats</strong> for{" "}
          <strong>&ldquo;{courseTitle}&rdquo;</strong> are filled, and every
          member now has access to the course.
        </Text>
      )}

      {/* Earnings — at payment time only */}
      {started && typeof earned === "number" ? (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            borderLeft: "4px solid #16a34a",
            padding: "14px 18px",
            borderRadius: "4px",
            margin: "18px 0",
            color: "#166534",
          }}>
          <p style={{ margin: "0", fontSize: "13px" }}>
            Your earnings from this purchase
          </p>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "26px",
              fontWeight: "bold",
            }}>
            {formatNaira(earned)}
          </p>
          <p style={{ margin: "6px 0 0 0", fontSize: "13px" }}>
            This has been added to your wallet balance.
          </p>
        </div>
      ) : null}

      {/* The cashback — the part a tutor most needs to see */}
      {hasCashback ? (
        <div
          style={{
            backgroundColor: "#fffbeb",
            borderLeft: "4px solid #d97706",
            padding: "12px 16px",
            borderRadius: "4px",
            margin: "18px 0",
            fontSize: "14px",
            color: "#92400e",
            lineHeight: "1.6",
          }}>
          {started ? (
            <>
              <strong>About the group cashback.</strong>
              <p style={{ margin: "4px 0 0 0" }}>
                If all {memberLimit} seats fill, the group&apos;s cashback of{" "}
                <strong>{formatNaira(cashbackTotal)}</strong> is paid to the
                student who started the group, and it is funded from your
                wallet. Please keep at least that much in your wallet until the
                group completes so it can go through.
              </p>
            </>
          ) : (
            <>
              <strong>{formatNaira(cashbackTotal)} was deducted from your wallet.</strong>
              <p style={{ margin: "4px 0 0 0" }}>
                That is the group&apos;s cashback, paid to the student who
                started the group. You can see the entry in your wallet
                history.
              </p>
            </>
          )}
        </div>
      ) : null}

      <EmailButton href={walletUrl}>Check my wallet</EmailButton>

      <Text className="text-sm text-gray-600 text-center leading-relaxed">
        You can see your balance and your full wallet history at any time.
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default TutorGroupPurchaseEmail;
