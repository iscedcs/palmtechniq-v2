import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Superior Dashboard",
  description: "Superior administration panel",
};

export default function SuperiorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
