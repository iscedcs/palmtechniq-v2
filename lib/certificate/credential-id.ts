import { db } from "@/lib/db";
import crypto from "crypto";

export type CertificateCategory = "PROGRAM" | "COURSE" | "VOLUNTEER" | "GENERAL";

/**
 * Generate a random alphanumeric string excluding confusing characters (0, O, 1, I, L)
 */
function generateRandomCode(length: number): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate formatted Credential ID based on certificate category and year.
 *
 * Formats:
 * - PROGRAM: PTQ-PRG-2026-9F3K8A
 * - COURSE: PTQ-CRS-2026-4B7E2W
 * - VOLUNTEER: PTV-2026-P0X8
 * - GENERAL: PTQ-2026-7H2M9Q
 */
export function generateCredentialId(
  type: CertificateCategory = "PROGRAM",
  year: number = new Date().getFullYear(),
): string {
  switch (type) {
    case "PROGRAM":
      return `PTQ-PRG-${year}-${generateRandomCode(6)}`;
    case "COURSE":
      return `PTQ-CRS-${year}-${generateRandomCode(6)}`;
    case "VOLUNTEER":
      return `PTV-${year}-${generateRandomCode(4)}`;
    case "GENERAL":
    default:
      return `PTQ-${year}-${generateRandomCode(6)}`;
  }
}

/**
 * Check if a credential ID is unique across both Certificate and VolunteerCertificate models.
 */
export async function isCredentialIdUnique(credentialId: string): Promise<boolean> {
  const trimmed = credentialId.trim().toUpperCase();
  if (!trimmed) return false;

  const [regularCert, volunteerCert] = await Promise.all([
    db.certificate.findUnique({
      where: { certificateId: trimmed },
      select: { id: true },
    }),
    db.volunteerCertificate.findUnique({
      where: { certCode: trimmed },
      select: { id: true },
    }),
  ]);

  return !regularCert && !volunteerCert;
}

/**
 * Generates an assured unique Credential ID with collision checks.
 */
export async function generateUniqueCredentialId(
  type: CertificateCategory = "PROGRAM",
  year: number = new Date().getFullYear(),
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const candidate = generateCredentialId(type, year);
    const isUnique = await isCredentialIdUnique(candidate);
    if (isUnique) {
      return candidate;
    }
    attempts++;
  }

  // Fallback with timestamp suffix if heavily contended
  const base = generateCredentialId(type, year);
  return `${base}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

/**
 * Helper to build public verification URL for a certificate.
 */
export function getVerificationUrl(credentialId: string, baseUrl: string = ""): string {
  const code = encodeURIComponent(credentialId.trim());
  return `${baseUrl}/verify-certificate?code=${code}`;
}
