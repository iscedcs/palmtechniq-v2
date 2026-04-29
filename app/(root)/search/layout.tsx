import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for courses, tutors, and categories on PalmTechnIQ.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
