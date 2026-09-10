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

interface PasswordChangedEmailProps {
  email: string;
  name?: string;
  changedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const PasswordChangedEmail = ({
  email,
  name,
  changedAt,
  ipAddress,
  userAgent,
}: PasswordChangedEmailProps) => {
  const year = new Date().getFullYear();
  const displayName = name?.trim() || email;
  const siteUrl = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";
  const secureAccountLink = `${siteUrl}/forgot-password`;
  const supportEmail =
    process.env.SUPPORT_EMAIL_ADDRESS || "support@palmtechniq.com";

  const formattedTime =
    changedAt ||
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date()) + " UTC";

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>Security Alert: Your PalmTechnIQ password was recently changed</Preview>
        </Head>
        <Body className="w-full bg-[#0a0d14] font-sans text-[#e2e8f0]">
          <Container className="mx-auto my-8 max-w-[540px] rounded-2xl border border-slate-800 bg-[#0f172a] p-8 shadow-2xl">
            {/* Logo */}
            <Section className="text-center pb-4">
              <Img
                className="mx-auto"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="160"
                alt="PalmTechnIQ"
              />
            </Section>

            {/* Main Content */}
            <Section className="pt-2 text-left">
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#fbbf24",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                Security Notification
              </div>

              <Text className="text-xl font-bold text-white mb-2">
                Your Password Was Changed
              </Text>
              <Text className="text-sm text-slate-300 leading-relaxed mb-4">
                Hi <strong>{displayName}</strong>,
              </Text>
              <Text className="text-sm text-slate-300 leading-relaxed mb-4">
                The password for your PalmTechnIQ account (<strong>{email}</strong>) was successfully updated on <strong>{formattedTime}</strong>.
              </Text>

              {/* Details Box */}
              {(ipAddress || userAgent) && (
                <div
                  style={{
                    backgroundColor: "#021A1A",
                    border: "1px solid #1e293b",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  <p style={{ margin: "0 0 4px 0", color: "#e2e8f0", fontWeight: "600" }}>
                    Activity Details:
                  </p>
                  {ipAddress && (
                    <p style={{ margin: "2px 0" }}>
                      • <strong>IP Address:</strong> {ipAddress}
                    </p>
                  )}
                  {userAgent && (
                    <p style={{ margin: "2px 0" }}>
                      • <strong>Device / Browser:</strong> {userAgent}
                    </p>
                  )}
                </div>
              )}

              {/* Scenario 1: User made the change */}
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  borderLeft: "3px solid #10b981",
                  padding: "10px 14px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <Text className="text-xs text-emerald-300 m-0">
                  ✅ <strong>If you made this change:</strong> No further action is required. Your account is now secured with your new password.
                </Text>
              </div>

              {/* Scenario 2: User did NOT make the change */}
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderLeft: "3px solid #ef4444",
                  padding: "12px 14px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                <Text className="text-xs text-red-300 font-semibold m-0 mb-1">
                  ⚠️ If you did NOT make this change:
                </Text>
                <Text className="text-xs text-slate-300 m-0 leading-relaxed">
                  Your account may have been compromised. Please immediately reset your password and secure your account using the button below.
                </Text>
              </div>

              {/* Secure Account CTA Button */}
              <Section className="text-center my-6">
                <Button
                  href={secureAccountLink}
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-500"
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "inline-block",
                  }}
                >
                  Secure My Account / Reset Password
                </Button>
              </Section>

              <Text className="text-xs text-slate-400 mt-4 leading-relaxed">
                If you are unable to access your account, please reach out to our team immediately at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: "#38bdf8", textDecoration: "underline" }}
                >
                  {supportEmail}
                </a>
                .
              </Text>

              <Text className="text-xs text-slate-400 mt-4">
                Best regards,<br />
                <strong className="text-slate-300">PalmTechnIQ Security Team</strong>
              </Text>
            </Section>

            <Hr className="my-6 border-slate-800" />

            {/* Footer */}
            <Section className="text-center text-slate-500 text-xs">
              <Text className="m-0">
                © {year} PalmTechnIQ Inc. All rights reserved.
              </Text>
              <Text className="mt-1 m-0">
                1st Floor, Festac Tower, 22Rd, Festac Town, Lagos, Nigeria.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default PasswordChangedEmail;
