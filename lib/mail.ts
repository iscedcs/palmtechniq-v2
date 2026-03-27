import "server-only";
import { Resend } from "resend";

type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

function formatStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "UNDER_REVIEW":
      return "Under Review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
}

function buildApplicationStatusGuidance(params: {
  status: ApplicationStatus;
  applicationType: "tutor" | "mentor";
  portalUrl: string;
}) {
  switch (params.status) {
    case "UNDER_REVIEW":
      return [
        `Our team is currently reviewing your ${params.applicationType} application details.`,
        "You may receive a follow-up message if we need additional information.",
        "Typical review time is 24-48 hours.",
      ];
    case "APPROVED":
      return [
        `Congratulations! Your ${params.applicationType} application has been approved.`,
        "Next steps:",
        `- Sign in and complete your profile setup at ${params.portalUrl}`,
        "- Ensure your bio, expertise, and availability are up to date.",
        "- Watch for onboarding guidance from our team.",
      ];
    case "REJECTED":
      return [
        `Thank you for applying to become a ${params.applicationType} on PalmTechnIQ.`,
        "At this time, your application was not approved.",
        "You can strengthen your profile (portfolio, achievements, and teaching evidence) and apply again later.",
      ];
    default:
      return [
        `Your ${params.applicationType} application has been received successfully.`,
        "It is now in queue for initial screening.",
        "We will email you as soon as there is a status update.",
      ];
  }
}

function toText(value: unknown, fallback = "N/A") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

export async function onBoardingMail(email: string, fullName: string) {
  try {
    const { default: Welcome } = await import("./email-templates/welcome");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: email,
      subject: "Welcome to PalmTechnIQ - Your Learning Journey Starts Here",
      react: Welcome({ fullName }),
    });
    return { success: "Signed-Up successfully!" };
  } catch (error) {
    console.error("Error creating account!", error);
    return { error: "Account Creation failed! Try again" };
  }
}

