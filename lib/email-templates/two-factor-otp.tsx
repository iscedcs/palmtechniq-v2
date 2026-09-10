import {
  Body,
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

interface TwoFactorOtpEmailProps {
  email: string;
  name?: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export const TwoFactorOtpEmail = ({
  email,
  name,
  otpCode,
  expiresInMinutes = 10,
}: TwoFactorOtpEmailProps) => {
  const year = new Date().getFullYear();
  const displayName = name?.trim() || email;

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>Your PalmTechnIQ verification code is {otpCode}</Preview>
        </Head>
        <Body className="w-full bg-[#0a0d14] font-sans text-[#e2e8f0]">
          <Container className="mx-auto my-8 max-w-[520px] rounded-2xl border border-slate-800 bg-[#0f172a] p-8 shadow-2xl">
            <Section className="text-center pb-4">
              <Img
                className="mx-auto"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="160"
                alt="PalmTechnIQ"
              />
            </Section>

            <Section className="pt-2 text-left">
              <Text className="text-xl font-bold text-white mb-2">
                Security Verification Code
              </Text>
              <Text className="text-sm text-slate-300 leading-relaxed mb-4">
                Hi {displayName},
              </Text>
              <Text className="text-sm text-slate-300 leading-relaxed mb-6">
                You requested a security verification code to configure Two-Factor
                Authentication (2FA) for your PalmTechnIQ account. Use the code below
                to complete the setup:
              </Text>

              {/* OTP Box */}
              <div
                style={{
                  background: "#021A1A",
                  border: "1px solid #10b981",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#34d399",
                  margin: "24px 0",
                  fontFamily: "monospace",
                }}
              >
                {otpCode}
              </div>

              <Text className="text-xs text-slate-400 mt-2">
                ⏱️ This code is valid for <strong>{expiresInMinutes} minutes</strong>. Do not share this code with anyone.
              </Text>
              <Text className="text-xs text-slate-400 mt-1">
                If you did not make this request, please sign in to your PalmTechnIQ account immediately and update your password.
              </Text>
            </Section>

            <Hr className="my-6 border-slate-800" />

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

export default TwoFactorOtpEmail;
