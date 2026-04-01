import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Marketplace",
  description:
    "Browse and book one-on-one mentorship sessions with experienced tech professionals. Get personalized guidance for interviews, code reviews, and career growth.",
  alternates: {
    canonical: "/mentorship",
  },
  openGraph: {
    title: "Mentorship Marketplace | PalmTechnIQ",
    description:
      "Book one-on-one mentorship sessions with experienced tech professionals for career growth.",
    url: "https://palmtechniq.com/mentorship",
    type: "website",
  },
};

export default function MentorshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