export async function sendPasswordResetToken(email: string, token: string) {
  const { default: PasswordReset } =
    await import("./email-templates/password-reset");

  const resend = new Resend(process.env.RESEND_API_KEY!);

  await resend.emails.send({
    from: process.env.FROM_EMAIL_ADDRESS!,
    to: email,
    subject: "Password Reset",
    react: PasswordReset({ email, token }),
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const { default: EmailVerification } =
    await import("./email-templates/email-verification");

  const resend = new Resend(process.env.RESEND_API_KEY!);

  await resend.emails.send({
    from: process.env.FROM_EMAIL_ADDRESS!,
    to: email,
    subject: "Confirm your email",
    react: EmailVerification({ email, token }),
    // optionally include confirmLink if your template needs it
  });
}

export async function sendCourseAdvisorLeadNotification(params: {
  name: string;
  email: string;
  note?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const toEmail =
    process.env.COURSE_ADVISOR_LEADS_EMAIL ||
    process.env.TO_EMAIL_ADDRESS ||
    "support@palmtechniq.com";

  const subject = `Course advisor follow-up: ${params.name}`;
  const text = [
    "New course advisor follow-up request",
    "",
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Note: ${params.note || "N/A"}`,
  ].join("\n");

  await resend.emails.send({
    from: "PalmTechnIQ <support@palmtechniq.com>",
    to: toEmail,
    subject,
    text,
  });
}

export async function sendTutorMentorApplicationNotification(params: {
  applicationType: "tutor" | "mentor";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  summary: string;
  payload: Record<string, unknown>;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const toEmail =
    process.env.TUTOR_APPLICATIONS_EMAIL ||
    process.env.TO_EMAIL_ADDRESS ||
    "support@palmtechniq.com";

  const personalInfo =
    (params.payload.personalInfo as Record<string, unknown> | undefined) || {};
  const professional =
    (params.payload.professional as Record<string, unknown> | undefined) || {};
  const teaching =
    (params.payload.teaching as Record<string, unknown> | undefined) || {};
  const motivation =
    (params.payload.motivation as Record<string, unknown> | undefined) || {};
  const subjects = Array.isArray(teaching.subjects)
    ? teaching.subjects
        .map((item) => toText(item, ""))
        .filter(Boolean)
        .join(", ")
    : "N/A";
  const languages = Array.isArray(teaching.languages)
    ? teaching.languages
        .map((item) => toText(item, ""))
        .filter(Boolean)
        .join(", ")
    : "N/A";

  const applicantName = `${params.firstName} ${params.lastName}`.trim();
  const subject = `${params.applicationType.toUpperCase()} application: ${applicantName}`;
  const text = [
    "New tutor/mentor application received",
    "",
    `Application type: ${params.applicationType}`,
    `Name: ${applicantName}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone || "N/A"}`,
    `Summary: ${params.summary}`,
    "",
    "Profile snapshot",
    `Location: ${toText(personalInfo.location)}`,
    `Timezone: ${toText(personalInfo.timezone)}`,
    `Current role: ${toText(professional.currentRole)}`,
    `Company: ${toText(professional.company)}`,
    `Industry: ${toText(professional.industry)}`,
    `Experience: ${toText(professional.experience)}`,
    `Subjects: ${subjects}`,
    `Languages: ${languages}`,
    `Portfolio: ${toText(professional.portfolio)}`,
    `Resume: ${toText(professional.resumeFileName)} (${toText(
      professional.resumeUrl,
    )})`,
    "",
    "Motivation",
    `Why: ${toText(motivation.why)}`,
    `Goals: ${toText(motivation.goals)}`,
    `Commitment: ${toText(motivation.commitment)}`,
  ].join("\n");

  await resend.emails.send({
    from: "PalmTechnIQ <support@palmtechniq.com>",
    to: toEmail,
    subject,
    text,
  });
}

export async function sendTutorMentorApplicationStatusNotification(params: {
  email: string;
  firstName?: string;
  applicationType: "tutor" | "mentor";
  status: ApplicationStatus;
  adminNote?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const applicantName = params.firstName?.trim() || "there";
  const statusLabel = formatStatusLabel(params.status);
  const portalUrl = `${process.env.NEXT_PUBLIC_URL || "https://palmtechniq.com"}/apply`;
  const supportEmail =
    process.env.SUPPORT_EMAIL_ADDRESS ||
    process.env.TO_EMAIL_ADDRESS ||
    "support@palmtechniq.com";
  const guidanceLines = buildApplicationStatusGuidance({
    status: params.status,
    applicationType: params.applicationType,
    portalUrl,
  });
  const subject = `Your ${params.applicationType} application is now ${statusLabel}`;
  const text = [
    `Hi ${applicantName},`,
    "",
    `Your ${params.applicationType} application status has been updated.`,
    "",
    `Current status: ${statusLabel}`,
    params.adminNote?.trim() ? `Review note: ${params.adminNote.trim()}` : "",
    "",
    ...guidanceLines,
    "",
    `If you have any questions, contact us at ${supportEmail}.`,
    "",
    "PalmTechnIQ Team",
  ]
    .filter(Boolean)
    .join("\n");

  await resend.emails.send({
    from: "PalmTechnIQ <support@palmtechniq.com>",
    to: params.email,
    subject,
    text,
  });
}

export async function sendEnrollmentConfirmation(params: {
  email: string;
  fullName: string;
  programName: string;
  cohortName: string;
  learningMode: string;
  paymentPlan: string;
  amountPaid: number;
  totalAmount: number;
  status: string;
  isNewAccount?: boolean;
  tempPassword?: string;
  resetLink?: string;
  loginUrl?: string;
}) {
  try {
    const { default: EnrollmentConfirmation } =
      await import("./email-templates/enrollment-confirmation");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: params.email,
      subject: `Enrollment Confirmed — ${params.programName} | PalmTechnIQ`,
      react: EnrollmentConfirmation({
        fullName: params.fullName,
        email: params.email,
        programName: params.programName,
        cohortName: params.cohortName,
        learningMode: params.learningMode,
        paymentPlan: params.paymentPlan,
        amountPaid: params.amountPaid,
        totalAmount: params.totalAmount,
        status: params.status,
        isNewAccount: params.isNewAccount,
        tempPassword: params.tempPassword,
        resetLink: params.resetLink,
        loginUrl: params.loginUrl,
      }),
    });
  } catch (error) {
    console.error("[sendEnrollmentConfirmation] Failed to send email:", error);
  }
}

export async function sendAdminEnrollmentNotification(params: {
  fullName: string;
  email: string;
  phone: string;
  programName: string;
  cohortName: string;
  learningMode: string;
  paymentPlan: string;
  amountPaid: number;
  totalAmount: number;
  status: string;
  isNewAccount: boolean;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const adminEmail =
      process.env.ADMIN_EMAIL_ADDRESS || "admin@palmtechniq.com";
    const domain = process.env.NEXT_PUBLIC_URL || "https://palmtechniq.com";

    const balanceRemaining = params.totalAmount - params.amountPaid;
    const isFullyPaid = params.status === "FULLY_PAID";

    const formatAmount = (n: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(n);

    const subject = `🎓 New Enrollment: ${params.fullName} — ${params.programName}`;
    const text = [
      "New Professional Program Enrollment",
      "====================================",
      "",
      `Student: ${params.fullName}`,
      `Email: ${params.email}`,
      `Phone: ${params.phone}`,
      "",
      `Program: ${params.programName}`,
      `Cohort: ${params.cohortName}`,
      `Learning Mode: ${params.learningMode === "VIRTUAL" ? "Virtual" : "Physical"}`,
      `Payment Plan: ${params.paymentPlan === "INSTALLMENT" ? "Installment (70/30)" : "Full Payment"}`,
      "",
      `Amount Paid: ${formatAmount(params.amountPaid)}`,
      `Total Fee: ${formatAmount(params.totalAmount)}`,
      isFullyPaid
        ? "Status: ✅ FULLY PAID"
        : `Status: ⏳ Balance remaining — ${formatAmount(balanceRemaining)}`,
      "",
      `Account: ${params.isNewAccount ? "New account created" : "Linked to existing account"}`,
      "",
      `View enrollments: ${domain}/admin/enrollments`,
    ].join("\n");

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: adminEmail,
      subject,
      text,
    });
  } catch (error) {
    console.error(
      "[sendAdminEnrollmentNotification] Failed to send email:",
      error,
    );
  }
}
