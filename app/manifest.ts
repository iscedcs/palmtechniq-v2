import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PalmTechnIQ",
    short_name: "PalmTechnIQ",
    description:
      "Advanced e-learning platform for AI, web development, data science, and career-focused technical skills.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#10b981",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/assets/standalone.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/standalone.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/assets/standalone.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
