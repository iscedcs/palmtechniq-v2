/**
 * Turn a User-Agent header into the device / browser / OS the analytics
 * dashboard groups by.
 *
 * This lived as two identical copies (lib/analytics/track.ts and
 * app/api/analytics/track/route.ts), and both tested the OS in the wrong order:
 *
 *   - every iPhone and iPad UA contains "like Mac OS X", so checking "mac os"
 *     first reported iPhones as macOS;
 *   - every Android UA contains "Linux", so checking "linux" first reported
 *     Android as Linux.
 *
 * Those are the two largest audiences the site has, and the dashboard's OS and
 * device breakdown would have shown them as desktop operating systems. The
 * more specific platform is now tested before the one it is built on.
 *
 * This is a heuristic on a header the client controls, good enough to group a
 * dashboard and nothing more. Never use it for anything that has to be right.
 */
export function parseUserAgent(ua: string | null | undefined): {
  device: string;
  browser: string;
  os: string;
} {
  if (!ua) return { device: "unknown", browser: "unknown", os: "unknown" };

  let device = "desktop";
  if (/ipad|tablet/i.test(ua)) device = "tablet";
  // Android phones say "Mobile" in their UA; Android tablets do not.
  else if (/android/i.test(ua) && !/mobile/i.test(ua)) device = "tablet";
  else if (/mobile|android|iphone/i.test(ua)) device = "mobile";

  // Order matters: Edge and Opera identify as Chrome, and Chrome identifies as
  // Safari, so the more specific name has to be tested first.
  let browser = "unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  // Order matters here too — see the note at the top of the file.
  let os = "unknown";
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}
