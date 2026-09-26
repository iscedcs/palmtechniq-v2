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
  const { default: ApplicationStatusEmail } = await import(
    "./email-templates/application-status"
  );
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const applicantName = params.firstName?.trim() || "there";
  const statusLabel = formatStatusLabel(params.status);
  const portalUrl = `${process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com"}/tutor/profile`;
  const supportEmail =
    process.env.SUPPORT_EMAIL_ADDRESS ||
    process.env.TO_EMAIL_ADDRESS ||
    "palmtechniq@gmail.com";

  const subject = `Your ${params.applicationType} application is ${statusLabel} — PalmTechnIQ`;

  // Plain-text fallback
  const guidanceLines = buildApplicationStatusGuidance({
    status: params.status,
    applicationType: params.applicationType,
    portalUrl,
  });
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
    from: process.env.FROM_EMAIL_ADDRESS || "PalmTechnIQ <support@palmtechniq.com>",
    to: params.email,
    subject,
    react: ApplicationStatusEmail({
      firstName: applicantName,
      applicationType: params.applicationType,
      status: params.status,
      adminNote: params.adminNote,
      portalUrl,
      supportEmail,
    }),
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
    const domain = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";

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

// ============ PROGRAM BALANCE PAYMENT EMAILS ============
export async function sendBalancePaymentConfirmation(params: {
  enrollmentId: string;
  programName: string;
  fullName: string;
  email: string;
  amount: number;
  reference: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const domain = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";

    const subject = `Balance Payment Confirmed — ${params.programName} | PalmTechnIQ`;
    const text = [
      `Hello ${params.fullName},`,
      "",
      `Your balance payment of ₦${params.amount.toLocaleString("en-NG")} for ${params.programName} has been received and confirmed.`,
      "",
      `Transaction Reference: ${params.reference}`,
      "",
      "You are now fully enrolled in the program and have access to all course materials.",
      "",
      `Login to your dashboard: ${domain}/student`,
      "",
      "If you have any questions, please contact our support team.",
      "",
      "Best regards,",
      "The PalmTechnIQ Team",
    ].join("\n");

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: params.email,
      subject,
      text,
    });
  } catch (error) {
    console.error("[sendBalancePaymentConfirmation] Failed to send email:", error);
  }
}

export async function sendAdminBalancePaymentNotification(params: {
  enrollmentId: string;
  programName: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  reference: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const adminEmail =
      process.env.ADMIN_EMAIL_ADDRESS || "admin@palmtechniq.com";
    const domain = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";

    const subject = `[Balance Payment] ${params.studentName} — ${params.programName}`;
    const text = [
      "Balance Payment Received",
      "",
      `Student: ${params.studentName}`,
      `Email: ${params.studentEmail}`,
      `Program: ${params.programName}`,
      `Amount: ₦${params.amount.toLocaleString("en-NG")}`,
      `Reference: ${params.reference}`,
      `Enrollment ID: ${params.enrollmentId}`,
      "",
      `View enrollment: ${domain}/admin/enrollments/${params.enrollmentId}`,
    ].join("\n");

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: adminEmail,
      subject,
      text,
    });
  } catch (error) {
    console.error(
      "[sendAdminBalancePaymentNotification] Failed to send email:",
      error,
    );
  }
}

// ============ TESTER INVITE EMAIL ============
export async function sendTesterInviteEmail(
  email: string,
  name: string,
  tempPassword: string,
) {
  try {
    const { default: TesterInvite } =
      await import("./email-templates/tester-invite");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: process.env.FROM_EMAIL_ADDRESS!,
      to: email,
      subject: "You've been invited to access PalmTechnIQ Documentation",
      react: TesterInvite({ name, email, tempPassword }),
    });
  } catch (error) {
    console.error("[sendTesterInviteEmail] Failed to send email:", error);
    throw error;
  }
}

