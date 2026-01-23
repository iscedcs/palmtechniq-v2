"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  defaultUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

type ProfileExtras = {
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
};

type StudentProfileData = {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    dateOfBirth: string;
    timezone: string;
    language: string;
    occupation: string;
    company: string;
    website: string;
    github: string;
    linkedin: string;
    joinDate: string;
    avatar: string;
  };
  preferences: UserPreferences;
  goals: string[];
  interests: string[];
  streak: number;
  rank: string;
};

type StudentProfileResponse = { error: string } | StudentProfileData;
type StudentGoalsResponse = { error: string } | { goals: string[] };
type StudentAvatarResponse = { error: string } | { avatar: string };

const languageDisplayMap: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
};

const languageCodeMap: Record<string, string> = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
};

const getNames = (fullName?: string | null) => {
  if (!fullName) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = fullName.trim().split(" ");
  return { firstName, lastName: rest.join(" ") };
};

const normalizePreferences = (input?: unknown): UserPreferences => {
  if (!input || typeof input !== "object") {
    return { ...defaultUserPreferences };
  }
  return { ...defaultUserPreferences, ...(input as Partial<UserPreferences>) };
};

const getProfileExtras = (preferences?: unknown): ProfileExtras => {
  if (!preferences || typeof preferences !== "object") {
    return {};
  }
  const extras = (preferences as { profileExtras?: ProfileExtras })
    .profileExtras;
  return extras ?? {};
};

export async function getStudentProfileData(): Promise<StudentProfileResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [user, student] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        location: true,
        bio: true,
        timezone: true,
        language: true,
        website: true,
        socialLinks: true,
        image: true,
        createdAt: true,
        preferences: true,
      },
    }),
    db.student.findUnique({
      where: { userId: session.user.id },
      select: {
        goals: true,
        interests: true,
        streak: true,
        currentRank: true,
      },
    }),
  ]);

  if (!user) {
    return { error: "User not found" };
  }

  const { firstName, lastName } = getNames(user.name);
  const socialLinks =
    user.socialLinks && typeof user.socialLinks === "object"
      ? (user.socialLinks as Record<string, string>)
      : {};
  const profileExtras = getProfileExtras(user.preferences);

  return {
    profile: {
      firstName,
      lastName,
      email: user.email || "",
      phone: user.phone || "",
      location: user.location || "",
      bio: user.bio || "",
      dateOfBirth: profileExtras.dateOfBirth || "",
      timezone: user.timezone || "Africa/Lagos",
      language: languageDisplayMap[user.language || "en"] || "English",
      occupation: profileExtras.occupation || "",
      company: profileExtras.company || "",
      website: user.website || "",
      github: socialLinks.github || "",
      linkedin: socialLinks.linkedin || "",
      joinDate: user.createdAt.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      avatar: user.image || "",
    },
    preferences: normalizePreferences(user.preferences),
    goals: student?.goals ?? [],
    interests: student?.interests ?? [],
    streak: student?.streak ?? 0,
    rank: student?.currentRank ?? "",
  };
}

type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  bio: string;
  dateOfBirth: string;
  timezone: string;
  language: string;
  occupation: string;
  company: string;
  website: string;
  github: string;
  linkedin: string;
};

export async function updateStudentProfile(input: UpdateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { socialLinks: true, preferences: true },
  });

  const socialLinks =
    user?.socialLinks && typeof user.socialLinks === "object"
      ? (user.socialLinks as Record<string, string>)
      : {};

  const existingPreferences = normalizePreferences(user?.preferences);
  const profileExtras = getProfileExtras(user?.preferences);

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: fullName || undefined,
      phone: input.phone || null,
      location: input.location || null,
      bio: input.bio || null,
      timezone: input.timezone || null,
      language: languageCodeMap[input.language] || input.language || "en",
      website: input.website || null,
      socialLinks: {
        ...socialLinks,
        github: input.github,
        linkedin: input.linkedin,
      },
      preferences: {
        ...existingPreferences,
        profileExtras: {
          ...profileExtras,
          dateOfBirth: input.dateOfBirth,
          occupation: input.occupation,
          company: input.company,
        },
      },
    },
  });

  return { success: true };
}

export async function updateStudentAvatar(
  avatarUrl: string
): Promise<StudentAvatarResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!avatarUrl) {
    return { error: "Invalid image URL" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { image: avatarUrl, avatar: avatarUrl },
  });

  return { avatar: avatarUrl };
}

export async function addStudentGoal(
  goal: string
): Promise<StudentGoalsResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { goals: true },
  });

  if (!student) {
    return { error: "Student profile not found" };
  }

  const nextGoals = Array.from(
    new Set([...(student.goals || []), goal.trim()])
  ).filter(Boolean);

  await db.student.update({
    where: { userId: session.user.id },
    data: { goals: nextGoals },
  });

  return { goals: nextGoals };
}
