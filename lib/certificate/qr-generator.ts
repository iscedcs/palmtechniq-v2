import QRCode from "qrcode";

/**
 * Returns the canonical public certificate verification URL.
 */
export function getCertificateVerificationUrl(credentialId: string): string {
  const trimmed = credentialId.trim();
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://www.palmtechniq.com";

  return `${baseUrl.replace(/\/$/, "")}/verify-certificate?code=${encodeURIComponent(trimmed)}`;
}

/**
 * Generates a high-resolution PNG Data URL for a Certificate QR code.
 */
export async function generateCertificateQrDataUrl(
  credentialId: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  },
): Promise<string> {
  const url = getCertificateVerificationUrl(credentialId);

  return QRCode.toDataURL(url, {
    width: options?.width || 512,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.darkColor || "#000000",
      light: options?.lightColor || "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generates an SVG string for a Certificate QR code.
 */
export async function generateCertificateQrSvg(
  credentialId: string,
  options?: {
    width?: number;
    margin?: number;
  },
): Promise<string> {
  const url = getCertificateVerificationUrl(credentialId);

  return QRCode.toString(url, {
    type: "svg",
    width: options?.width || 512,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: "H",
  });
}
