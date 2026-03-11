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

interface WelcomeProps {
  fullName?: string;
}

const Welcome = ({ fullName = "there" }: WelcomeProps) => {
  const domain = process.env.NEXT_PUBLIC_URL || "https://palmtechniq.com";
  const year = new Date().getFullYear();
  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>
            Welcome to PalmTechnIQ - Your Learning Journey Starts Here
          </Preview>
        </Head>
        <Body className="w-full bg-gray-50">
          <Container className="w-full mx-auto max-w-2xl">
            {/* Header with Logo */}
            <Section className="bg-[#021A1A] text-center py-8">
              <Img
                className="mx-auto"
                src={`https://www.palmtechniq.com/assets/palmtechniqlogo.png`}
                width="400"
                height="400"
                alt="PalmTechnIQ Logo"
              />
            </Section>

            {/* Welcome Banner Image */}
            <Section className="w-full">
              <Img
                width="600"
                className="w-full object-cover"
                height="300"
                src={`https://isce-mail.vercel.app/static/template-images/thanks.png`}
                alt="Welcome to PalmTechnIQ"
              />
            </Section>

            {/* Main Content */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-center text-3xl font-bold text-[#021A1A] mb-6">
                Your Journey Has Started! 🚀
              </Text>

              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Hi {fullName},
              </Text>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                Welcome to <b>PalmTechnIQ</b>! We're absolutely thrilled to have
                you join our learning community. You've taken the first step
                toward unlocking your potential and advancing your career.
              </Text>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                You chose PalmTechnIQ because you're eager for knowledge and
                ready to explore new horizons. That's exactly the kind of energy
                we love to see! You're now part of a community of learners,
                mentors, and tutors committed to continuous growth and
                excellence.
              </Text>

              {/* Getting Started Section */}
              <Section className="bg-blue-50 rounded-lg p-6 my-6 border-l-4 border-green-600">
                <Text className="text-lg font-semibold text-[#021A1A] mb-3">
                  Getting Started
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ Explore our wide range of courses and programs
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ Connect with experienced tutors and mentors
                </Text>
                <Text className="text-sm text-gray-700 mb-2">
                  ✓ Complete your profile to personalize your learning
                  experience
                </Text>
                <Text className="text-sm text-gray-700">
                  ✓ Join our community and grow together
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
                  Explore Courses
                </Button>
              </Section>

              <Text className="text-base text-gray-700 mb-4 leading-relaxed">
                If you have any questions or need support as you get started,
                don't hesitate to reach out to our team. We're here to help!
              </Text>

              {/* Closing */}
              <Text className="text-base text-gray-700 mb-6 leading-relaxed">
                Here's to your learning success!
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

            {/* Footer with Social Links */}
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
                      src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-app-round-white-icon.png`}
                    />
                  </Button>

                  <Button
                    href="https://www.linkedin.com/company/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="LinkedIn"
                      src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png`}
                    />
                  </Button>

                  <Button
                    href="https://www.instagram.com/palmtechniq/"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="Instagram"
                      src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png`}
                    />
                  </Button>

                  <Button
                    href="https://app.slack.com/client/T076LDT7109/C0764SE3VB7"
                    className="m-2 rounded-full bg-green-600 p-2 hover:bg-green-700 transition-colors">
                    <Img
                      width="20"
                      height="20"
                      alt="Slack"
                      src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/slack-icon.png`}
                    />
                  </Button>
                </Column>
              </Row>

              <Hr className="border-gray-600 my-6" />

              {/* Footer Text */}
              <Section className="text-center">
                <Text className="text-xs text-gray-400 mb-2">
                  Copyright © {year} PalmTechnIQ. All rights reserved.
                </Text>
                <Text className="text-xs text-gray-400 mb-2">
                  You're receiving this email because you've successfully
                  registered on our platform.
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

export default Welcome;
