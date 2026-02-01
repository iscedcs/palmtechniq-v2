import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: "" };

  let strength = 0;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[@₦!%*?&]/.test(password),
  ];

  strength = checks.filter(Boolean).length;

  const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "text-red-400",
    "text-orange-400",
    "text-yellow-400",
    "text-blue-400",
    "text-green-400",
  ];

  return { strength, label: labels[strength], color: colors[strength] };
};

// lib/utils.ts
export function generateRandomAvatar(name?: string): string {
  // Option 1: DiceBear avatars (unique per seed)
  if (name) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=₦{encodeURIComponent(
      name
    )}`;
  }

  // Option 2: Random seed if no name provided
  const randomSeed = Math.random().toString(36).substring(2, 10);
  return `https://api.dicebear.com/7.x/identicon/svg?seed=₦{randomSeed}`;
}

export const formatToNaira = (amount: number): string => {
  if (typeof amount !== "number") return amount;
  return amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}
export function getInitials(name: string): string {
  const words = name.trim().split(" ");

  if (words.length >= 2) {
    const firstInitial = words[0].charAt(0);
    const secondInitial = words[1].charAt(0);
    return `₦{firstInitial}₦{secondInitial}`;
  }

  return words[0].charAt(0);
}

export function capitalizeWords(inputString: string | undefined): string {
  if (!inputString || typeof inputString !== "string") {
    return "";
  }
  return inputString.replace(/[A-Z]/g, (match, index) => {
    return index === 0 ? match : ` ₦{match}`;
  });
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Formats a string representing class days by applying specific transformations:
 * - Trims leading and trailing whitespace.
 * - Replaces occurrences of "and" (case-insensitive) surrounded by optional spaces with "--".
 * - Removes all remaining whitespace.
 *
 * @param days - The input string representing class days.
 * @returns The formatted string with the specified transformations applied.
 */
export function formatClassDays(days: string): string {
  return days
    .trim()
    .replace(/\s*and\s*/gi, "--")
    .replace(/\s+/g, "");
}

/**
 * Formats a given Date object into a compact ISO 8601 string.
 *
 * The resulting string removes dashes, colons, and milliseconds,
 * and appends a "Z" to indicate UTC time.
 *
 * @param date - The Date object to format.
 * @returns A formatted string representing the date in UTC.
 */
export const formatDate = (date: Date) => {
  return (
    date
      .toISOString()
      .replace(/-|:|\.\d{3}/g, "")
      .split(".")[0] + "Z"
  );
};

export const formatTime = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
};

export const formatDurationMinutes = (minutes?: number) => {
  const normalized =
    typeof minutes === "number" ? minutes : Number(minutes ?? 0);
  if (!Number.isFinite(normalized) || normalized <= 0) return "0 min";
  const hrs = Math.floor(normalized / 60);
  const mins = Math.round(normalized % 60);
  if (hrs <= 0) return `${mins} min`;
  if (mins <= 0) return `${hrs} hr${hrs === 1 ? "" : "s"}`;
  return `${hrs} hr${hrs === 1 ? "" : "s"} ${mins} min${
    mins === 1 ? "" : "s"
  }`;
};

export const isExternal = (url: string) => /^https?:\/\//i.test(url);
