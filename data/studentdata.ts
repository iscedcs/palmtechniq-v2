"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"

function getLevelNumber(level: string): number {
  switch (level) {
    case "BEGINNER":
      return 1
    case "INTERMEDIATE":
      return 5
    case "ADVANCED":
      return 10
    case "EXPERT":
      return 15
    default:
      return 1
  }
}

export async function getStudentDashboardData() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

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
  })

  if (!student) {
    throw new Error("Student profile not found")
  }

  // Fetch enrollments with course details
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] }
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
  })

  // Calculate course details with auto-completion check
  const currentCourses = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLessons = enrollment.course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
      const completedLessons = enrollment.lessonProgress.filter((lp) => lp.isCompleted).length
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      // Check if course should be marked as completed
      if (progress === 100 && enrollment.status !== "COMPLETED") {
        // Auto-complete the course
        await db.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            progress: 100
          }
        })

        // Update student's completed courses count
        await db.student.update({
          where: { userId },
          data: {
            coursesCompleted: { increment: 1 },
            totalPoints: { increment: 1000 } // Add XP for course completion
          }
        })

        // Create achievement
        await db.progressMilestone.create({
          data: {
            userId,
            type: "COURSE_COMPLETED",
            description: `Completed ${enrollment.course.title} course`,
            achievedAt: new Date()
          }
        })
      }

      // Calculate time left (estimate based on remaining lessons and average duration)
      const remainingLessons = totalLessons - completedLessons
      const avgLessonDuration = 30 // minutes
      const timeLeftMinutes = remainingLessons * avgLessonDuration
      const hours = Math.floor(timeLeftMinutes / 60)
      const minutes = timeLeftMinutes % 60

      // Find next lesson
      const allLessons = enrollment.course.modules.flatMap((m) => m.lessons)
      const nextLesson = allLessons.find(
        (lesson) => !enrollment.lessonProgress.some((lp) => lp.lessonId === lesson.id && lp.isCompleted),
      )

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
        rating: 4.8,
        status: enrollment.status
      }
    })
  )

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
  })

  const formattedMentorships = upcomingMentorships.map((session) => {
    const scheduledDate = new Date(session.scheduledAt)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dateLabel = scheduledDate.toLocaleDateString()
    if (scheduledDate.toDateString() === today.toDateString()) {
      dateLabel = "Today"
    } else if (scheduledDate.toDateString() === tomorrow.toDateString()) {
      dateLabel = "Tomorrow"
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
    }
  })

  // Fetch recent achievements (progress milestones)
  const recentAchievements = await db.progressMilestone.findMany({
    where: {
      userId,
    },
    orderBy: {
      achievedAt: "desc",
    },
    take: 3,
  })

  const achievementIcons = {
    LESSON_COMPLETED: "⚡",
    QUIZ_PASSED: "🧠",
    COURSE_COMPLETED: "🏆",
    SKILL_MASTERED: "🎯",
  }

  const achievementColors = {
    LESSON_COMPLETED: "from-yellow-400 to-orange-500",
    QUIZ_PASSED: "from-blue-500 to-cyan-500",
    COURSE_COMPLETED: "from-purple-500 to-indigo-500",
    SKILL_MASTERED: "from-green-500 to-emerald-500",
  }

  const formattedAchievements = recentAchievements.map((achievement) => {
    const achievedDate = new Date(achievement.achievedAt)
    const daysAgo = Math.floor((Date.now() - achievedDate.getTime()) / (1000 * 60 * 60 * 24))
    let earnedLabel = "Today"
    if (daysAgo === 1) earnedLabel = "Yesterday"
    else if (daysAgo > 1 && daysAgo < 7) earnedLabel = `${daysAgo} days ago`
    else if (daysAgo >= 7) earnedLabel = `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? "s" : ""} ago`

    return {
      id: achievement.id,
      title: achievement.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description: achievement.description,
      icon: achievementIcons[achievement.type] || "Trophy",
      color: achievementColors[achievement.type] || "from-gray-500 to-gray-600",
      earned: earnedLabel,
    }
  })

  // Calculate weekly stats
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const weeklyLessons = await db.lessonProgress.count({
    where: {
      userId,
      completedAt: {
        gte: oneWeekAgo,
      },
      isCompleted: true,
    },
  })

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
  })

  const totalWatchTimeMinutes = weeklyWatchTime._sum.watchTime || 0
  const weeklyHours = Math.floor(totalWatchTimeMinutes / 60)
  const weeklyMinutes = totalWatchTimeMinutes % 60

  // Calculate XP earned this week
  const weeklyXP = weeklyLessons * 50

  // Calculate actual completed courses count dynamically
  const completedEnrollmentsCount = await db.enrollment.count({
    where: {
      userId,
      status: "COMPLETED"
    }
  })

  // Calculate courses in progress (active but not completed)
  const inProgressEnrollmentsCount = await db.enrollment.count({
    where: {
      userId,
      status: "ACTIVE"
    }
  })

  // FIX: Get ALL achievements count
  const totalAchievementsCount = await db.progressMilestone.count({
    where: { userId }
  })

  // FIXED: Calculate learning hours based on course progress (in MINUTES)
  const allEnrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          duration: true, // This should be in minutes
          modules: {
            include: {
              lessons: {
                select: { duration: true } // This should be in minutes
              }
            }
          }
        }
      },
      lessonProgress: {
        where: { isCompleted: true },
        select: { 
          lessonId: true,
          completedAt: true 
        }
      }
    }
  })

  // Calculate actual learning minutes completed (progress-based)
  const actualLearningMinutes = allEnrollments.reduce((total, enrollment) => {
    const courseDuration = enrollment.course.duration || 0
    
    // Calculate progress percentage
    const totalLessons = enrollment.course.modules.reduce(
      (acc, module) => acc + module.lessons.length, 0
    )
    const completedLessons = enrollment.lessonProgress.length
    const progress = totalLessons > 0 ? completedLessons / totalLessons : 0
    
    // Minutes completed = course duration (minutes) × progress percentage
    return total + (courseDuration * progress)
  }, 0)

  // Calculate this week's learning minutes
  const thisWeekMinutes = allEnrollments.reduce((total, enrollment) => {
    const courseDuration = enrollment.course.duration || 0
    const totalLessons = enrollment.course.modules.reduce(
      (acc, module) => acc + module.lessons.length, 0
    )
    
    // Count lessons completed this week
    const thisWeekLessons = enrollment.lessonProgress.filter(
      lp => lp.completedAt && new Date(lp.completedAt) >= oneWeekAgo
    ).length
    
    const progress = totalLessons > 0 ? thisWeekLessons / totalLessons : 0
    return total + (courseDuration * progress)
  }, 0)

  // Convert to hours for display
  const actualLearningHours = Math.floor(actualLearningMinutes / 60)
  const actualLearningRemainingMinutes = Math.round(actualLearningMinutes % 60)
  
  const thisWeekHours = Math.floor(thisWeekMinutes / 60)
  const thisWeekRemainingMinutes = Math.round(thisWeekMinutes % 60)

  // Calculate XP properly (add XP for completed courses/lessons)
  const baseXP = student.totalPoints

  // Add XP for completed courses
  const xpFromCourses = completedEnrollmentsCount * 1000

  // Add XP for completed lessons
  const completedLessonsCount = await db.lessonProgress.count({
    where: {
      userId,
      isCompleted: true
    }
  })

  const xpFromLessons = completedLessonsCount * 50
  const totalXP = baseXP + xpFromCourses + xpFromLessons

  // Calculate XP to next level (Level 1 → 1000 XP needed)
  const xpToNextLevel = 1000

  // DEBUG: Add this to see what's happening (remove in production)
  console.log('=== DEBUG DASHBOARD DATA ===')
  console.log('Course Durations (minutes):')
  allEnrollments.forEach(enrollment => {
    const courseDuration = enrollment.course.duration || 0
    const totalLessons = enrollment.course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    const completedLessons = enrollment.lessonProgress.length
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
    
  })
  console.log('Total learning minutes:', actualLearningMinutes)
  console.log('Total learning hours:', actualLearningHours)
  console.log('Total achievements:', totalAchievementsCount)
  console.log('XP Calculation:', { baseXP, xpFromCourses, xpFromLessons, totalXP })

  return {
    studentData: {
      level: getLevelNumber(student.level),
      xp: totalXP,
      xpToNext: xpToNextLevel,
      streak: student.streak,
      coursesCompleted: completedEnrollmentsCount,
      coursesInProgress: inProgressEnrollmentsCount,
      totalHours: actualLearningHours > 0 ? actualLearningHours : Math.round(actualLearningMinutes / 60 * 10) / 10, // Show decimal for small amounts
      achievements: totalAchievementsCount,
      rank: student.currentRank,
    },
    currentCourses,
    upcomingMentorships: formattedMentorships,
    recentAchievements: formattedAchievements,
    weeklyStats: {
      lessonsCompleted: weeklyLessons,
      studyTime: thisWeekHours > 0 ? `${thisWeekHours}h ${thisWeekRemainingMinutes}m` : `${thisWeekRemainingMinutes}m`,
      xpEarned: weeklyXP,
      streak: student.streak,
    },
    userName: student.user.name,
    userAvatar: student.user.avatar || student.user.image,
  }
}