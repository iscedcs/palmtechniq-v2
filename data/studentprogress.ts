"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

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

export async function getStudentProgressData() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

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
    return getStudentProgressData();
  }

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
  });

  const coursesProgress = enrollments.map((enrollment: any) => {
    const totalLessons = enrollment.course.modules.reduce(
      (acc: any, module: any) => acc + module.lessons.length,
      0,
    );
    const completedLessons = enrollment.lessonProgress.filter(
      (lp: any) => lp.isCompleted,
    ).length;
    const progress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const totalWatchTimeMinutes = enrollment.lessonProgress.reduce(
      (sum: any, lp: any) => sum + (lp.watchTime || 0),
      0,
    );
    const timeSpent = Number((totalWatchTimeMinutes / 60).toFixed(1));

    const allLessons = enrollment.course.modules.flatMap((m: any) => m.lessons);
    const nextLesson = allLessons.find(
      (lesson: any) =>
        !enrollment.lessonProgress.some(
          (lp: any) => lp.lessonId === lesson.id && lp.isCompleted,
        ),
    );

    const ratings = enrollment.course.reviews.map(
      (review: any) => review.rating,
    );
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum: any, rating: any) => sum + rating, 0) /
          ratings.length
        : 0;

    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      instructor: enrollment.course.tutor.user.name,
      image: enrollment.course.thumbnail || "",
      progress: Math.round(progress),
      totalLessons,
      completedLessons,
      timeSpent,
      lastAccessed: formatDistanceToNow(enrollment.updatedAt, {
        addSuffix: true,
      }),
      nextLesson: nextLesson?.title || "Course Complete",
      difficulty: enrollment.course.level,
      rating: Number(avgRating.toFixed(1)),
    };
  });

  const recentAchievements = await db.progressMilestone.findMany({
    where: { userId },
    orderBy: { achievedAt: "desc" },
    take: 12,
  });

  const achievementIconMap: Record<string, string> = {
    LESSON_COMPLETED: "Zap",
    QUIZ_PASSED: "Brain",
    COURSE_COMPLETED: "Trophy",
    SKILL_MASTERED: "BookOpen",
  };

  const achievementColorMap: Record<string, string> = {
    LESSON_COMPLETED: "from-yellow-400 to-orange-500",
    QUIZ_PASSED: "from-blue-500 to-cyan-500",
    COURSE_COMPLETED: "from-purple-500 to-indigo-500",
    SKILL_MASTERED: "from-green-500 to-emerald-500",
  };

  const achievementRarityMap: Record<string, string> = {
    LESSON_COMPLETED: "Common",
    QUIZ_PASSED: "Uncommon",
    COURSE_COMPLETED: "Rare",
    SKILL_MASTERED: "Epic",
  };

  const achievements = recentAchievements.map((achievement: any) => ({
    id: achievement.id,
    title: achievement.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: any) => l.toUpperCase()),
    description: achievement.description,
    icon: achievementIconMap[achievement.type] || "Trophy",
    color: achievementColorMap[achievement.type] || "from-gray-500 to-gray-600",
    unlockedAt: formatDistanceToNow(achievement.achievedAt, {
      addSuffix: true,
    }),
    rarity: achievementRarityMap[achievement.type] || "Common",
  }));

  const averageQuizScore = await db.quizAttempt.aggregate({
    where: { userId },
    _avg: { score: true },
  });

  const numericLevel = getLevelNumber(student.level);
  const xpToNext = (numericLevel + 1) * 500;

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthlyWatchTime = await db.lessonProgress.aggregate({
    where: {
      userId,
      completedAt: { gte: oneMonthAgo },
    },
    _sum: { watchTime: true },
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
  oneWeekAgo.setHours(0, 0, 0, 0);

  const progressThisWeek = await db.lessonProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: oneWeekAgo },
    },
    select: { completedAt: true, watchTime: true },
  });

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diffToMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const thisWeek = Array.from({ length: 7 }).map((_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    return progressThisWeek.some(
      (entry: any) =>
        entry.completedAt &&
        entry.completedAt >= dayStart &&
        entry.completedAt < dayEnd,
    )
      ? 1
      : 0;
  });

  const weekHours = Array.from({ length: 7 }).map((_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const totalMinutes = progressThisWeek.reduce((sum: any, entry: any) => {
      if (!entry.completedAt) return sum;
      if (entry.completedAt >= dayStart && entry.completedAt < dayEnd) {
        return sum + (entry.watchTime || 0);
      }
      return sum;
    }, 0);

    return Number((totalMinutes / 60).toFixed(1));
  });

  const weeklyStudyHours = Number(
    (
      progressThisWeek.reduce(
        (sum: any, entry: any) => sum + (entry.watchTime || 0),
        0,
      ) / 60
    ).toFixed(1),
  );
  const weeklyLessonsCompleted = progressThisWeek.length;

  const totalModules = enrollments.reduce(
    (sum: any, enrollment: any) => sum + enrollment.course.modules.length,
    0,
  );
  const completedModules = enrollments.reduce((sum: any, enrollment: any) => {
    const completedLessonIds = new Set(
      enrollment.lessonProgress
        .filter((progress: any) => progress.isCompleted)
        .map((progress: any) => progress.lessonId),
    );
    const moduleCount = enrollment.course.modules.filter((module: any) => {
      if (module.lessons.length === 0) return true;
      return module.lessons.every((lesson: any) =>
        completedLessonIds.has(lesson.id),
      );
    }).length;
    return sum + moduleCount;
  }, 0);

  const totalLessons = enrollments.reduce((sum: any, enrollment: any) => {
    return (
      sum +
      enrollment.course.modules.reduce(
        (lessonSum: any, module: any) => lessonSum + module.lessons.length,
        0,
      )
    );
  }, 0);
  const completedLessons = enrollments.reduce(
    (sum: any, enrollment: any) =>
      sum +
      enrollment.lessonProgress.filter((progress: any) => progress.isCompleted)
        .length,
    0,
  );

  const completedLessonDates = await db.lessonProgress.findMany({
    where: { userId, isCompleted: true, completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "asc" },
  });

  const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
  const completedDays = completedLessonDates
    .map((entry: any) =>
      entry.completedAt ? toDateKey(entry.completedAt) : null,
    )
    .filter((value: any): value is string => Boolean(value));
  const completedSet = new Set(completedDays);

  const todayKey = toDateKey(new Date());
  let currentStreak = 0;
  let cursor = new Date();
  while (completedSet.has(toDateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longestStreak = 0;
  let streak = 0;
  let previousDate: string | null = null;
  for (const dateKey of Array.from(new Set(completedDays)).sort() as string[]) {
    if (!previousDate) {
      streak = 1;
    } else {
      const prev = new Date(previousDate);
      const curr = new Date(dateKey);
      prev.setDate(prev.getDate() + 1);
      if (toDateKey(prev) === dateKey) {
        streak += 1;
      } else {
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);
    previousDate = dateKey;
  }

  const recentMilestones = recentAchievements
    .slice(0, 3)
    .map((achievement: any) => ({
      id: achievement.id,
      title: achievement.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: any) => l.toUpperCase()),
      description: achievement.description,
      earned: formatDistanceToNow(achievement.achievedAt, { addSuffix: true }),
      icon: achievementIconMap[achievement.type] || "Trophy",
      color:
        achievementColorMap[achievement.type] || "from-gray-500 to-gray-600",
    }));

  return {
    coursesProgress,
    achievements,
    learningStreak: {
      current: currentStreak,
      longest: Math.max(longestStreak, student.streak),
      thisWeek,
    },
    weeklyHours: weekHours,
    weeklyLessonsCompleted,
    weeklyStudyHours,
    moduleProgress: {
      totalModules,
      completedModules,
      totalLessons,
      completedLessons,
    },
    recentMilestones,
    stats: {
      totalHours: Number((student.studyHours / 60).toFixed(1)),
      monthlyHours: Number(
        ((monthlyWatchTime._sum.watchTime || 0) / 60).toFixed(1),
      ),
      coursesCompleted: student.coursesCompleted,
      coursesInProgress: Math.max(
        student.coursesStarted - student.coursesCompleted,
        0,
      ),
      averageScore: Math.round(averageQuizScore._avg.score || 0),
      rank: student.currentRank,
      level: numericLevel,
      xp: student.totalPoints,
      xpToNext,
    },
  };
}

export type StudentProgressData = Exclude<
  Awaited<ReturnType<typeof getStudentProgressData>>,
  { error: string }
>;
export type StudentProgressResponse = { error: string } | StudentProgressData;
