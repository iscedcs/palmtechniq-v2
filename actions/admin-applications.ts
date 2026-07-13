"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendTutorMentorApplicationStatusNotification } from "@/lib/mail";
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

export type AdminApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

type ParsedApplicationPayload = {
  applicationType: "tutor" | "mentor";
  courseType?: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    timezone?: string;
    linkedin?: string;
  };
  professional?: {
    currentRole?: string;
    company?: string;
    industry?: string;
    experience?: string;
    skills?: string[];
    achievements?: string[];
    resumeUrl?: string;
    resumeFileName?: string;
  };
  teaching?: {
    subjects?: string[];
    experience?: string;
    languages?: string[];
    approach?: string;
    availability?: string[];
    hourlyRate?: string;
    why?: string;
    goals?: string;
  };
  status?: AdminApplicationStatus;
  adminReview?: {
    note?: string;
    reviewedByUserId?: string;
    reviewedAt?: string;
  } | null;
  submittedAt?: string;
  [key: string]: unknown;
};

export type AdminApplicationItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  applicationType: "tutor" | "mentor";
  status: AdminApplicationStatus;
  submittedAt: string;
  currentRole: string;
  industry: string;
  experience: string;
  resumeUrl: string;
  resumeFileName: string;
  reviewNote: string;
  reviewedAt: string;
  payload: ParsedApplicationPayload;
};

function parseJsonPayload(value: string): ParsedApplicationPayload | null {
  try {
    const parsed = JSON.parse(value) as ParsedApplicationPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      parsed.applicationType !== "tutor" &&
      parsed.applicationType !== "mentor"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizeStatus(value?: string): AdminApplicationStatus {
  if (
    value === "PENDING" ||
    value === "UNDER_REVIEW" ||
    value === "APPROVED" ||
    value === "REJECTED"
  ) {
    return value;
  }
  return "PENDING";
}

export async function getTutorMentorApplications() {
  const session = await auth();
  if (!session?.user?.id)
    return { error: "You need to be logged in to perform this action!" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const rows = await db.registration.findMany({
    where: { type: { in: ["tutor", "mentor"] } },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      type: true,
      course: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const applications: AdminApplicationItem[] = rows
    .map((row: any) => {
      const payload = parseJsonPayload(row.course);
      if (!payload) return null;

      const status = normalizeStatus(payload.status);
      const submittedAt = payload.submittedAt || row.createdAt.toISOString();
      const reviewedAt = payload.adminReview?.reviewedAt || "";

      return {
        id: row.id,
        name: `${payload.personalInfo?.firstName || row.firstname} ${
          payload.personalInfo?.lastName || row.lastname
        }`.trim(),
        email: payload.personalInfo?.email || row.email,
        phone: payload.personalInfo?.phone || row.phone || "",
        applicationType: payload.applicationType,
        status,
        submittedAt,
        currentRole: payload.professional?.currentRole || "",
        industry: payload.professional?.industry || "",
        experience: payload.professional?.experience || "",
        resumeUrl: payload.professional?.resumeUrl || "",
        resumeFileName: payload.professional?.resumeFileName || "",
        reviewNote: payload.adminReview?.note || "",
        reviewedAt,
        payload,
      };
    })
    .filter((entry: any): entry is AdminApplicationItem => Boolean(entry));

  const stats = {
    total: applications.length,
    pending: applications.filter((item) => item.status === "PENDING").length,
    underReview: applications.filter((item) => item.status === "UNDER_REVIEW")
      .length,
    approved: applications.filter((item) => item.status === "APPROVED").length,
    rejected: applications.filter((item) => item.status === "REJECTED").length,
  };

  return { applications, stats };
}

export async function updateTutorMentorApplicationStatus(input: {
  registrationId: string;
  status: AdminApplicationStatus;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { error: "Forbidden" };

  const record = await db.registration.findFirst({
    where: {
      id: input.registrationId,
      type: { in: ["tutor", "mentor"] },
    },
    select: {
      id: true,
      course: true,
    },
  });

  if (!record) return { error: "Application not found" };

  const payload = parseJsonPayload(record.course);
  if (!payload) return { error: "Invalid application payload" };
  const previousPayload = payload;

  const updatedPayload: ParsedApplicationPayload = {
    ...payload,
    status: input.status,
    adminReview: {
      note: (input.note || "").trim(),
      reviewedByUserId: session.user.id,
      reviewedAt: new Date().toISOString(),
    },
  };

  await db.registration.update({
    where: { id: record.id },
    data: {
      course: JSON.stringify(updatedPayload),
    },
  });

  try {
    const applicantEmail = updatedPayload.personalInfo?.email?.trim();
    if (!applicantEmail) {
      throw new Error("Applicant email is missing");
    }
    await sendTutorMentorApplicationStatusNotification({
      email: applicantEmail,
      firstName: updatedPayload.personalInfo?.firstName,
      applicationType: updatedPayload.applicationType,
      status: input.status,
      adminNote: input.note,
    });
  } catch (error) {
    console.error(
      "Failed to send application status email, reverting status update:",
      error,
    );
    await db.registration.update({
      where: { id: record.id },
      data: { course: JSON.stringify(previousPayload) },
    });
    return {
      error:
        "Status update failed because applicant notification could not be delivered.",
    };
  }

  // ── Privilege upgrade on APPROVED ──────────────────────────────────────────
  if (input.status === "APPROVED") {
    const applicantEmail = updatedPayload.personalInfo?.email?.trim();
    if (applicantEmail) {
      const applicantUser = await db.user.findUnique({
        where: { email: applicantEmail },
        select: { id: true },
      });

      if (applicantUser) {
        const newRole =
          updatedPayload.applicationType === "mentor" ? "MENTOR" : "TUTOR";

        // Build seeded values from the submitted application payload
        const rawSkills = updatedPayload.professional?.skills ?? [];
        const seedTitle =
          updatedPayload.professional?.currentRole?.trim() || "Tutor";
        const seedExperience = (() => {
          const exp = updatedPayload.professional?.experience ?? "";
          const match = String(exp).match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })();

        await db.$transaction([
          // 1. Upgrade the user's role
          db.user.update({
            where: { id: applicantUser.id },
            data: { role: newRole as any },
          }),
          // 2. Provision the Tutor profile row
          db.tutor.upsert({
            where: { userId: applicantUser.id },
            create: {
              userId: applicantUser.id,
              title: seedTitle,
              expertise: rawSkills,
              experience: seedExperience,
              education: [],
              certifications: [],
              isVerified: true,
              verifiedAt: new Date(),
            },
            update: {
              // Only backfill if the existing record has empty values
              isVerified: true,
              verifiedAt: new Date(),
            },
          }),
        ]);
      } else {
        // User hasn't registered an account yet — log but do not block approval
        console.warn(
          `[Approval] No User account found for approved applicant email: ${applicantEmail}. ` +
            `Tutor record will be provisioned when they sign up.`,
        );
      }
    }
  }

  const eventDef =
    input.status === "APPROVED"
      ? PLATFORM_EVENTS.APPLICATION_APPROVED
      : input.status === "REJECTED"
        ? PLATFORM_EVENTS.APPLICATION_REJECTED
        : null;
  if (eventDef) {
    trackEvent(eventDef, {
      userId: session.user.id,
      entityType: "application",
      entityId: input.registrationId,
      metadata: {
        applicationType: updatedPayload.applicationType,
        status: input.status,
      },
    });
  }

  return { success: true };
}
