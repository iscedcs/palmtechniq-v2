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
  const domain = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";
  const secureAccountLink = `${domain}/forgot-password`;
  const supportEmail =
    process.env.SUPPORT_EMAIL_ADDRESS || "support@palmtechniq.com";
  const year = new Date().getFullYear();
  const displayName = name?.trim() || email;

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
          <Preview>
            Security Alert: Your PalmTechnIQ password was changed
          </Preview>
        </Head>
        <Body className="w-full">
          <Container className="w-full">
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
              <Text className="mt-[20px] text-[20px] font-bold  mb-3">
                Password Changed
              </Text>
              <Text className="text-gray-800 text-base leading-relaxed">
                Hi, <strong>{displayName}</strong>
              </Text>
              <Text className=" text-base leading-relaxed">
                The password for your PalmTechnIQ account (
                <strong>{email}</strong>) was successfully updated on{" "}
                <strong>{formattedTime}</strong>.
              </Text>

              {/* Activity Details Box */}
              {(ipAddress || userAgent) && (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    margin: "18px 0",
                    fontSize: "13px",
                    color: "#475569",
                    lineHeight: "1.6",
                  }}>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontWeight: "bold",
                      color: "#0f172a",
                    }}>
                    Activity Details:
                  </p>
                  {ipAddress && (
                    <p style={{ margin: "3px 0" }}>
                      • <strong>IP Address:</strong> {ipAddress}
                    </p>
                  )}
                  {userAgent && (
                    <p style={{ margin: "3px 0" }}>
                      • <strong>Device / Browser:</strong> {userAgent}
                    </p>
                  )}
                </div>
              )}

              {/* Guidance: Legitimate change */}
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderLeft: "4px solid #16a34a",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  margin: "16px 0",
                  fontSize: "14px",
                  color: "#166534",
                }}>
                <strong>✅ If you made this change:</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  No further action is required. Your account is now active with
                  your new password.
                </p>
              </div>

              {/* Guidance: Unauthorized change */}
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  borderLeft: "4px solid #dc2626",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  margin: "16px 0 24px 0",
                  fontSize: "14px",
                  color: "#991b1b",
                }}>
                <strong>⚠️ If you did NOT make this change:</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  Your account may have been accessed without your permission.
                  Please secure your account immediately by resetting your
                  password below.
                </p>
              </div>

              {/* CTA Button */}
              <Section className="text-center my-6">
                <Button
                  href={secureAccountLink}
                  className="cursor-pointer rounded-full bg-green-600 text-[14px] font-semibold text-white"
                  style={{
                    backgroundColor: "#16a34a",
                    padding: "12px 28px",
                    margin: "0 auto",
                    display: "inline-block",
                    textDecoration: "none",
                    color: "#ffffff",
                  }}>
                  Secure My Account / Reset Password
                </Button>
              </Section>

              <Text className="text-xs text-gray-500 mt-6 leading-relaxed">
                If you are locked out or need urgent help, contact our security
                team at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: "#16a34a", textDecoration: "underline" }}>
                  {supportEmail}
                </a>
                .
              </Text>

              <Section className="text-left mt-6">
                <span>
                  <Text className="text-gray-700">
                    Thanks, <br />
                    <b>PalmTechnIQ Team</b>
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
                  You are receiving this security notification because an update
                  was made to your PalmTechnIQ account.
                </p>
                <p>
                  Mailing Address: 1st Floor, (Festac Tower) Chicken Republic
                  Building, 22Rd, Festac Town, Lagos, Nigeria.
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

export default PasswordChangedEmail;
