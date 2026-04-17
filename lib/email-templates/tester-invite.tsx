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

interface TesterInviteProps {
  name: string;
  email: string;
  tempPassword: string;
}

const TesterInvite = ({
  name = "there",
  email = "",
  tempPassword = "",
}: TesterInviteProps) => {
  const domain = process.env.NEXT_PUBLIC_URL || "https://palmtechniq.com";
  const loginUrl = `${domain}/login`;
  const year = new Date().getFullYear();

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>
            You&apos;ve been invited to access PalmTechnIQ Documentation
          </Preview>
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

            {/* Main Content */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-center text-2xl font-bold text-[#021A1A] mb-6">
                Documentation Access Invitation
              </Text>

              <Text className="text-lg text-gray-800 mb-4">
                Hi {name},
              </Text>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                You&apos;ve been invited to access the PalmTechnIQ project
                documentation. Below are your temporary login credentials.
              </Text>

              {/* Credentials Box */}
              <Section className="bg-gray-50 rounded-lg p-6 my-6 border border-gray-200">
                <Text className="text-sm font-semibold text-gray-600 mb-2">
                  Your Login Credentials
                </Text>
                <Text className="text-base text-gray-800 mb-1">
                  <strong>Email:</strong> {email}
                </Text>
                <Text className="text-base text-gray-800 mb-0">
                  <strong>Temporary Password:</strong> {tempPassword}
                </Text>
              </Section>

              {/* Warning */}
              <Section className="bg-amber-50 rounded-lg p-4 my-6 border-l-4 border-amber-400">
                <Text className="text-sm text-amber-800 mb-0">
                  <strong>Important:</strong> You will be required to change
                  your password upon first login. This temporary password will
                  no longer work after that.
                </Text>
              </Section>

              {/* CTA Button */}
              <Section className="text-center my-8">
                <Button
                  href={loginUrl}
                  className="cursor-pointer rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  style={{
                    padding: "14px 32px",
                    fontSize: "16px",
                    display: "inline-block",
                  }}>
                  Sign In Now
                </Button>
              </Section>

              <Text className="text-sm text-gray-500 mb-4 leading-relaxed">
                If you did not expect this invitation, please disregard this
                email.
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="border-gray-200 my-0" />

            <Section className="bg-[#021A1A] px-8 py-6">
              <Row>
                <Column align="center">
                  <Text className="text-sm text-white mb-4">
                    PalmTechnIQ
                  </Text>
                </Column>
              </Row>

              <Hr className="border-gray-600 my-4" />

              <Section className="text-center">
                <Text className="text-xs text-gray-400 mb-2">
                  Copyright &copy; {year} PalmTechnIQ. All rights reserved.
                </Text>
                <Text className="text-xs text-gray-400">
                  This is an automated invitation email. Please do not share
                  your credentials with anyone.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default TesterInvite;