// ============ TWO-FACTOR AUTHENTICATION OTP EMAIL ============
export async function sendTwoFactorOtpEmail(params: {
  email: string;
  name?: string;
  code: string;
  expiresInMinutes?: number;
}) {
  try {
    const { default: TwoFactorOtpEmail } = await import(
      "./email-templates/two-factor-otp"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const expiresIn = params.expiresInMinutes ?? 10;

    await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ Security <security@palmtechniq.com>",
      to: params.email,
      subject: `${params.code} is your PalmTechnIQ verification code`,
      react: TwoFactorOtpEmail({
        email: params.email,
        name: params.name,
        otpCode: params.code,
        expiresInMinutes: expiresIn,
      }),
      text: `Your PalmTechnIQ verification code is ${params.code}. This code expires in ${expiresIn} minutes. Do not share this code with anyone.`,
    });
    return { success: true };
  } catch (error) {
    console.error("[sendTwoFactorOtpEmail] Failed to send email:", error);
    return { error: "Failed to deliver verification code. Please try again." };
  }
}

// ============ PASSWORD CHANGED NOTIFICATION EMAIL ============
export async function sendPasswordChangedEmail(params: {
  email: string;
  name?: string;
  changedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const { default: PasswordChangedEmail } = await import(
      "./email-templates/password-changed"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_URL || "https://www.palmtechniq.com";

    await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ Security <security@palmtechniq.com>",
      to: params.email,
      subject: "Security Alert: Your PalmTechnIQ password was changed",
      react: PasswordChangedEmail({
        email: params.email,
        name: params.name,
        changedAt: params.changedAt,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      }),
      text: `Hello ${params.name || params.email},\n\nThe password for your PalmTechnIQ account was recently changed.\n\nIf you made this change, no further action is required.\n\nIf you DID NOT make this change, please reset your password immediately at ${siteUrl}/forgot-password or contact support at support@palmtechniq.com.\n\nPalmTechnIQ Security Team`,
    });
    return { success: true };
  } catch (error) {
    console.error("[sendPasswordChangedEmail] Failed to send email:", error);
    return { error: "Failed to send password changed notification." };
  }
}

// ============ WITHDRAWAL 2FA OTP EMAIL ============
export async function sendWithdrawalOtpEmail(params: {
  email: string;
  name?: string;
  amount: number;
  code: string;
  bankName?: string;
  accountNumber?: string;
  expiresInMinutes?: number;
}) {
  try {
    const { default: WithdrawalOtpEmail } = await import(
      "./email-templates/withdrawal-otp"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const expiresIn = params.expiresInMinutes ?? 10;
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(params.amount);

    await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ Security <security@palmtechniq.com>",
      to: params.email,
      subject: `${params.code} is your authorization code for withdrawal of ${formattedAmount}`,
      react: WithdrawalOtpEmail({
        email: params.email,
        name: params.name,
        amount: params.amount,
        otpCode: params.code,
        expiresInMinutes: expiresIn,
        bankName: params.bankName,
        accountNumber: params.accountNumber,
      }),
      text: `Your authorization code for withdrawing ${formattedAmount} is ${params.code}. This code expires in ${expiresIn} minutes. Do not share this code with anyone.`,
    });
    return { success: true };
  } catch (error) {
    console.error("[sendWithdrawalOtpEmail] Failed to send email:", error);
    return { error: "Failed to send withdrawal authorization code." };
  }
}




// ============ TUTOR COURSE EMAILS ============

/**
 * Dry run for the transactional emails added since the exam center: log what
 * would be sent and report success without contacting Resend. It exists so
 * "exactly once" and "respects the recipient's settings" can be tested against a
 * real database without mailing real people — the same approach the exam-center
 * emails use.
 *
 * EMAILS_DRY_RUN=1 is the switch. TUTOR_EMAILS_DRY_RUN=1 still works, because
 * that is the name it was introduced under.
 */
function emailDryRun(
  kind: string,
  to: string,
  subject: string,
  /** Key figures, logged after the subject so a test can check what would be sent. */
  detail?: Record<string, unknown>,
): boolean {
  if (
    process.env.EMAILS_DRY_RUN !== "1" &&
    process.env.TUTOR_EMAILS_DRY_RUN !== "1"
  ) {
    return false;
  }
  console.log(
    `[emails] DRY RUN — would send ${kind} to ${to}: ${subject}` +
      (detail ? ` ⟂ ${JSON.stringify(detail)}` : ""),
  );
  return true;
}

