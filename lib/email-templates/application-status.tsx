import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

interface ApplicationStatusEmailProps {
  firstName?: string;
  applicationType: "tutor" | "mentor";
  status: ApplicationStatus;
  adminNote?: string;
  portalUrl?: string;
  supportEmail?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusMeta(status: ApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        badgeBg: "#16a34a", // green-600
        badgeText: "#ffffff",
        icon: "✅",
        headline: "Congratulations — You're In!",
      };
    case "REJECTED":
      return {
        label: "Not Approved",
        badgeBg: "#dc2626", // red-600
        badgeText: "#ffffff",
        icon: "❌",
        headline: "Application Outcome",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Review",
        badgeBg: "#d97706", // amber-600
        badgeText: "#ffffff",
        icon: "🔍",
        headline: "We're Reviewing Your Application",
      };
    default:
      return {
        label: "Pending",
        badgeBg: "#6b7280", // gray-500
        badgeText: "#ffffff",
        icon: "🕐",
        headline: "Application Received",
      };
  }
}

function guidance(
  status: ApplicationStatus,
  applicationType: "tutor" | "mentor",
  portalUrl: string,
) {
  const role = applicationType === "mentor" ? "mentor" : "tutor";
  switch (status) {
    case "APPROVED":
      return {
        body: `Your ${role} application has been reviewed and approved by our team. You now have full access to your ${role} dashboard on PalmTechnIQ.`,
        steps: [
          "Log in to your account and complete your tutor profile",
          "Set your availability and hourly rate",
          "Create your first course or mentorship offering",
          "Watch for onboarding guidance from our team",
        ],
        ctaLabel: "Go to My Dashboard",
        ctaUrl: portalUrl,
      };
    case "REJECTED":
      return {
        body: `Thank you for taking the time to apply as a ${role} on PalmTechnIQ. After careful consideration, we are unable to approve your application at this time.`,
        steps: [
          "Strengthen your portfolio with more project examples",
          "Add certifications or formal teaching evidence",
          "Build additional experience and reapply in the future",
        ],
        ctaLabel: "Visit PalmTechnIQ",
        ctaUrl: portalUrl,
      };
    case "UNDER_REVIEW":
      return {
        body: `Our team is currently reviewing your ${role} application. We take care to thoroughly evaluate every submission to ensure the best experience for our learners.`,
        steps: [
          "Typical review time is 24–48 hours",
          "You may receive a follow-up email if we need more information",
          "No action is required from you at this time",
        ],
        ctaLabel: "Check Application Status",
        ctaUrl: portalUrl,
      };
    default:
      return {
        body: `Your ${role} application has been received successfully and is now in our queue for initial screening.`,
        steps: [
          "We will email you as soon as there is a status update",
          "Ensure your inbox is not filtering our emails to spam",
        ],
        ctaLabel: "Visit PalmTechnIQ",
        ctaUrl: portalUrl,
      };
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

const ApplicationStatusEmail = ({
  firstName = "there",
  applicationType = "tutor",
  status = "UNDER_REVIEW",
  adminNote,
  portalUrl = "https://palmtechniq.com",
  supportEmail = "support@palmtechniq.com",
}: ApplicationStatusEmailProps) => {
  const year = new Date().getFullYear();
  const meta = statusMeta(status);
  const info = guidance(status, applicationType, portalUrl);
  const roleLabel =
    applicationType.charAt(0).toUpperCase() + applicationType.slice(1);
  const previewText = `${meta.icon} Your ${roleLabel} application is ${meta.label} — ${meta.headline}`;

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>{previewText}</Preview>
        </Head>

        <Body className="w-full bg-gray-50 font-sans">
          <Container className="w-full mx-auto max-w-2xl">
            {/* ── Header / Logo ───────────────────────────────────────── */}
            <Section className="bg-[#021A1A] text-center py-8">
              <Img
                className="mx-auto"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="160"
                height="160"
                alt="PalmTechnIQ"
              />
            </Section>

            {/* ── Status Banner ────────────────────────────────────────── */}
            <Section
              style={{ backgroundColor: meta.badgeBg }}
              className="py-6 px-8 text-center">
              <Text
                className="text-2xl font-bold m-0"
                style={{ color: meta.badgeText }}>
                {meta.icon}&nbsp;&nbsp;{meta.headline}
              </Text>
              <Text
                className="text-sm mt-2 mb-0 uppercase tracking-widest font-semibold opacity-90"
                style={{ color: meta.badgeText }}>
                {roleLabel} Application — {meta.label}
              </Text>
            </Section>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-lg font-semibold text-gray-800 mb-1">
                Hi {firstName},
              </Text>

              <Text className="text-base text-gray-700 leading-relaxed mb-6">
                {info.body}
              </Text>

              {/* Admin note (optional) */}
              {adminNote?.trim() && (
                <Section className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Note from our team
                  </Text>
                  <Text className="text-sm text-gray-700 leading-relaxed m-0">
                    {adminNote.trim()}
                  </Text>
                </Section>
              )}

              {/* Next steps */}
              <Section className="bg-blue-50 border-l-4 border-[#021A1A] rounded-lg p-6 mb-6">
                <Text className="text-sm font-semibold text-[#021A1A] uppercase tracking-wider mb-3">
                  {status === "APPROVED" ? "Next Steps" : "What to Expect"}
                </Text>
                {info.steps.map((step, i) => (
                  <Text key={i} className="text-sm text-gray-700 mb-2">
                    {status === "APPROVED" ? `${i + 1}.` : "•"}&nbsp;{step}
                  </Text>
                ))}
              </Section>

              {/* CTA Button */}
              <Section className="text-center my-8">
                <Button
                  href={info.ctaUrl}
                  style={{
                    backgroundColor: meta.badgeBg,
                    color: "#ffffff",
                    padding: "14px 32px",
                    fontSize: "15px",
                    fontWeight: "600",
                    borderRadius: "9999px",
                    display: "inline-block",
                    textDecoration: "none",
                  }}>
                  {info.ctaLabel}
                </Button>
              </Section>

              <Hr className="border-gray-200 my-6" />

              <Text className="text-sm text-gray-600 leading-relaxed">
                Questions? Reply to this email or contact us at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: "#021A1A", fontWeight: 600 }}>
                  {supportEmail}
                </a>
                . We're always happy to help.
              </Text>

              <Text className="text-sm text-gray-600 mt-4">
                Warm regards,
                <br />
                <strong>The PalmTechnIQ Team</strong>
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* ── Footer ───────────────────────────────────────────────── */}
            <Section className="bg-[#021A1A] px-8 py-6">
              <Row>
                <Column align="center">
                  <Text className="text-sm text-white mb-4">
                    Connect With Us
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column align="center">
                  <Button
                    href="https://www.facebook.com/profile.php?id=61561459226438&mibextid=ZbWKwL"
                    className="m-2 rounded-full bg-green-600 p-2">
                    <Img
                      width="20"
                      height="20"
                      alt="Facebook"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-app-round-white-icon.png"
                    />
                  </Button>
                  <Button
                    href="https://www.linkedin.com/company/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2">
                    <Img
                      width="20"
                      height="20"
                      alt="LinkedIn"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png"
                    />
                  </Button>
                  <Button
                    href="https://www.instagram.com/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2">
                    <Img
                      width="20"
                      height="20"
                      alt="Instagram"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png"
                    />
                  </Button>
                </Column>
              </Row>

              <Hr className="border-gray-600 my-6" />

              <Section className="text-center">
                <Text className="text-xs text-gray-400 mb-2">
                  © {year} PalmTechnIQ. All rights reserved.
                </Text>
                <Text className="text-xs text-gray-400 mb-2">
                  You're receiving this because you submitted a {roleLabel}{" "}
                  application on our platform.
                </Text>
                <Text className="text-xs text-gray-400">
                  Festac Tower, Chicken Republic Building, 22nd Road,
                  <br />
                  Festac Town, Lagos, Nigeria
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default ApplicationStatusEmail;
