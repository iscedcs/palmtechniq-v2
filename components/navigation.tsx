import { auth } from "@/auth";
import { PublicNavigation } from "./navigation/public-navigation";
import { AuthenticatedNavigation } from "./navigation/authenticated-navigation";

export async function Navigation() {
  let session = null;
  try {
    session = await auth();
  } catch (error: unknown) {
    // Silently handle static generation — auth() uses headers() which is unavailable during build
    if (error instanceof Error && error.message?.includes("headers")) {
      // Expected during static build, no need to log
    } else {
      console.error("Error fetching session:", error);
    }
  }

  // Show public navigation for unauthenticated users
  if (!session) {
    return <PublicNavigation />;
  }

  // Show authenticated navigation for authenticated users
  return <AuthenticatedNavigation />;
}