export async function sendCourseApprovedEmail(params: {
  email: string;
  name?: string;
  courseTitle: string;
  courseUrl: string;
  dashboardUrl: string;
  /** first: congratulations · later: a further new course · updated: an edit re-approved. */
  kind: "first" | "later" | "updated";
}) {
  const subject =
    params.kind === "first"
      ? "🎉 Congratulations! Your first course is live on PalmTechnIQ"
      : params.kind === "updated"
        ? `✅ Your changes to "${params.courseTitle}" are now live`
        : `✅ Your course "${params.courseTitle}" has been approved`;

  try {
    if (emailDryRun("course-approved", params.email, subject)) {
      return { success: true as const };
    }

    const { default: CourseApprovedEmail } = await import(
      "./email-templates/course-approved"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const { error } = await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ <support@palmtechniq.com>",
      to: params.email,
      subject,
      react: CourseApprovedEmail({
        name: params.name,
        courseTitle: params.courseTitle,
        courseUrl: params.courseUrl,
        dashboardUrl: params.dashboardUrl,
        kind: params.kind,
      }),
      text: [
        `Hi ${params.name?.trim() || "there"},`,
        "",
        params.kind === "updated"
          ? `Good news — our team has reviewed the changes you made to "${params.courseTitle}" and approved them. The updated course is live on PalmTechnIQ again.\n\nChanges to a published course are reviewed before they go live, which keeps every course up to standard for the students who buy it. Thank you for your patience.`
          : `Great news — our team has reviewed "${params.courseTitle}" and approved it. It is now live on PalmTechnIQ.`,
        params.kind === "first"
          ? "\nCongratulations on publishing your first course — that is a real milestone.\n\nA few things that help a new course get going:\n1. Share your course link with your network.\n2. Keep your profile sharp — a clear photo and a short bio.\n3. Watch your dashboard — we'll email you as soon as someone enrols."
          : params.kind === "later"
            ? "\nShare the link with your network to start bringing students in."
            : "",
        "",
        `View your course: ${params.courseUrl}`,
        `Your dashboard: ${params.dashboardUrl}`,
        "",
        "Thanks,",
        "PalmTechnIQ Team",
      ].join("\n"),
    });

    // Resend reports most failures in its return value rather than by
    // throwing, so a bad key or an unverified domain would otherwise look
    // exactly like a delivered email.
    if (error) {
      console.error("[sendCourseApprovedEmail] Resend rejected the email:", error);
      return { error: error.message ?? "Resend rejected the email." };
    }
    return { success: true as const };
  } catch (error) {
    console.error("[sendCourseApprovedEmail] Failed to send email:", error);
    return { error: "Failed to send course approval email." };
  }
}

export async function sendTutorCourseSaleEmail(params: {
  email: string;
  name?: string;
  courseTitles: string[];
  earned: number;
  walletUrl: string;
}) {
  const many = params.courseTitles.length > 1;
  const subject = many
    ? `🎉 ${params.courseTitles.length} of your courses were purchased`
    : `🎉 New enrolment: ${params.courseTitles[0]}`;

  try {
    if (emailDryRun("course-sale", params.email, subject)) {
      return { success: true as const };
    }

    const { default: TutorCourseSaleEmail } = await import(
      "./email-templates/tutor-course-sale"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const earned = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(params.earned);

    const { error } = await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ <support@palmtechniq.com>",
      to: params.email,
      subject,
      react: TutorCourseSaleEmail({
        name: params.name,
        courseTitles: params.courseTitles,
        earned: params.earned,
        walletUrl: params.walletUrl,
      }),
      text: [
        `Hi ${params.name?.trim() || "there"},`,
        "",
        many
          ? `Someone just bought ${params.courseTitles.length} of your courses together: ${params.courseTitles.join(", ")}.`
          : `Someone just enrolled in "${params.courseTitles[0]}".`,
        "",
        `Your earnings from this sale: ${earned}`,
        "This has been added to your wallet balance.",
        "",
        `Check your wallet: ${params.walletUrl}`,
        "",
        "Thanks,",
        "PalmTechnIQ Team",
      ].join("\n"),
    });

    if (error) {
      console.error("[sendTutorCourseSaleEmail] Resend rejected the email:", error);
      return { error: error.message ?? "Resend rejected the email." };
    }
    return { success: true as const };
  } catch (error) {
    console.error("[sendTutorCourseSaleEmail] Failed to send email:", error);
    return { error: "Failed to send course sale notification." };
  }
}

