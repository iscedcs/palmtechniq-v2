import { fetchNavigationData } from "@/data/navigation";
import { PublicNavigationClient } from "./public-navigation-client";

export async function PublicNavigation() {
  const navigationData = await fetchNavigationData();

  const dataToPass = navigationData.success
    ? {
        coursesByLevel: navigationData.coursesByLevel || {},
        coursesByCategory: navigationData.coursesByCategory || {},
        courses: navigationData.courses || [],
        categories: navigationData.categories || [],
      }
    : {
        coursesByLevel: {},
        coursesByCategory: {},
        courses: [],
        categories: [],
      };

  return (
    <PublicNavigationClient
      coursesByLevel={dataToPass.coursesByLevel}
      coursesByCategory={dataToPass.coursesByCategory}
      courses={dataToPass.courses}
      categories={dataToPass.categories}
    />
  );
}
