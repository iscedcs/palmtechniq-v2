import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendTutorMentorApplicationNotification } from "@/lib/mail";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;

type Bucket = {
  count: number;
  expiresAt: number;
};

const bucketStore = new Map<string, Bucket>();

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `tutor-application:${ip}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = bucketStore.get(key);

  if (!bucket || bucket.expiresAt < now) {
    bucketStore.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

const applicationSchema = z.object({
  applicationType: z.enum(["tutor", "mentor"]),
  personalInfo: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(150),
    phone: z.string().trim().max(40).optional().default(""),
    location: z.string().trim().min(1).max(120),
    timezone: z.string().trim().min(1).max(80),
    linkedin: z.string().trim().max(300).optional().default(""),
    website: z.string().trim().max(300).optional().default(""),
    bio: z.string().trim().min(20).max(2500),
  }),
  professional: z.object({
    currentRole: z.string().trim().min(1).max(120),
    company: z.string().trim().max(120).optional().default(""),
    experience: z.string().trim().min(1).max(40),
    industry: z.string().trim().min(1).max(80),
    skills: z.array(z.string().trim().min(1).max(80)).max(40),
    achievements: z.array(z.string().trim().min(1).max(200)).max(40),
    portfolio: z.string().trim().max(300).optional().default(""),
    resumeFileName: z.string().trim().max(200).optional().default(""),
    resumeUrl: z.string().trim().url().max(2000),
    resumeMimeType: z.string().trim().max(120).optional().default(""),
    resumeFileSize: z
      .number()
      .int()
      .min(0)
      .max(20 * 1024 * 1024)
      .optional(),
  }),
  teaching: z.object({
    subjects: z.array(z.string().trim().min(1).max(100)).min(1).max(40),
    experience: z.string().trim().min(1).max(60),
    approach: z.string().trim().min(20).max(2500),
    availability: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    hourlyRate: z.number().min(0).max(1_000_000),
    languages: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
    certifications: z.array(z.string().trim().min(1).max(120)).max(30),
  }),
  motivation: z.object({
    why: z
      .string()
      .trim()
      .min(20, "Please explain your motivation in at least 20 characters")
      .max(2500),
    goals: z
      .string()
      .trim()
      .min(20, "Please describe your goals properly (min 20 characters)")
      .max(2500),
    commitment: z.string().trim().min(1).max(80),
    references: z.string().trim().max(2500).optional().default(""),
  }),
});

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = applicationSchema.safeParse(body);
  // console.log(parsed);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errors: parsed.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "You must be signed in to submit an application." },
        { status: 401 },
      );
    }

    const payload = parsed.data;
    const inputEmail = payload.personalInfo.email.trim().toLowerCase();
    const signedInEmail = session.user.email.trim().toLowerCase();
    const isSameEmail = inputEmail === signedInEmail;

    if (session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "You are not allowed to submit this application." },
        { status: 403 },
      );
    }

    // Intentionally return a generic response for this case.
    if (session.user.role === "STUDENT" && isSameEmail) {
      return NextResponse.json(
        { error: "Unable to process application with this email address." },
        { status: 403 },
      );
    }

    if (session.user.role !== "STUDENT" && !isSameEmail) {
      return NextResponse.json(
        { error: "Application email must match your signed-in account email." },
        { status: 400 },
      );
    }

    const occupationSummary = [
      `${payload.applicationType.toUpperCase()} APPLICATION`,
      payload.professional.currentRole,
      payload.professional.company || "Independent",
      payload.professional.industry,
    ].join(" | ");

    const details = {
      ...payload,
      status: "PENDING" as const,
      adminReview: null as null | {
        note: string;
        reviewedByUserId: string;
        reviewedAt: string;
      },
      submittedByUserId: session?.user?.id ?? null,
      submittedAt: new Date().toISOString(),
    };

    const record = await db.registration.upsert({
      where: { email: payload.personalInfo.email },
      update: {
        firstname: payload.personalInfo.firstName,
        lastname: payload.personalInfo.lastName,
        phone: payload.personalInfo.phone || "",
        occupation: occupationSummary,
        type: payload.applicationType,
        course: JSON.stringify(details),
      },
      create: {
        firstname: payload.personalInfo.firstName,
        lastname: payload.personalInfo.lastName,
        email: payload.personalInfo.email,
        phone: payload.personalInfo.phone || "",
        occupation: occupationSummary,
        type: payload.applicationType,
        course: JSON.stringify(details),
      },
    });

    // Persist even when notification email is unavailable.
    try {
      await sendTutorMentorApplicationNotification({
        applicationType: payload.applicationType,
        firstName: payload.personalInfo.firstName,
        lastName: payload.personalInfo.lastName,
        email: payload.personalInfo.email,
        phone: payload.personalInfo.phone || "",
        summary: occupationSummary,
        payload: details,
      });
    } catch (emailError) {
      console.error("Tutor application email notification failed:", emailError);
    }

    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    console.error("Failed to submit tutor/mentor application:", error);
    return NextResponse.json(
      { error: "Unable to submit application right now." },
      { status: 500 },
    );
  }
}
