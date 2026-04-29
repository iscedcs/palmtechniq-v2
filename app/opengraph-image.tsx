import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PalmTechnIQ - Advanced E-Learning Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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

      {/* Logo palm icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
          }}>
          🖐️
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          display: "flex",
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#f8fafc",
          marginBottom: "16px",
        }}>
        PalmTechnIQ
      </div>

      {/* Subtitle */}
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#94a3b8",
          marginBottom: "40px",
          textAlign: "center",
          maxWidth: "700px",
        }}>
        Advanced E-Learning Platform
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          gap: "16px",
        }}>
        {["AI & Data Science", "Web Development", "Expert Mentorship"].map(
          (tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10b981",
                fontSize: 18,
                fontWeight: 600,
              }}>
              {tag}
            </div>
          ),
        )}
      </div>

      {/* URL footer */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          display: "flex",
          fontSize: 18,
          color: "#64748b",
        }}>
        palmtechniq.com
      </div>
    </div>,
    { ...size },
  );
}
