import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PalmTechnIQ",
    short_name: "PalmTechnIQ",
    description:
      "Learn any skill — from tailoring and auto repair to design, coding and AI. Or teach what you know and earn from it.",
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
