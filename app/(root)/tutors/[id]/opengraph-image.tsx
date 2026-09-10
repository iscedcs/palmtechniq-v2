import { ImageResponse } from "next/og";
import { getTutorPublicReviewProfile } from "@/actions/review";

export const alt = "Instructor Profile on PalmTechnIQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/**
 * Fetch a tutor avatar and inline it as a base64 data URI.
 * Satori decodes PNG, JPEG and GIF only. If fetch fails, times out, or returns
 * an unsupported format, degrade gracefully to an initials avatar badge.
 */
async function inlineAvatar(url: string | null): Promise<string | null> {
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
    if (buffer.byteLength < 500) return null;

    return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tutorName = "PalmTechnIQ Instructor";
  let tutorTitle = "Expert Tech Instructor & Mentor";
  let bio = "Practical tech education, industry-ready skills, and personalized 1-on-1 mentorship.";
  let avatarSrc: string | null = null;
  let expertiseList: string[] = [];
  let experience = 0;
  let courseCount = 0;
  let rating = 0;
  let reviewCount = 0;
  let isVerified = false;
  let hourlyRate: number | null = null;

  try {
    const data = await getTutorPublicReviewProfile(id);
    if (data?.tutor) {
      const tutor = data.tutor;
      tutorName = tutor.name || tutorName;
      tutorTitle = tutor.title || tutorTitle;
      if (tutor.bio) {
        bio =
          tutor.bio.length > 130
            ? `${tutor.bio.slice(0, 127)}...`
            : tutor.bio;
      }
      expertiseList = Array.isArray(tutor.expertise)
        ? tutor.expertise.slice(0, 4)
        : [];
      experience = tutor.experience || 0;
      courseCount = Array.isArray(tutor.courses) ? tutor.courses.length : 0;
      rating = tutor.averageRating || 0;
      reviewCount = tutor.totalReviews || 0;
      isVerified = Boolean(tutor.isVerified);
      hourlyRate = tutor.hourlyRate || null;

      if (tutor.avatar) {
        avatarSrc = await inlineAvatar(tutor.avatar);
      }
    }
  } catch {
    // Graceful fallback to default instructor branding
  }

  // Generate initials for avatar fallback
  const initials = tutorName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PT";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 64px",
          background:
            "linear-gradient(135deg, #0a0f1d 0%, #0f172a 50%, #022c22 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}>
        {/* Top brand accent bar */}
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

        {/* Top Header: Brand + Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}>
          {/* Logo & Platform Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}>
              🖐️
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#f8fafc",
                }}>
                PalmTechnIQ
              </div>
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#10b981",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
            {isVerified ? "✓ Verified Instructor" : "Expert Instructor"}
          </div>
        </div>

        {/* Main Center Section: Tutor Profile Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            background: "rgba(30, 41, 59, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            borderRadius: "24px",
            padding: "36px 42px",
            margin: "16px 0",
          }}>
          {/* Avatar (Inlined image or styled initials) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={tutorName}
                width={130}
                height={130}
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "65px",
                  objectFit: "cover",
                  border: "3px solid #10b981",
                }}
              />
            ) : (
              <div
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "65px",
                  background: "linear-gradient(135deg, #10b981, #047857)",
                  border: "3px solid rgba(16, 185, 129, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 50,
                  fontWeight: 800,
                }}>
                {initials}
              </div>
            )}

            {/* Rating Pill if rating exists */}
            {rating > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "rgba(234, 179, 8, 0.15)",
                  border: "1px solid rgba(234, 179, 8, 0.35)",
                  color: "#facc15",
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                ★ {rating.toFixed(1)} {reviewCount > 0 ? `(${reviewCount})` : ""}
              </div>
            )}
          </div>

          {/* Tutor Information */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flex: 1,
            }}>
            <div
              style={{
                display: "flex",
                fontSize: tutorName.length > 25 ? 38 : 44,
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}>
              {tutorName}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 21,
                fontWeight: 600,
                color: "#34d399",
                letterSpacing: "-0.01em",
              }}>
              {tutorTitle}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "#94a3b8",
                lineHeight: 1.45,
                marginTop: "2px",
              }}>
              {bio}
            </div>

            {/* Stats & Highlights Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}>
              {courseCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    color: "#a7f3d0",
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                  📚 {courseCount} {courseCount === 1 ? "Course" : "Courses"}
                </div>
              )}

              {experience > 0 && (
                <div
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    color: "#bae6fd",
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                  💼 {experience}+ Years Exp
                </div>
              )}

              {hourlyRate && hourlyRate > 0 && (
                <div
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    color: "#e9d5ff",
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                  🎯 1-on-1 Mentorship Available
                </div>
              )}

              {expertiseList.map((skill) => (
                <div
                  key={skill}
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#cbd5e1",
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#64748b",
              fontWeight: 500,
            }}>
            palmtechniq.com/tutors/{id}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: 18,
              fontWeight: 600,
              color: "#10b981",
            }}>
            Learn with expert guidance →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
