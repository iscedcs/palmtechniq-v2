import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminEnrollmentUI from "@/components/admin/enrollment-management";

export const dynamic = "force-dynamic";

export default async function AdminCourseEnrollmentsPage(props: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const { courseId } = await props.params;

  // Fetch course with enrollments
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      tutor: { select: { user: { select: { name: true } } } },
      category: { select: { name: true } },
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
      _count: {
        select: {
          enrollments: true,
          modules: true,
        },
      },
    },
  });

  if (!course) {
    redirect("/admin/courses");
  }

  // Fetch all students with STUDENT role
  const allStudents = await db.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Manage Course Enrollments
          </h1>
          <p className="text-gray-400">
            Add or manage students enrolled in {course.title}
          </p>
        </div>

        {/* Course Info Card */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">{course.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Category</p>
                <p className="text-sm text-white mt-2">{course.category.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Instructor</p>
                <p className="text-sm text-white mt-2">
                  {course.tutor.user.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Price</p>
                <p className="text-sm text-white mt-2">
                  ₦{course.currentPrice || course.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Modules</p>
                <p className="text-sm text-white mt-2">
                  {course._count.modules}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Management UI */}
        <AdminEnrollmentUI
          courseId={courseId}
          enrollments={course.enrollments.map((enrollment) => ({
            id: enrollment.id,
            user: enrollment.user,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
          }))}
          availableStudents={allStudents}
        />
      </div>
    </div>
  );
}
