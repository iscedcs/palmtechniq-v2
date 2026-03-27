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
  Row,
  Column,
} from "@react-email/components";
import React from "react";

interface EnrollmentConfirmationProps {
  fullName?: string;
  email?: string;
  programName?: string;
  cohortName?: string;
  learningMode?: string;
  paymentPlan?: string;
  amountPaid?: number;
  totalAmount?: number;
  status?: string;
  isNewAccount?: boolean;
  tempPassword?: string;
  resetLink?: string;
  loginUrl?: string;
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

const EnrollmentConfirmation = ({
  fullName = "there",
  email = "",
  programName = "Professional Program",
  cohortName = "",
  learningMode = "Virtual",
  paymentPlan = "FULL",
  amountPaid = 0,
  totalAmount = 0,
  status = "FIRST_INSTALLMENT_PAID",
  isNewAccount = false,
  tempPassword,
  resetLink,
  loginUrl,
}: EnrollmentConfirmationProps) => {
  const domain = process.env.NEXT_PUBLIC_URL || "https://palmtechniq.com";
  const year = new Date().getFullYear();
  const isFullyPaid = status === "FULLY_PAID";
  const isInstallment = paymentPlan === "INSTALLMENT";
  const balanceRemaining = totalAmount - amountPaid;

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>Enrollment Confirmed — {programName} | PalmTechnIQ</Preview>
        </Head>
        <Body className="w-full bg-gray-50">
          <Container className="w-full mx-auto max-w-2xl">
            {/* Header with Logo */}
            <Section className="bg-[#021A1A] text-center py-8">
              <Img
                className="mx-auto"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="200"
                height="200"
                alt="PalmTechnIQ Logo"
              />
            </Section>

            {/* Confirmation Banner */}
            <Section className="bg-green-600 text-center py-6">
              <Text className="text-white text-2xl font-bold m-0">
                ✅ Enrollment Confirmed!
              </Text>
              <Text className="text-green-100 text-sm m-0 mt-2">
                Your spot has been secured
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Hi {fullName},
              </Text>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                Great news! Your enrollment in <b>{programName}</b> has been
                confirmed. We're excited to have you on board for this
                transformative learning experience.
              </Text>

              {/* Enrollment Details */}
              <Section className="bg-gray-50 rounded-lg p-6 my-6 border border-gray-200">
                <Text className="text-lg font-semibold text-[#021A1A] mb-4">
                  Enrollment Details
                </Text>

                <Row className="mb-2">
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">Program</Text>
                    <Text className="text-sm font-semibold text-gray-800 m-0 mt-1">
                      {programName}
                    </Text>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">Cohort</Text>
                    <Text className="text-sm font-semibold text-gray-800 m-0 mt-1">
                      {cohortName}
                    </Text>
                  </Column>
                </Row>

                <Hr className="border-gray-200 my-4" />

                <Row className="mb-2">
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">
                      Learning Mode
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800 m-0 mt-1">
                      {learningMode === "VIRTUAL" ? "Virtual" : "Physical"}
                    </Text>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">
                      Payment Plan
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800 m-0 mt-1">
                      {isInstallment ? "Installment (70/30)" : "Full Payment"}
                    </Text>
                  </Column>
                </Row>

                <Hr className="border-gray-200 my-4" />

                <Row>
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">
                      Amount Paid
                    </Text>
                    <Text className="text-base font-bold text-green-600 m-0 mt-1">
                      {formatNaira(amountPaid)}
                    </Text>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-sm text-gray-500 m-0">
                      Total Program Fee
                    </Text>
                    <Text className="text-base font-bold text-gray-800 m-0 mt-1">
                      {formatNaira(totalAmount)}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Balance Notice for Installment */}
              {isInstallment && !isFullyPaid && (
                <Section className="bg-amber-50 rounded-lg p-5 my-4 border-l-4 border-amber-500">
                  <Text className="text-sm font-semibold text-amber-800 m-0 mb-2">
                    Outstanding Balance
                  </Text>
                  <Text className="text-sm text-amber-700 m-0">
                    You have a remaining balance of{" "}
                    <b>{formatNaira(balanceRemaining)}</b> (30%) due before your
                    cohort starts. We'll send you a reminder closer to the due
                    date.
                  </Text>
                </Section>
              )}

