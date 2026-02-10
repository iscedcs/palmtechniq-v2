"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  defaultUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

export type TutorAvailabilityDay = {
  enabled: boolean;
  start: string;
  end: string;
};

export type TutorAvailability = {
  monday: TutorAvailabilityDay;
  tuesday: TutorAvailabilityDay;
  wednesday: TutorAvailabilityDay;
  thursday: TutorAvailabilityDay;
  friday: TutorAvailabilityDay;
  saturday: TutorAvailabilityDay;
  sunday: TutorAvailabilityDay;
};

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const defaultAvailability: TutorAvailability = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

const availabilityDaySchema = z.object({
  enabled: z.boolean(),
  start: z.string().min(1),
  end: z.string().min(1),
});

const availabilitySchema = z.object({
  monday: availabilityDaySchema,
  tuesday: availabilityDaySchema,
  wednesday: availabilityDaySchema,
  thursday: availabilityDaySchema,
  friday: availabilityDaySchema,
  saturday: availabilityDaySchema,
  sunday: availabilityDaySchema,
});

const socialLinksSchema = z.object({
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  youtube: z.string().optional(),
  instagram: z.string().optional(),
});

const tutorProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  title: z.string().optional(),
  experience: z.number().min(0).optional(),
  course: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: socialLinksSchema.optional(),
  availability: availabilitySchema.optional(),
  preferences: z
    .object({
      emailNotifications: z.boolean(),
      pushNotifications: z.boolean(),
      courseReminders: z.boolean(),
      mentorshipAlerts: z.boolean(),
      achievementNotifications: z.boolean(),
      weeklyProgress: z.boolean(),
      marketingEmails: z.boolean(),
      publicProfile: z.boolean(),
      showProgress: z.boolean(),
      showAchievements: z.boolean(),
    })
    .optional(),
  avatar: z.string().optional(),
});

type TutorProfileData = {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    title: string;
    experience: number;
    course: string;
    hourlyRate?: number;
    location: string;
    timezone: string;
    language: string;
    avatar: string;
    skills: string[];
    education: string[];
    certifications: string[];
  };
  socialLinks: {
    website: string;
    linkedin: string;
    twitter: string;
    github: string;
    youtube: string;
    instagram: string;
  };
  availability: TutorAvailability;
  preferences: UserPreferences;
};

type TutorProfileResponse = { error: string } | TutorProfileData;

const getNames = (fullName?: string | null) => {
  if (!fullName) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = fullName.trim().split(" ");
  return { firstName, lastName: rest.join(" ") };
};

const normalizePreferences = (input?: unknown): UserPreferences => {
  const normalized: UserPreferences = { ...defaultUserPreferences };
  if (!input || typeof input !== "object") {
    return normalized;
  }

  const source = input as Record<string, unknown>;
  (Object.keys(defaultUserPreferences) as Array<
    keyof typeof defaultUserPreferences
  >).forEach((key) => {
    if (typeof source[key] === "boolean") {
      normalized[key] = source[key] as boolean;
    }
  });

  return normalized;
};

const normalizeAvailability = (input?: unknown): TutorAvailability => {
  if (!input || typeof input !== "object") {
    return { ...defaultAvailability };
  }
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ...defaultAvailability };
  }
  return parsed.data;
};

const cleanList = (items?: string[]) =>
  (items ?? [])
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export async function getTutorProfileData(): Promise<TutorProfileResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [user, tutor] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        bio: true,
        location: true,
        website: true,
        timezone: true,
        language: true,
        socialLinks: true,
        preferences: true,
        image: true,
        avatar: true,
      },
    }),
    db.tutor.findUnique({
      where: { userId: session.user.id },
      select: {
        title: true,
        expertise: true,
        experience: true,
        education: true,
        certifications: true,
        hourlyRate: true,
        course: true,
        availability: true,
      },
    }),
  ]);

  if (!user) {
    return { error: "User not found" };
  }

  if (!tutor) {
    return { error: "Tutor profile not found" };
  }

  const { firstName, lastName } = getNames(user.name);
  const socialLinks =
    user.socialLinks && typeof user.socialLinks === "object"
      ? (user.socialLinks as Record<string, string>)
      : {};

  return {
    profile: {
      firstName,
      lastName,
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
      title: tutor.title || "",
      experience: tutor.experience ?? 0,
      course: tutor.course || "",
      hourlyRate: tutor.hourlyRate ?? undefined,
      location: user.location || "",
      timezone: user.timezone || "Africa/Lagos",
      language: user.language || "en",
      avatar: user.image || user.avatar || "",
      skills: tutor.expertise ?? [],
      education: tutor.education ?? [],
      certifications: tutor.certifications ?? [],
    },
    socialLinks: {
      website: user.website || socialLinks.website || "",
      linkedin: socialLinks.linkedin || "",
      twitter: socialLinks.twitter || "",
      github: socialLinks.github || "",
      youtube: socialLinks.youtube || "",
      instagram: socialLinks.instagram || "",
    },
    availability: normalizeAvailability(tutor.availability),
    preferences: normalizePreferences(user.preferences),
  };
}

export async function updateTutorProfile(
  input: z.infer<typeof tutorProfileSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const normalizedPreferences = normalizePreferences(input.preferences);
  const normalizedAvailability = normalizeAvailability(input.availability);
  const parsed = tutorProfileSchema.safeParse({
    ...input,
    preferences: normalizedPreferences,
    availability: normalizedAvailability,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const cleanedSkills = cleanList(data.skills);
  const cleanedEducation = cleanList(data.education);
  const cleanedCertifications = cleanList(data.certifications);
  const mergedPreferences = normalizePreferences(data.preferences);
  const socialLinks = data.socialLinks ?? {};
  const availability = data.availability ?? defaultAvailability;

  await Promise.all([
    db.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName || undefined,
        phone: data.phone || null,
        bio: data.bio || null,
        location: data.location || null,
        timezone: data.timezone || null,
        language: data.language || null,
        website: socialLinks.website || null,
        socialLinks,
        preferences: mergedPreferences,
        image: data.avatar || null,
        avatar: data.avatar || null,
      },
    }),
    db.tutor.update({
      where: { userId: session.user.id },
      data: {
        title: data.title?.trim() || undefined,
        expertise: cleanedSkills,
        experience: data.experience ?? 0,
        education: cleanedEducation,
        certifications: cleanedCertifications,
        hourlyRate: data.hourlyRate ?? null,
        course: data.course || null,
        availability,
        timezone: data.timezone || null,
      },
    }),
  ]);

  return { success: true };
}
