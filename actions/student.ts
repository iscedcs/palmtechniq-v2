import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

export async function getTutorStudents() {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR") {
    return { students: [], stats: null };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return { students: [], stats: null };

  const enrollments = await db.enrollment.findMany({
    where: { course: { tutorId: tutor.id } },
    include: { user: true, course: true },
  });

  const userIds = Array.from(new Set(enrollments.map((e) => e.user.id)));

  // Batch queries instead of one-by-one in loop
  const [submissions, discussions] = await Promise.all([
    db.submission.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
    db.discussion.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
  ]);

  const submissionMap = new Map(
    submissions.map((s) => [s.userId, s._count._all])
  );
  const discussionMap = new Map(
    discussions.map((d) => [d.userId, d._count._all])
  );

  const studentsMap = new Map();

  for (const enr of enrollments) {
    const userId = enr.user.id;
    if (!studentsMap.has(userId)) {
      studentsMap.set(userId, {
        id: userId,
        name: enr.user.name || "Unnamed",
        email: enr.user.email || "",
        avatar: enr.user.image || "/placeholder.svg",
        joinDate: enr.user.createdAt.toISOString(),
        coursesEnrolled: [],
        totalProgress: 0,
        assignmentsSubmitted: submissionMap.get(userId) || 0,
        assignmentsPending: 0,
        messagesCount: discussionMap.get(userId) || 0,
        lastActive: enr.user.updatedAt
          ? formatDistanceToNow(new Date(enr.user.updatedAt), {
              addSuffix: true,
            })
          : "N/A",
        status: enr.user.isActive ? "active" : "inactive",
        country: enr.user.location || "",
        phone: enr.user.phone || "",
      });
    }
    const student = studentsMap.get(userId);
    student.coursesEnrolled.push({
      id: enr.course.id,
      title: enr.course.title,
      progress: enr.progress,
      status: enr.status,
    });
  }

  const students = Array.from(studentsMap.values()).map((s) => {
    const avg =
      s.coursesEnrolled.length > 0
        ? s.coursesEnrolled.reduce((a: any, c: any) => a + c.progress, 0) /
          s.coursesEnrolled.length
        : 0;
    s.totalProgress = Math.round(avg);
    return s;
  });

  const stats = {
    totalStudents: students.length,
    activeNow: students.filter((s) => s.status === "active").length,
    completedCourses: students.filter((s) =>
      s.coursesEnrolled.some((c: any) => c.status === "completed")
    ).length,
    averageProgress:
      students.length > 0
        ? Math.round(
            students.reduce((a, s) => a + s.totalProgress, 0) / students.length
          )
        : 0,
  };

  return { students, stats };
}

export async function getTutorStudentsWithTrends() {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR") {
    return { students: [], stats: null, trends: null };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  if (!tutor) return { students: [], stats: null, trends: null };

  // --- 1️⃣ Fetch enrollments and users
  const enrollments = await db.enrollment.findMany({
    where: { course: { tutorId: tutor.id } },
    include: { user: true, course: true },
  });

  const [submissions, discussions] = await Promise.all([
    db.submission.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
    db.discussion.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
  ]);

  const submissionMap = new Map(
    submissions.map((s) => [s.userId, s._count._all])
  );
  const discussionMap = new Map(
    discussions.map((d) => [d.userId, d._count._all])
  );

  const studentsMap = new Map();

  for (const enr of enrollments) {
    const userId = enr.user.id;

    if (!studentsMap.has(userId)) {
      studentsMap.set(userId, {
        id: userId,
        name: enr.user.name || "Unnamed",
        email: enr.user.email || "",
        avatar: enr.user.image || "/placeholder.svg",
        joinDate: enr.user.createdAt.toISOString(),
        coursesEnrolled: [],
        totalProgress: 0,
        assignmentsSubmitted: submissionMap.get(userId) || 0,
        assignmentsPending: 0,
        messagesCount: discussionMap.get(userId) || 0,
        lastActive: enr.user.updatedAt
          ? formatDistanceToNow(new Date(enr.user.updatedAt), {
              addSuffix: true,
            })
          : "N/A",
        status: enr.user.isActive ? "active" : "inactive",
        country: enr.user.location || "",
        phone: enr.user.phone || "",
      });
    }

    const student = studentsMap.get(userId);
    student.coursesEnrolled.push({
      id: enr.course.id,
      title: enr.course.title,
      progress: enr.progress,
      status: enr.status,
    });
  }

  const students = Array.from(studentsMap.values()).map((s) => {
    const avg =
      s.coursesEnrolled.length > 0
        ? s.coursesEnrolled.reduce((a: any, c: any) => a + c.progress, 0) /
          s.coursesEnrolled.length
        : 0;
    s.totalProgress = Math.round(avg);
    return s;
  });

  // --- 2️⃣ Core stats
  const totalCompletions = await db.enrollment.count({
    where: { course: { tutorId: tutor.id }, status: "COMPLETED" },
  });

  const stats = {
    totalStudents: students.length,
    activeNow: students.filter((s) => s.status === "active").length,
    completedCourses: totalCompletions,
    averageProgress:
      students.length > 0
        ? Math.round(
            students.reduce((a, s) => a + s.totalProgress, 0) / students.length
          )
        : 0,
  };

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = startOfThisMonth;

  const [thisMonthEnrollments, lastMonthEnrollments] = await Promise.all([
    db.enrollment.count({
      where: {
        course: { tutorId: tutor.id },
        enrolledAt: { gte: startOfThisMonth },
      },
    }),
    db.enrollment.count({
      where: {
        course: { tutorId: tutor.id },
        enrolledAt: { gte: startOfLastMonth, lt: endOfLastMonth },
      },
    }),
  ]);

  const [thisMonthCompleted, lastMonthCompleted] = await Promise.all([
    db.enrollment.count({
      where: {
        course: { tutorId: tutor.id },
        status: "COMPLETED",
        enrolledAt: { gte: startOfThisMonth },
      },
    }),
    db.enrollment.count({
      where: {
        course: { tutorId: tutor.id },
        status: "COMPLETED",
        enrolledAt: { gte: startOfLastMonth, lt: endOfLastMonth },
      },
    }),
  ]);

  const avgProgressThisMonth =
    students.length > 0
      ? Math.round(
          students.reduce((a, s) => a + s.totalProgress, 0) / students.length
        )
      : 0;

  const trends = {
    totalStudents:
      lastMonthEnrollments > 0
        ? Math.round(
            ((thisMonthEnrollments - lastMonthEnrollments) /
              lastMonthEnrollments) *
              100
          )
        : 0,
    activeNow: 0, // placeholder
    completedCourses:
      lastMonthCompleted > 0
        ? Math.round(
            ((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) *
              100
          )
        : 0,
    averageProgress: avgProgressThisMonth,
  };

  return { students, stats, trends };
}
