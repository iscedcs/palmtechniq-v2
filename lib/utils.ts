import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx for type-safe class name manipulation.
 *
 * This utility function combines the functionality of clsx and tailwind-merge
 * to provide a convenient way to conditionally merge Tailwind CSS class names.
 * It ensures type safety and proper class name resolution.
 *
 * @param inputs - An array of class values to merge.
 * @returns A string containing the merged and resolved class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the strength of a password based on specific criteria.
 *
 * The strength is determined by the number of criteria the password meets:
 * - Length of at least 8 characters
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one number
 * - Contains at least one special character (! @ # $ % ^ & *)
 *
 * @param password - The password string to evaluate.
 * @returns An object containing:
 *          - strength: The strength level (0-5)
 *          - label: A human-readable strength label
 *          - color: The Tailwind CSS class for the strength color
 */
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

/**
 * Generates a random avatar URL for a given name using DiceBear Identicon.
 *
 * This function creates a unique avatar based on the provided name, or generates
 * a random avatar if no name is given. The avatars are generated using the DiceBear
 * Identicon service, ensuring a consistent avatar for the same name.
 *
 * @param name - Optional. The name to generate an avatar for. If not provided, a random seed will be used.
 * @returns A URL string pointing to the generated SVG avatar.
 */
export function generateRandomAvatar(name?: string): string {
  // Option 1: DiceBear avatars (unique per seed)
  if (name) {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      name,
    )}`;
  }

  // Option 2: Random seed if no name provided
  const randomSeed = Math.random().toString(36).substring(2, 10);
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${randomSeed}`;
}

/**
 * Formats a number as a Nigerian Naira (₦) currency string.
 *
 * This function takes a number and converts it to a locale-specific currency format
 * for Nigerian Naira. It removes decimal places for cleaner display of whole numbers.
 *
 * @param amount - The number to format as currency.
 * @returns A formatted string with the currency symbol (e.g., "₦10,000").
 */
export const formatToNaira = (amount: number): string => {
  if (typeof amount !== "number") return amount;
  return amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Generates a URL-friendly "slug" from a given title string.
 *
 * The slug is created by:
 * 1. Converting the title to lowercase
 * 2. Replacing any sequence of whitespace characters with a single hyphen
 * 3. Removing any characters that are not letters, numbers, or hyphens
 *
 * This is useful for creating clean, SEO-friendly URL segments from titles.
 *
 * @param title - The title string to convert into a slug.
 * @returns The generated slug string.
 */
export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

/**
 * Generates initials from a given name string.
 *
 * If the name has two or more words, it returns the first letter of the first word
 * and the first letter of the second word (e.g., "John Doe" → "JD").
 *
 * If the name has only one word, it returns the first letter of that word
 * (e.g., "Cher" → "C").
 *
 * If the name is empty or invalid, it returns an empty string.
 *
 * @param name - The name string to extract initials from.
 * @returns The initials string, or an empty string if the name is invalid.
 */
export function getInitials(name: string): string {
  const words = name.trim().split(" ");

  if (words.length >= 2) {
    const firstInitial = words[0].charAt(0);
    const secondInitial = words[1].charAt(0);
    return `${firstInitial}${secondInitial}`;
  }

  return words[0].charAt(0);
}

/**
 * Capitalizes the first letter of each word in a string.
 *
 * This function takes a string and converts it to title case, where:
 * - The first letter of the entire string is capitalized
 * - The first letter following any whitespace character is capitalized
 * - All other letters are converted to lowercase
 *
 * @param inputString - The string to capitalize.
 * @returns The capitalized string, or an empty string if the input is invalid.
 */
export function capitalizeWords(inputString: string | undefined): string {
  if (!inputString || typeof inputString !== "string") {
    return "";
  }
  return inputString.replace(/[A-Z]/g, (match, index) => {
    return index === 0 ? match : ` ${match}`;
  });
}

/**
 * Converts a string into a URL-friendly "slug" format.
 *
 * The slug is created by:
 * - Converting the string to lowercase
 * - Removing any leading/trailing whitespace
 * - Replacing any characters that are not letters, numbers, spaces, or hyphens with an empty string
 * - Replacing any spaces with hyphens
 * - Collapsing consecutive hyphens into a single hyphen
 *
 * @param str - The input string to convert.
 * @returns A URL-friendly slug string.
 */
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

/**
 * Formats a given number of seconds into a human-readable time string.
 *
 * The function supports displaying time in days, hours, and minutes.
 * If the total duration is less than a day, it shows hours and minutes.
 * If the total duration is less than an hour, it shows only minutes.
 *
 * @param seconds - The total number of seconds to format.
 * @returns A formatted time string (e.g., "2d 5h 30m", "4h 15m", "45m").
 */
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

/**
 * Converts minutes to a human-readable format (e.g., "1 hr 30 min", "45 min", "2 hr").
 *
 * @param minutes - The number of minutes to convert.
 * @returns A formatted string representing the duration.
 */
export const formatDurationMinutes = (minutes?: number | string) => {
  const normalized =
    typeof minutes === "number"
      ? minutes
      : parseFloat(String(minutes ?? 0));
  if (!Number.isFinite(normalized) || normalized <= 0) return "0 min";
  const hrs = Math.floor(normalized / 60);
  const mins = Math.round(normalized % 60);
  if (hrs <= 0) return `${mins} min`;
  if (mins <= 0) return `${hrs} hr${hrs === 1 ? "" : "s"}`;
  return `${hrs} hr${hrs === 1 ? "" : "s"} ${mins} min${mins === 1 ? "" : "s"}`;
};

/**
 * Checks if a URL is external (points to a different domain).
 *
 * This function determines whether a given URL belongs to a different domain
 * than the current website. It performs a simple check to see if the URL starts
 * with "http" or "https" followed by "://", indicating an external absolute URL.
 *
 * @param url - The URL string to check.
 * @returns True if the URL is external, false otherwise.
 */
export const isExternal = (url: string) => /^https?:\/\//i.test(url);