              {/* Account Credentials (new users only) */}
              {isNewAccount && (
                <Section className="bg-green-50 rounded-lg p-6 my-6 border border-green-200">
                  <Text className="text-lg font-semibold text-[#021A1A] mb-3">
                    🔐 Your PalmTechnIQ Account
                  </Text>
                  <Text className="text-sm text-gray-700 mb-3">
                    We've created your account so you can access your learning
                    dashboard. Here are your temporary login credentials:
                  </Text>

                  <Section className="bg-white rounded-md p-4 border border-green-100">
                    <Text className="text-sm text-gray-600 m-0 mb-1">
                      <b>Email:</b> {email}
                    </Text>
                    {tempPassword && (
                      <Text className="text-sm text-gray-600 m-0">
                        <b>Temporary Password:</b>{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                            backgroundColor: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}>
                          {tempPassword}
                        </span>
                      </Text>
                    )}
                  </Section>

                  <Text className="text-xs text-red-600 font-semibold mt-3 mb-3">
                    ⚠️ For security, please change your password immediately
                    after your first login.
                  </Text>

                  {resetLink && (
                    <Section className="text-center mt-2">
                      <Button
                        href={resetLink}
                        className="cursor-pointer rounded-full bg-[#021A1A] text-white font-semibold"
                        style={{
                          padding: "12px 28px",
                          fontSize: "14px",
                          display: "inline-block",
                        }}>
                        Set Your Own Password
                      </Button>
                    </Section>
                  )}

                  {loginUrl && (
                    <Text className="text-xs text-gray-500 text-center mt-3 m-0">
                      Or log in directly at{" "}
                      <a href={loginUrl} style={{ color: "#16a34a" }}>
                        {loginUrl}
                      </a>
                    </Text>
                  )}
                </Section>
              )}

              {/* Next Steps */}
              <Section className="bg-blue-50 rounded-lg p-6 my-6 border-l-4 border-green-600">
                <Text className="text-lg font-semibold text-[#021A1A] mb-3">
                  What Happens Next?
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ You'll receive onboarding details before your cohort starts
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ Join our community to connect with fellow learners
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ Prepare your workspace and tools for the program
                </Text>
                <Text className="text-sm text-gray-700">
                  ✓ Our team will reach out with your class schedule
                </Text>
              </Section>

              {/* CTA Button */}
              <Section className="text-center my-8">
                <Button
                  href={`${domain}/courses`}
                  className="cursor-pointer rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  style={{
                    padding: "14px 32px",
                    fontSize: "16px",
                    display: "inline-block",
                  }}>
                  Explore More Courses
                </Button>
              </Section>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                If you have any questions about your enrollment, don't hesitate
                to reach out to our team. We're here to help!
              </Text>

              <Text className="text-sm text-gray-600">
                Best regards,
                <br />
                <b>Ignatius Emeka J</b>
                <br />
                <b>Head Of Academy</b>
              </Text>
            </Section>

            {/* Footer Divider */}
            <Hr className="border-gray-200 my-0" />

            {/* Footer */}
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
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="Facebook"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-app-round-white-icon.png"
                    />
                  </Button>

                  <Button
                    href="https://www.linkedin.com/company/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="LinkedIn"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png"
                    />
                  </Button>

                  <Button
                    href="https://www.instagram.com/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="Instagram"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png"
                    />
                  </Button>

                  <Button
                    href="https://app.slack.com/client/T076LDT7109/C0764SE3VB7"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="Slack"
                      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/slack-icon.png"
                    />
                  </Button>
                </Column>
              </Row>

              <Hr className="border-gray-600 my-6" />

              <Section className="text-center">
                <Text className="text-xs text-gray-400 mb-2">
                  Copyright © {year} PalmTechnIQ. All rights reserved.
                </Text>
                <Text className="text-xs text-gray-400 mb-2">
                  You're receiving this email because you enrolled in a
                  professional program on our platform.
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

export default EnrollmentConfirmation;
