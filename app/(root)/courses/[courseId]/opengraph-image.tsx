import { ImageResponse } from "next/og";
import { getCourseById } from "@/data/course";

export const runtime = "edge";
export const alt = "Course on PalmTechnIQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  let title = "Course";
  let subtitle = "PalmTechnIQ";
  let level = "";
  let tutorName = "";

  try {
    const course = await getCourseById(courseId);
    if (course) {
      title = course.title;
      subtitle = course.subtitle || course.description?.slice(0, 100) || "";
      level = course.level || "";
      tutorName = course.tutor?.user?.name || "";
    }
  } catch {
    // Fallback to defaults
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "sans-serif",
      }}>
      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #10b981, #059669, #10b981)",
        }}
      />

      {/* Top section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Level badge */}
        {level && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              fontSize: 16,
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
            {level}
          </div>
        )}

        {/* Course title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 50 ? 40 : 48,
            fontWeight: 800,
            color: "#f8fafc",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
          }}>
          {title.length > 80 ? `${title.slice(0, 77)}...` : title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#94a3b8",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}>
            {subtitle.length > 120 ? `${subtitle.slice(0, 117)}...` : subtitle}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}>
        {/* Tutor info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {tutorName && (
            <>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                }}>
                {tutorName.charAt(0).toUpperCase()}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}>
                <div style={{ color: "#cbd5e1", fontSize: 14 }}>Instructor</div>
                <div
                  style={{ color: "#f8fafc", fontSize: 18, fontWeight: 600 }}>
                  {tutorName}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#10b981",
            }}>
            PalmTechnIQ
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
