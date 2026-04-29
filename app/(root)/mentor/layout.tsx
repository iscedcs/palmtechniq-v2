import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MentorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  // Only allow MENTOR and TUTOR roles (MENTOR is the new role, TUTOR for legacy compatibility)
  if (
    !session?.user?.id ||
    (session.user.role !== "MENTOR" && session.user.role !== "TUTOR")
  ) {
    redirect("/");
  }

  return <>{children}</>;
}
