import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Program",
  description:
    "Connect with experienced mentors one-on-one for interview prep, code reviews, career guidance, and personalized learning paths at PalmTechnIQ.",
  alternates: {
    canonical: "/features/mentorship",
  },
  openGraph: {
    title: "Mentorship Program | PalmTechnIQ",
    description:
      "One-on-one mentorship for interview prep, code reviews, career guidance, and personalized learning paths.",
    url: "https://palmtechniq.com/features/mentorship",
    type: "website",
  },
};

export default function FeatureMentorshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
