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

import { ORG_ADDRESS_LINE } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site";

/**
 * The standard PalmTechnIQ email frame: dark-teal logo header, content area,
 * footer, social icons.
 *
 * WHY THIS EXISTS
 *
 * Every existing template carries its own copy of this header and footer —
 * about 100 lines each — and the mailing address inside them had drifted from
 * the Business Profile in ten of them. The look is reproduced here exactly, so
 * emails built on it are indistinguishable from the rest, but the frame is
 * written once and the address comes from the same constant the website uses.
 *
 * New templates should build on this. Migrating the older ones is a mechanical
 * change that has deliberately not been folded into the work that added this.
 */
export function EmailLayout({
  preview,
  footerReason,
  children,
}: {
  /** The grey snippet shown beside the subject in an inbox. */
  preview: string;
  /** Why this person is getting the email — the line above the address. */
  footerReason: string;
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>{preview}</Preview>
        </Head>
        <Body className="w-full">
          <Container className="w-full">
            {/* Header with Logo */}
            <Section className="bg-[#021A1A] text-center py-6">
              <Img
                className="mx-auto h-full object-cover py-2"
                src={`${SITE_URL}/assets/palmtechniqlogo.png`}
                width="200"
                height="200"
                alt="PalmTechnIQ Logo"
              />
            </Section>

            {/* Main Content */}
            <Section className="px-8 py-6">{children}</Section>

            <Hr className="mt-[20px] border-gray-200" />

            {/* Footer */}
            <Section className="text-center text-[#333333] px-6 py-2 text-xs">
              <Text>
                <p>Copyright © {year} PalmTechnIQ, All Rights Reserved.</p>
                <p>{footerReason}</p>
                <p>Mailing Address: {ORG_ADDRESS_LINE}</p>
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
}

/** The green pill button every template uses for its main action. */
export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section className="text-center my-6">
      <Button
        href={href}
        className="cursor-pointer rounded-full bg-green-600 text-[14px] font-semibold text-white"
        style={{
          backgroundColor: "#16a34a",
          padding: "12px 28px",
          margin: "0 auto",
          display: "inline-block",
          textDecoration: "none",
          color: "#ffffff",
        }}>
        {children}
      </Button>
    </Section>
  );
}

/** The "Thanks, PalmTechnIQ Team" sign-off. */
export function EmailSignOff() {
  return (
    <Section className="text-left mt-6">
      <span>
        <Text className="text-gray-700">
          Thanks, <br />
          <b>PalmTechnIQ Team</b>
        </Text>
      </span>
    </Section>
  );
}
