"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getTutorStudents() {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return { students: [], stats: null };
  }

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
  });
  const enrollments = await db.enrollment.findMany({
    where: {
      course: { tutorId: tutor?.id },
    },
    include: {
      user: true,
      course: true,
    },
  });

  const studentsMap = new Map();

  for (const enr of enrollments) {
    const userId = enr.user.id;

    if (!studentsMap.has(userId)) {
      const assignments = await db.submission.count({
        where: { userId },
      });

      const pendingAssignments = await db.submission.count({
        where: { userId, status: "PENDING" },
      });

      const messages = await db.discussion.count({
        where: { userId },
      });

      studentsMap.set(userId, {
        id: userId,
        name: enr.user.name || "Unnamed",
        email: enr.user.email || "",
        avatar: enr.user.image || "/placeholder.svg",
        joinDate: enr.user.createdAt,
        coursesEnrolled: [],
        totalProgress: 0,
        assignmentsSubmitted: assignments,
        assignmentsPending: pendingAssignments,
        messagesCount: messages,
        lastActive: enr.user.isActive,
        status: "active",
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
    const total = s.coursesEnrolled.reduce(
      (acc: any, c: any) => acc + c.progress,
      0
    );
    const avg =
      s.coursesEnrolled.length > 0 ? total / s.coursesEnrolled.length : 0;
    s.totalProgress = Math.round(avg);
    return s;
  });

  const stats = {
    totalStudents: students.length,
    activeNow: students.length, // Placeholder for active tracking
    completedCourses: students.filter((s) =>
      s.coursesEnrolled.every((c: any) => c.status === "completed")
    ).length,
    averageProgress:
      students.length > 0
        ? Math.round(
            students.reduce((acc, s) => acc + s.totalProgress, 0) /
              students.length
          )
        : 0,
  };

  return { students, stats };
}
