import { auth } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT, DEFAULT_LOGIN_REDIRECTS } from "@/routes";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as keyof typeof DEFAULT_LOGIN_REDIRECTS;
  const roleRedirect = role ? DEFAULT_LOGIN_REDIRECTS[role] : undefined;

  redirect(roleRedirect || DEFAULT_LOGIN_REDIRECT);
}
