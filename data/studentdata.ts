"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function getLevelNumber(level: string): number {
  switch (level) {
    case "BEGINNER":
      return 1;
    case "INTERMEDIATE":
      return 5;
    case "ADVANCED":
      return 10;
    case "EXPERT":
      return 15;
    default:
      return 1;
  }
}

export async function getStudentDashboardData() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "STUDENT") {
    return { error: "Forbidden" };
  }

  const userId = session.user.id;

  // Fetch student profile
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
          image: true,
        },
      },
    },
  });

  if (!student) {
    // Auto-create Student profile for users who were enrolled without payment
    await db.student.create({
      data: { userId, interests: [], goals: [] },
    });
    await db.user.update({
      where: { id: userId },
      data: { role: "STUDENT" },
    });
    /**
     * Re-run to fetch the newly created profile with all includes
     */
    return getStudentDashboardData();
  }

  // Fetch enrollments with course details
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    include: {
      course: {
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      },
      lessonProgress: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 3,
  });

  // Calculate course details
  const currentCourses = enrollments.map((enrollment: any) => {
    const totalLessons = enrollment.course.modules.reduce(
      (acc: any, module: any) => acc + module.lessons.length,
      0,
    );
    const completedLessons = enrollment.lessonProgress.filter(
      (lp: any) => lp.isCompleted,
    ).length;
    const progress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate time left from actual lesson durations
    const allLessons = enrollment.course.modules.flatMap((m: any) => m.lessons);
    const completedLessonIds = new Set(
      enrollment.lessonProgress
        .filter((lp: any) => lp.isCompleted)
        .map((lp: any) => lp.lessonId),
    );
    const timeLeftMinutes = allLessons
      .filter((lesson: any) => !completedLessonIds.has(lesson.id))
      .reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0);
    const hours = Math.floor(timeLeftMinutes / 60);
    const minutes = timeLeftMinutes % 60;
    const nextLesson = allLessons.find(
      (lesson: any) => !completedLessonIds.has(lesson.id),
    );
    const reviewRatings = enrollment.course.reviews.map(
      (review: any) => review.rating,
    );
    const avgRating =
      reviewRatings.length > 0
        ? reviewRatings.reduce((sum: any, rating: any) => sum + rating, 0) /
          reviewRatings.length
        : 0;

    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      instructor: enrollment.course.tutor.user.name,
      progress: Math.round(progress),
      nextLessonTitle: nextLesson?.title || "Course Complete",
      nextLessonId: nextLesson?.id || null,
      timeLeft: `${hours}h ${minutes}m`,
      thumbnail: enrollment.course.thumbnail,
      difficulty: enrollment.course.level,
      rating: Number(avgRating.toFixed(1)),
    };
  });

  // Fetch upcoming mentorship sessions
  const upcomingMentorships = await db.mentorshipSession.findMany({
    where: {
      studentId: userId,
      status: "SCHEDULED",
      scheduledAt: {
        gte: new Date(),
      },
    },
    include: {
      tutor: {
        select: {
          name: true,
          avatar: true,
          image: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: 2,
  });

  const formattedMentorships = upcomingMentorships.map((session: any) => {
    const scheduledDate = new Date(session.scheduledAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = scheduledDate.toLocaleDateString();
    if (scheduledDate.toDateString() === today.toDateString()) {
      dateLabel = "Today";
    } else if (scheduledDate.toDateString() === tomorrow.toDateString()) {
      dateLabel = "Tomorrow";
    }

    return {
      id: session.id,
      mentor: session.tutor.name,
      topic: session.title,
      date: dateLabel,
      time: scheduledDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      duration: session.duration,
      avatar: session.tutor.avatar || session.tutor.image,
    };
  });

  // Fetch recent achievements (progress milestones)
  const recentAchievements = await db.progressMilestone.findMany({
    where: {
      userId,
    },
    orderBy: {
      achievedAt: "desc",
    },
    take: 3,
  });

  const achievementIcons = {
    LESSON_COMPLETED: "⚡",
    QUIZ_PASSED: "🧠",
    COURSE_COMPLETED: "🏆",
    SKILL_MASTERED: "🎯",
  };

  const achievementColors = {
    LESSON_COMPLETED: "from-yellow-400 to-orange-500",
    QUIZ_PASSED: "from-blue-500 to-cyan-500",
    COURSE_COMPLETED: "from-purple-500 to-indigo-500",
    SKILL_MASTERED: "from-green-500 to-emerald-500",
  };

  const formattedAchievements = recentAchievements.map((achievement: any) => {
    const achievedDate = new Date(achievement.achievedAt);
    const daysAgo = Math.floor(
      (Date.now() - achievedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    let earnedLabel = "Today";
    if (daysAgo === 1) earnedLabel = "Yesterday";
    else if (daysAgo > 1 && daysAgo < 7) earnedLabel = `${daysAgo} days ago`;
    else if (daysAgo >= 7)
      earnedLabel = `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? "s" : ""} ago`;

    const achievementType = achievement.type as keyof typeof achievementIcons;

    return {
      id: achievement.id,
      title: achievement.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: any) => l.toUpperCase()),
      description: achievement.description,
      icon: achievementIcons[achievementType] || "Trophy",
      color: achievementColors[achievementType] || "from-gray-500 to-gray-600",
      earned: earnedLabel,
    };
  });

  // --- Compute real stats from actual activity data ---

  // Total study time from all lesson progress
  const totalWatchTime = await db.lessonProgress.aggregate({
    where: { userId },
    _sum: { watchTime: true },
  });
  const totalStudyMinutes = totalWatchTime._sum.watchTime || 0;
  const totalStudyHours = Math.floor(totalStudyMinutes / 60);

  // Total completed lessons (for XP calculation)
  const totalCompletedLessons = await db.lessonProgress.count({
    where: { userId, isCompleted: true },
  });
  const totalXP = totalCompletedLessons * 50;

  // Courses completed & in progress from enrollment data
  const allEnrollments = await db.enrollment.findMany({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { status: true },
  });
  const coursesCompleted = allEnrollments.filter(
    (e: any) => e.status === "COMPLETED",
  ).length;
  const coursesInProgress = allEnrollments.filter(
    (e: any) => e.status === "ACTIVE",
  ).length;

  // Compute current streak from lesson completion dates
  const completedLessonDates = await db.lessonProgress.findMany({
    where: { userId, isCompleted: true, completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
  const completedDaySet = new Set(
    completedLessonDates
      .map((entry: any) =>
        entry.completedAt ? toDateKey(entry.completedAt) : null,
      )
      .filter(Boolean),
  );

  let currentStreak = 0;
  const cursor = new Date();
  while (completedDaySet.has(toDateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Compute dynamic level based on XP
  const computedLevel =
    totalXP < 500 ? 1 : totalXP < 2500 ? 5 : totalXP < 7500 ? 10 : 15;
  const xpToNext =
    totalXP < 500 ? 500 : totalXP < 2500 ? 2500 : totalXP < 7500 ? 7500 : 15000;

  // Compute rank from XP
  const computedRank =
    totalXP < 500
      ? "Novice"
      : totalXP < 2500
        ? "Apprentice"
        : totalXP < 7500
          ? "Scholar"
          : "Master";

  // Calculate weekly stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyLessons = await db.lessonProgress.count({
    where: {
      userId,
      completedAt: { gte: oneWeekAgo },
      isCompleted: true,
    },
  });

  const weeklyWatchTime = await db.lessonProgress.aggregate({
    where: {
      userId,
      completedAt: { gte: oneWeekAgo },
    },
    _sum: { watchTime: true },
  });

  const weeklyWatchMinutes = weeklyWatchTime._sum.watchTime || 0;
  const weeklyHours = Math.floor(weeklyWatchMinutes / 60);
  const weeklyMinutes = weeklyWatchMinutes % 60;
  const weeklyXP = weeklyLessons * 50;

  return {
    studentData: {
      level: computedLevel,
      xp: totalXP,
      xpToNext,
      streak: currentStreak,
      coursesCompleted,
      coursesInProgress,
      totalHours: totalStudyHours,
      achievements: recentAchievements.length,
      rank: computedRank,
    },
    currentCourses,
    upcomingMentorships: formattedMentorships,
    recentAchievements: formattedAchievements,
    weeklyStats: {
      lessonsCompleted: weeklyLessons,
      studyTime: `${weeklyHours}h ${weeklyMinutes}m`,
      xpEarned: weeklyXP,
      streak: currentStreak,
    },
    userName: student.user.name,
    userAvatar: student.user.avatar || student.user.image,
  };
}
