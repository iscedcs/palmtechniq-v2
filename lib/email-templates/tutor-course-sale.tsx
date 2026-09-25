import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

interface TutorCourseSaleEmailProps {
  name?: string;
  /** One title for a single sale; several when a bundle or cart was bought. */
  courseTitles: string[];
  /** What this sale added to the tutor's wallet, in naira. */
  earned: number;
  walletUrl: string;
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

export const TutorCourseSaleEmail = ({
  name,
  courseTitles,
  earned,
  walletUrl,
}: TutorCourseSaleEmailProps) => {
  const displayName = name?.trim() || "there";
  const many = courseTitles.length > 1;

  return (
    <EmailLayout
      preview={
        many
          ? `${courseTitles.length} of your courses were just purchased — you earned ${formatNaira(earned)}`
          : `Someone just enrolled in "${courseTitles[0]}" — you earned ${formatNaira(earned)}`
      }
      footerReason="You are receiving this email because someone purchased a course you teach on PalmTechnIQ. You can change which emails you receive in your tutor profile settings.">
      <Text className="mt-[20px] text-[20px] font-bold mb-3">
        {many ? "🎉 Your courses were purchased!" : "🎉 You have a new student!"}
      </Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>

      {many ? (
        <>
          <Text className="text-base leading-relaxed">
            Someone just bought {courseTitles.length} of your courses together:
          </Text>
          <ul style={{ margin: "0 0 12px 0", paddingLeft: "20px" }}>
            {courseTitles.map((title) => (
              <li
                key={title}
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#1f2937",
                }}>
                <strong>{title}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Text className="text-base leading-relaxed">
          Someone just enrolled in{" "}
          <strong>&ldquo;{courseTitles[0]}&rdquo;</strong>.
        </Text>
      )}

      {/* Earnings */}
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
          Your earnings from this sale
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

      <EmailButton href={walletUrl}>Check my wallet</EmailButton>

      <Text className="text-sm text-gray-600 text-center leading-relaxed">
        You can see your balance, your earnings history, and request a
        withdrawal from your wallet at any time.
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default TutorCourseSaleEmail;