export async function sendTutorGroupPurchaseEmail(params: {
  email: string;
  name?: string;
  variant: "STARTED" | "COMPLETED";
  courseTitle: string;
  memberLimit: number;
  /** STARTED only: what this payment added to the tutor's wallet. */
  earned?: number;
  cashbackTotal: number;
  walletUrl: string;
}) {
  const started = params.variant === "STARTED";
  const subject = started
    ? `🎉 A group purchase started for "${params.courseTitle}"`
    : `✅ Your group for "${params.courseTitle}" is complete`;

  try {
    if (emailDryRun(`group-${params.variant.toLowerCase()}`, params.email, subject)) {
      return { success: true as const };
    }

    const { default: TutorGroupPurchaseEmail } = await import(
      "./email-templates/tutor-group-purchase"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const money = (n: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(n);

    const lines = [`Hi ${params.name?.trim() || "there"},`, ""];
    if (started) {
      lines.push(
        `Someone just started a group purchase for "${params.courseTitle}". The group has ${params.memberLimit} seats.`,
      );
      if (typeof params.earned === "number") {
        lines.push("", `Your earnings from this purchase: ${money(params.earned)}`, "This has been added to your wallet balance.");
      }
      if (params.cashbackTotal > 0) {
        lines.push(
          "",
          `About the group cashback: if all ${params.memberLimit} seats fill, ${money(params.cashbackTotal)} cashback is paid to the student who started the group, funded from your wallet. Please keep at least that much in your wallet until the group completes.`,
        );
      }
    } else {
      lines.push(
        `All ${params.memberLimit} seats for "${params.courseTitle}" are filled, and every member now has access.`,
      );
      if (params.cashbackTotal > 0) {
        lines.push(
          "",
          `${money(params.cashbackTotal)} was deducted from your wallet as the group's cashback, paid to the student who started the group.`,
        );
      }
    }
    lines.push("", `Check your wallet: ${params.walletUrl}`, "", "Thanks,", "PalmTechnIQ Team");

    const { error } = await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ <support@palmtechniq.com>",
      to: params.email,
      subject,
      react: TutorGroupPurchaseEmail({
        variant: params.variant,
        name: params.name,
        courseTitle: params.courseTitle,
        memberLimit: params.memberLimit,
        earned: params.earned,
        cashbackTotal: params.cashbackTotal,
        walletUrl: params.walletUrl,
      }),
      text: lines.join("\n"),
    });

    if (error) {
      console.error("[sendTutorGroupPurchaseEmail] Resend rejected the email:", error);
      return { error: error.message ?? "Resend rejected the email." };
    }
    return { success: true as const };
  } catch (error) {
    console.error("[sendTutorGroupPurchaseEmail] Failed to send email:", error);
    return { error: "Failed to send group purchase notification." };
  }
}

// ============ PAYMENT RECEIPT ============

/**
 * PalmTechnIQ's own receipt, sent in place of the one Paystack emails.
 *
 * Deliberately NOT subject to a recipient's notification settings. A receipt is a
 * record of a payment, like a password reset or a withdrawal code, not a
 * marketing or activity email: someone who has switched off "email
 * notifications" still needs proof they paid.
 */
