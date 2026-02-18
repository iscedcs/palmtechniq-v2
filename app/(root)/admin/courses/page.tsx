import { getAdminCoursesPageData } from "@/actions/admin-dashboard";
import AdminCoursesClient from "./courses-client";

export const dynamic = "force-dynamic";
export default async function AdminCoursesPage() {
  const res = await getAdminCoursesPageData();

  return (
    <AdminCoursesClient
      initialStats={
        "stats" in res
          ? (res.stats ?? {
              totalCourses: 0,
              draft: 0,
              published: 0,
              archived: 0,
              suspended: 0,
            })
          : {
              totalCourses: 0,
              draft: 0,
              published: 0,
              archived: 0,
              suspended: 0,
            }
      }
      initialCourses={"courses" in res ? (res.courses ?? []) : []}
      initialPagination={
        "pagination" in res
          ? (res.pagination ?? {
              page: 1,
              pageSize: 20,
              totalPages: 1,
              totalCount: 0,
            })
          : {
              page: 1,
              pageSize: 20,
              totalPages: 1,
              totalCount: 0,
            }
      }
    />
  );
}
