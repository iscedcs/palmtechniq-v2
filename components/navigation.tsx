import { auth } from "@/auth";
import { PublicNavigation } from "./navigation/public-navigation";
import { AuthenticatedNavigation } from "./navigation/authenticated-navigation";

export async function Navigation() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    // During build or when DATABASE_URL is not available
    console.error("Error fetching session:", error);
  }

  // Show public navigation for unauthenticated users
  if (!session) {
    return <PublicNavigation />;
  }

  // Show authenticated navigation for authenticated users
  return <AuthenticatedNavigation />;
}
