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
    // Re-run to fetch the newly created profile with all includes
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

    // Calculate time left (estimate based on remaining lessons and average duration)
    const remainingLessons = totalLessons - completedLessons;
    const avgLessonDuration = 30; // minutes
    const timeLeftMinutes = remainingLessons * avgLessonDuration;
    const hours = Math.floor(timeLeftMinutes / 60);
    const minutes = timeLeftMinutes % 60;

    // Find next lesson
    const allLessons = enrollment.course.modules.flatMap((m: any) => m.lessons);
    const nextLesson = allLessons.find(
      (lesson: any) =>
        !enrollment.lessonProgress.some(
          (lp: any) => lp.lessonId === lesson.id && lp.isCompleted,
        ),
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

  // Calculate weekly stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyLessons = await db.lessonProgress.count({
    where: {
      userId,
      completedAt: {
        gte: oneWeekAgo,
      },
      isCompleted: true,
    },
  });

  const weeklyWatchTime = await db.lessonProgress.aggregate({
    where: {
      userId,
      completedAt: {
        gte: oneWeekAgo,
      },
    },
    _sum: {
      watchTime: true,
    },
  });

  const totalWatchTimeMinutes = weeklyWatchTime._sum.watchTime || 0;
  const weeklyHours = Math.floor(totalWatchTimeMinutes / 60);
  const weeklyMinutes = totalWatchTimeMinutes % 60;

  // Calculate XP earned this week (you might have a different XP calculation)
  const weeklyXP = weeklyLessons * 50; // Example: 50 XP per lesson

  // Calculate XP to next level
  const numericLevel = getLevelNumber(student.level);
  const xpToNext = (numericLevel + 1) * 500; // Example formula

  return {
    studentData: {
      level:
        student.level === "BEGINNER"
          ? 1
          : student.level === "INTERMEDIATE"
            ? 5
            : student.level === "ADVANCED"
              ? 10
              : 15,
      xp: student.totalPoints,
      xpToNext,
      streak: student.streak,
      coursesCompleted: student.coursesCompleted,
      coursesInProgress: Math.max(
        student.coursesStarted - student.coursesCompleted,
        0,
      ),
      totalHours: Math.floor(student.studyHours / 60),
      achievements: recentAchievements.length,
      rank: student.currentRank,
    },
    currentCourses,
    upcomingMentorships: formattedMentorships,
    recentAchievements: formattedAchievements,
    weeklyStats: {
      lessonsCompleted: weeklyLessons,
      studyTime: `${weeklyHours}h ${weeklyMinutes}m`,
      xpEarned: weeklyXP,
      streak: student.streak,
    },
    userName: student.user.name,
    userAvatar: student.user.avatar || student.user.image,
  };
}
