import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles on AI, web development, data science, career tips, and tech education from PalmTechnIQ experts.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "PalmTechnIQ Blog",
    description:
      "Latest articles on AI, web development, data science, career tips, and tech education.",
    url: "https://palmtechniq.com/blog",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
