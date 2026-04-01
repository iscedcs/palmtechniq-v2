import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about PalmTechnIQ — our mission to make quality tech education accessible, our values, team, and the story behind the platform.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About PalmTechnIQ",
    description:
      "Our mission is to make quality tech education accessible. Learn about our values, team, and vision.",
    url: "https://palmtechniq.com/about",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
