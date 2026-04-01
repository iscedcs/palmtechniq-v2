import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://palmtechniq.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/student/",
          "/tutor/",
          "/mentor/",
          "/login",
          "/signup",
          "/forgot-password",
          "/new-password",
          "/verify",
          "/enroll/verify",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
