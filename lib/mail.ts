import "server-only";
import { Resend } from "resend";

export async function onBoardingMail(email: string, fullName: string) {
  try {
    const { default: SignIn } = await import("./email-templates/signin");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: "PalmTechnIQ V2 <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to PalmTechnIQ",
      react: SignIn({ fullName }),
    });
    return { success: "Signed-Up successfully!" };
  } catch (error) {
    console.error("Error creating account!", error);
    return { error: "Account Creation failed! Try again" };
  }
}

export async function sendPasswordResetToken(email: string, token: string) {
  const { default: ResetTemplate } = await import(
    "./email-templates/test-email-password-reset"
  );

  const resend = new Resend(process.env.RESEND_API_KEY!);

  await resend.emails.send({
    from: "PalmTechnIQ V2 <onboarding@resend.dev>",
    to: email,
    subject: "Password Reset",
    react: ResetTemplate({ email, token }),
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const { default: TestEmail } = await import("./email-templates/test-email");

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const confirmLink = `${process.env.NEXT_PUBLIC_URL}/verify?token=${token}`;

  await resend.emails.send({
    from: "PalmTechnIQ V2 <onboarding@resend.dev>",
    to: email,
    subject: "Confirm your email",
    react: TestEmail({ email, token }),
    // optionally include confirmLink if your template needs it
  });
}
