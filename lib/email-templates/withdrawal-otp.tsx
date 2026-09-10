import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

interface WithdrawalOtpEmailProps {
  email: string;
  name?: string;
  amount: number;
  otpCode: string;
  expiresInMinutes?: number;
  bankName?: string;
  accountNumber?: string;
}

export const WithdrawalOtpEmail = ({
  email,
  name,
  amount,
  otpCode,
  expiresInMinutes = 10,
  bankName,
  accountNumber,
}: WithdrawalOtpEmailProps) => {
  const year = new Date().getFullYear();
  const displayName = name?.trim() || email;
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>{otpCode} is your authorization code for withdrawal of {formattedAmount}</Preview>
        </Head>
        <Body className="w-full bg-gray-50 font-sans">
          <Container className="w-full mx-auto max-w-2xl bg-white my-8 rounded-xl overflow-hidden shadow-sm">
            {/* Header with Logo */}
            <Section className="bg-[#021A1A] text-center py-6">
              <Img
                className="mx-auto h-full object-cover py-2"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="200"
                height="200"
                alt="PalmTechnIQ Logo"
              />
            </Section>

            {/* Main Content */}
            <Section className="px-8 py-6">
              <Text className="text-2xl font-bold text-[#021A1A] mb-3">
                Authorize Wallet Withdrawal
              </Text>
              <Text className="text-gray-800 text-base leading-relaxed">
                Hi, <strong>{displayName}</strong>
              </Text>
              <Text className="text-gray-700 text-base leading-relaxed">
                A payout withdrawal request was initiated from your PalmTechnIQ tutor wallet. To authorize this transaction, enter the security verification code below:
              </Text>

              {/* Transaction Snapshot Box */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  margin: "18px 0",
                  fontSize: "14px",
                  color: "#334155",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#64748b" }}>Withdrawal Amount:</span>
                  <strong style={{ color: "#021A1A", fontSize: "16px" }}>{formattedAmount}</strong>
                </div>
                {bankName && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#64748b" }}>Destination Bank:</span>
                    <strong>{bankName}</strong>
                  </div>
                )}
                {accountNumber && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Account Number:</span>
                    <span style={{ fontFamily: "monospace" }}>•••• {accountNumber.slice(-4)}</span>
                  </div>
                )}
              </div>

              {/* OTP Box */}
              <div
                style={{
                  background: "#021A1A",
                  border: "2px solid #16a34a",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#22c55e",
                  margin: "24px 0",
                  fontFamily: "monospace",
                }}
              >
                {otpCode}
              </div>

              <Text className="text-xs text-gray-500 mt-2">
                ⏱️ This authorization code is valid for <strong>{expiresInMinutes} minutes</strong>.
              </Text>

              {/* Security Warning */}
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  borderLeft: "4px solid #dc2626",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  margin: "20px 0",
                  fontSize: "13px",
                  color: "#991b1b",
                }}
              >
                <strong>⚠️ Did NOT request this withdrawal?</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  Do not share this code. Please immediately change your account password and contact our security team at{" "}
                  <a href="mailto:security@palmtechniq.com" style={{ color: "#dc2626", textDecoration: "underline" }}>
                    security@palmtechniq.com
                  </a>.
                </p>
              </div>

              <Section className="text-left mt-6">
                <span>
                  <Text className="text-gray-700">
                    Thanks, <br />
                    <b>PalmTechnIQ Security Team</b>
                  </Text>
                </span>
              </Section>
            </Section>

            <Hr className="mt-[20px] border-gray-200" />

            {/* Footer */}
            <Section className="text-center text-[#333333] px-6 py-2 text-xs">
              <Text>
                <p>Copyright © {year} PalmTechnIQ, All Rights Reserved.</p>
                <p>
                  Mailing Address: 1st Floor, (Festac Tower) Chicken Republic Building, 22Rd, Festac Town, Lagos, Nigeria.
                </p>
              </Text>
            </Section>

            {/* Social Icons */}
            <Section className="pb-[30px] text-center">
              <Button
                href="https://www.facebook.com/profile.php?id=61561459226438&mibextid=ZbWKwL"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ Facebook"
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-app-round-white-icon.png"
                />
              </Button>
              <Button
                href="https://www.linkedin.com/company/palmtechniq/"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ LinkedIn"
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png"
                />
              </Button>
              <Button
                href="https://www.instagram.com/palmtechniq/"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ Instagram"
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png"
                />
              </Button>
              <Button
                href="https://app.slack.com/client/T076LDT7109/C0764SE3VB7"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ Slack"
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/slack-icon.png"
                />
              </Button>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default WithdrawalOtpEmail;
