import "server-only";
import crypto from "crypto";
import QRCode from "qrcode";

/**
 * Base32 character set (RFC 4648)
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer to base32
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a base32 string to buffer
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random 20-byte base32 TOTP secret.
 */
export function generateTotpSecret(): string {
  const randomBuffer = crypto.randomBytes(20);
  return base32Encode(randomBuffer);
}

/**
 * Computes a 6-digit TOTP code for a given secret and counter.
 */
function generateTokenForCounter(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (code % 1_000_000).toString().padStart(6, "0");
  return otp;
}

/**
 * Verifies a 6-digit TOTP token against a secret with a window of ±1 (tolerating ±30s clock drift).
 */
export function verifyTotpToken(
  secret: string,
  token: string,
  timeStepSeconds = 30,
  window = 1,
): boolean {
  if (!token || token.trim().length !== 6) return false;
  const cleanToken = token.trim();

  try {
    const secretBuffer = base32Decode(secret);
    const currentCounter = Math.floor(Date.now() / 1000 / timeStepSeconds);

    for (let offset = -window; offset <= window; offset++) {
      const expectedToken = generateTokenForCounter(
        secretBuffer,
        currentCounter + offset,
      );
      if (crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(cleanToken))) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error verifying TOTP token:", error);
    return false;
  }
}

/**
 * Generates an otpauth:// URI and QR code data URL for Google Authenticator.
 */
export async function generateTotpQrCode(params: {
  secret: string;
  email: string;
  issuer?: string;
}): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
  const issuer = params.issuer || "PalmTechnIQ";
  const label = encodeURIComponent(`${issuer}:${params.email}`);
  const otpauthUrl = `otpauth://totp/${label}?secret=${params.secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  return { otpauthUrl, qrCodeDataUrl };
}
