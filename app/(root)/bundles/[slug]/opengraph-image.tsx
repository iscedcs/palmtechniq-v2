import { ImageResponse } from "next/og";

import { getPublicBundle } from "@/actions/bundles";

export const alt = "Course bundle on PalmTechnIQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Scrapers cache aggressively anyway, and a bundle's price is the one thing
// that must not go stale in a shared card.
export const revalidate = 3600;

/**
 * Prices are written "NGN 100,000", not "₦100,000".
 *
 * satori has no system fonts and falls back to next/og's bundled Geist, which
 * has no glyph for U+20A6 — the symbol renders as an empty box. A share card
 * showing a tofu box where the price should be is worse than a plain currency
 * code, and the alternative (committing a subsetted font just for one glyph)
 * costs more than it returns. The rest of the app keeps ₦, where real
 * webfonts cover it.
 */
const naira = (value: number) => `NGN ${Math.round(value).toLocaleString()}`;

/**
 * Fetch a course thumbnail and inline it as a data URI.
 *
 * Passing the remote URL straight to satori looks simpler but is a trap: if
 * the object is missing the whole image route throws and the link falls back
 * to the site-wide card, which is the bug this file exists to fix. Some older
 * thumbnails point at a bucket that no longer exists, so a dead image has to
 * degrade to "no image", never to "no card".
 *
 * satori decodes PNG, JPEG and GIF only. A WebP would render as a blank box,
 * so anything else is dropped here rather than shipped broken.
 */
async function inlineImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      cache: "force-cache",
    });
    if (!response.ok) return null;

    const type = response.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpeg|jpg|gif)$/i.test(type)) return null;

    const buffer = await response.arrayBuffer();
    // Guard against a bucket that answers 200 with an error document.
    if (buffer.byteLength < 1024) return null;

    return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = "Course bundle";
  let tutorName = "";
  let courseCount = 0;
  let price = 0;
  let listSum = 0;
  let savingsPercent = 0;
  let images: string[] = [];

  try {
    const bundle = await getPublicBundle(slug);
    if (bundle) {
      title = bundle.title;
      tutorName = bundle.tutorName ?? "";
      courseCount = bundle.courses.length;
      price = bundle.price;
      listSum = bundle.listSum;
      savingsPercent = bundle.savingsPercent;

      // Resolved in parallel and filtered afterwards, so one dead thumbnail
      // does not cost the card the two that do load.
      const resolved = await Promise.all(
        bundle.courses
          .slice(0, 3)
          .map((course: { thumbnail: string | null }) =>
            inlineImage(course.thumbnail),
          ),
      );
      images = resolved.filter((value): value is string => Boolean(value));
    }
  } catch {
    // A text-only card still shares correctly.
  }

  const hasArt = images.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)",
          fontFamily: "sans-serif",
        }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            display: "flex",
            background: "linear-gradient(90deg, #10b981, #059669, #10b981)",
          }}
        />

        {/* Text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "44px",
            padding: "56px 48px 104px 48px",
            width: hasArt ? "740px" : "1200px",
          }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}>
              COURSE BUNDLE
            </div>

            <div
              style={{
                display: "flex",
                fontSize: title.length > 48 ? 40 : 50,
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}>
              {title.length > 90 ? `${title.slice(0, 87)}…` : title}
            </div>

            <div style={{ display: "flex", fontSize: 22, color: "#94a3b8" }}>
              {courseCount} {courseCount === 1 ? "course" : "courses"}
              {tutorName ? ` · by ${tutorName}` : ""}
            </div>
          </div>

          {/* The old price sits above rather than beside the new one. On the
              narrower column a single row of three items wrapped mid-figure,
              which turned the headline number into two broken lines. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {listSum > price && (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  color: "#64748b",
                  textDecoration: "line-through",
                }}>
                {naira(listSum)}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: hasArt ? 50 : 58,
                  fontWeight: 800,
                  color: "#f8fafc",
                  whiteSpace: "nowrap",
                }}>
                {naira(price)}
              </div>
              {savingsPercent > 0 && (
                <div
                  style={{
                    display: "flex",
                    padding: "6px 16px",
                    borderRadius: "9999px",
                    background: "#10b981",
                    color: "#052e1b",
                    fontSize: 22,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}>
                  Save {savingsPercent}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Anchored to the frame rather than the text column, so the mark sits
            in the same place whether or not the card has thumbnails. */}
        <div
          style={{
            position: "absolute",
            left: "48px",
            bottom: "44px",
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: "#10b981",
          }}>
          PalmTechnIQ
        </div>

        {/* Thumbnail column. Overlapping tiles read as "several courses in one
            purchase" at a glance, which a single flat image cannot. */}
        {hasArt && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "460px",
              padding: "40px 40px 40px 0",
            }}>
            {images.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={src}
                alt=""
                width={380}
                height={214}
                style={{
                  width: "380px",
                  height: "214px",
                  objectFit: "cover",
                  borderRadius: "14px",
                  border: "2px solid rgba(148, 163, 184, 0.28)",
                  marginTop: index === 0 ? 0 : "-64px",
                }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
