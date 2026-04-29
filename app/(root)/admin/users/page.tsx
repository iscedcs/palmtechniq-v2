import { getAdminUsersPageData } from "@/actions/admin-dashboard";
import AdminUsersClient from "@/app/(root)/admin/users/users-client";

export const dynamic = "force-dynamic";
export default async function AdminUsersPage() {
  const res = await getAdminUsersPageData();

  return (
    <AdminUsersClient
      initialStats={
        "stats" in res
          ? (res.stats ?? {
              totalUsers: 0,
              activeUsers: 0,
              suspendedUsers: 0,
              admins: 0,
              mentors: 0,
              tutors: 0,
              students: 0,
            })
          : {
              totalUsers: 0,
              activeUsers: 0,
              suspendedUsers: 0,
              admins: 0,
              mentors: 0,
              tutors: 0,
              students: 0,
            }
      }
      initialUsers={"users" in res ? (res.users ?? []) : []}
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
