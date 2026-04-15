import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Checkout",
  robots: { index: false, follow: false },
};

export default function MentorshipCheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