export async function sendPaymentReceiptEmail(params: {
  email: string;
  name?: string;
  receiptNumber: string;
  reference: string;
  paidAt: Date;
  paymentMethod: string;
  title: string;
  lines: { label: string; detail?: string; amount: number }[];
  discount: number;
  subtotal: number;
  vatRateLabel?: string;
  vat: number;
  total: number;
  walletCredit: number;
  amountPaid: number;
  balanceRemaining?: number;
  note?: string;
  cta: { label: string; href: string };
}) {
  const money = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(n);

  const subject = `Your PalmTechnIQ receipt — ${money(params.amountPaid)}`;

  try {
    if (
      emailDryRun("payment-receipt", params.email, subject, {
        receiptNumber: params.receiptNumber,
        title: params.title,
        lines: params.lines.length,
        discount: params.discount,
        subtotal: params.subtotal,
        vat: params.vat,
        total: params.total,
        walletCredit: params.walletCredit,
        amountPaid: params.amountPaid,
        balanceRemaining: params.balanceRemaining ?? 0,
        paymentMethod: params.paymentMethod,
      })
    ) {
      return { success: true as const };
    }

    // Shown in Lagos time: the payers are overwhelmingly in Nigeria, and a
    // receipt timestamp in UTC reads as the wrong hour.
    const paidAt = `${new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(params.paidAt)} (WAT)`;

    const { default: PaymentReceiptEmail } = await import(
      "./email-templates/payment-receipt"
    );
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const text = [
      `Hi ${params.name?.trim() || "there"},`,
      "",
      `Thank you — we've received your payment for ${params.title.toLowerCase()}.`,
      "",
      `Receipt no.: ${params.receiptNumber}`,
      `Date: ${paidAt}`,
      `Paid with: ${params.paymentMethod}`,
      `Payment reference: ${params.reference}`,
      "",
      ...params.lines.map(
        (l) => `${l.label}${l.detail ? ` (${l.detail})` : ""}: ${money(l.amount)}`,
      ),
      ...(params.discount > 0.005 ? [`Discount applied: -${money(params.discount)}`] : []),
      ...(params.vat > 0.005
        ? [
            `Subtotal: ${money(params.subtotal)}`,
            `VAT${params.vatRateLabel ? ` (${params.vatRateLabel})` : ""}: ${money(params.vat)}`,
          ]
        : []),
      `Total: ${money(params.total)}`,
      ...(params.walletCredit > 0.005
        ? [`Wallet credit applied: -${money(params.walletCredit)}`]
        : []),
      `Amount paid: ${money(params.amountPaid)}`,
      ...(typeof params.balanceRemaining === "number" && params.balanceRemaining > 0.005
        ? ["", `Balance remaining: ${money(params.balanceRemaining)}`]
        : []),
      "",
      `${params.cta.label}: ${params.cta.href}`,
      "",
      "Thanks,",
      "PalmTechnIQ Team",
    ].join("\n");

    const { error } = await resend.emails.send({
      from:
        process.env.FROM_EMAIL_ADDRESS ||
        "PalmTechnIQ <support@palmtechniq.com>",
      to: params.email,
      subject,
      react: PaymentReceiptEmail({
        name: params.name,
        receiptNumber: params.receiptNumber,
        reference: params.reference,
        paidAt,
        paymentMethod: params.paymentMethod,
        title: params.title,
        lines: params.lines,
        discount: params.discount,
        subtotal: params.subtotal,
        vatRateLabel: params.vatRateLabel,
        vat: params.vat,
        total: params.total,
        walletCredit: params.walletCredit,
        amountPaid: params.amountPaid,
        balanceRemaining: params.balanceRemaining,
        note: params.note,
        cta: params.cta,
      }),
      text,
    });

    if (error) {
      console.error("[sendPaymentReceiptEmail] Resend rejected the email:", error);
      return { error: error.message ?? "Resend rejected the email." };
    }
    return { success: true as const };
  } catch (error) {
    console.error("[sendPaymentReceiptEmail] Failed to send email:", error);
    return { error: "Failed to send payment receipt." };
  }
}
