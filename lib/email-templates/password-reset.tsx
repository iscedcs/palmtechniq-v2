import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Hr,
  Link,
  Section,
  Column,
  Row,
  Text,
  Tailwind,
  Preview,
} from "@react-email/components";
import React from "react";

const domain = process.env.NEXT_PUBLIC_URL;

interface PasswordResetProps {
  email: string;
  token: string;
}

const PasswordReset = ({ email, token }: PasswordResetProps) => {
  const resetLink = `${domain}/new-password?token=${token}`;
  const year = new Date().getFullYear();
  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>PalmTechnIQ Password Reset Mail</Preview>
        </Head>
        <Body className="w-full">
          <Container className="w-full">
            <Section className="bg-[#021A1A]">
              <Img
                className="mx-auto h-full object-cover py-3"
                src={`https://www.palmtechniq.com/assets/palmtechniqlogo.png`}
                width="200"
                height="200"
              />
            </Section>
            <Section>
              <Text className="mt-[20px] text-[20px] font-bold">
                Password Reset
              </Text>
              <Text className="text-left">Hi, {email}</Text>
              <Text>
                Someone recently requested for a password change to your
                PalmTechnIQ account. If this was you, tap the button below to
                reset your password.
              </Text>
            </Section>
            <Section className="text-center md:text-left">
              <Button
                href={resetLink}
                className="cursor-pointer rounded-full bg-green-600 text-[13px] text-white"
                style={{
                  padding: "10px 20px",
                  margin: "0 auto",
                }}>
                Reset Password
              </Button>
            </Section>
            <Text>
              If you did not request for this please ignore and delete this
              message and strengthen your password.
            </Text>
            <Section className="text-left">
              <span>
                <Text>
                  Thanks, <br />
                  <b>PalmTechnIQ Team</b>
                </Text>
              </span>
            </Section>
            <Hr className="mt-[30px]" />
            <Section className="text-center text-[#333333]">
              <Text>
                <p>Copyright © {year} PalmTechnIQ, All Rights Reserved.</p>
                <p>
                  You are recieving this mail because you requested a password
                  reset via our website.
                </p>
                <p>
                  Mailing Address: 1st Floor, (Festac Tower) Chicken Republic
                  Building, 22Rd ,Festac Town, Lagos, Nigeria.
                </p>
              </Text>
            </Section>
            <Section className="pb-[40px] text-center">
              <Button
                href="https://www.facebook.com/profile.php?id=61561459226438&mibextid=ZbWKwL"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ"
                  src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-app-round-white-icon.png`}
                />
              </Button>
              <Button
                href="https://www.linkedin.com/company/palmtechniq/"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ"
                  src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png`}
                />
              </Button>
              <Button
                href="https://www.instagram.com/palmtechniq/"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ"
                  src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png`}
                />
              </Button>
              <Button
                href="https://app.slack.com/client/T076LDT7109/C0764SE3VB7"
                className="m-[5px] rounded-full bg-green-600 px-[10px] py-[8px]">
                <Img
                  width="23"
                  height="23"
                  alt="PalmTechnIQ"
                  src={`https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/slack-icon.png`}
                />
              </Button>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default PasswordReset;
