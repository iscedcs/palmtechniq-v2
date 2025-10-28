"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// 🧠 Get all progress data for the student progress page
export async function getStudentProgressData() {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error("User not authenticated")
    const userId = session.user.id

    // Get student profile
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

    // Get all enrollments with progress
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            tutor: { 
              include: { 
                user: {
                  select: {
                    name: true,
                    avatar: true,
                    image: true,
                  }
                }
              } 
            },
            category: true,
            reviews: { select: { rating: true } },
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                  }
                }
              }
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                duration: true
              }
            }
          }
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Calculate course progress
    const coursesProgress = enrollments.map((enrollment) => {
      const course = enrollment.course
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      const completedLessons = enrollment.lessonProgress.filter((lp) => lp.isCompleted).length
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      // Calculate time spent from completed lessons' durations
      const timeSpentMinutes = enrollment.lessonProgress
        .filter(lp => lp.isCompleted)
        .reduce((total, lp) => total + (lp.lesson.duration || 0), 0)
      const timeSpentHours = Math.round((timeSpentMinutes / 60) * 10) / 10

      // Find next lesson
      let nextLessonTitle = "All lessons completed"
      const completedLessonIds = new Set(
        enrollment.lessonProgress.filter((lp) => lp.isCompleted).map((lp) => lp.lessonId),
      )

      outerLoop: for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (!completedLessonIds.has(lesson.id)) {
            nextLessonTitle = lesson.title
            break outerLoop
          }
        }
      }

      // Calculate average rating
      const averageRating = course.reviews.length > 0 
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length 
        : 0

      // Get last accessed date - handle null case
      const completedProgress = enrollment.lessonProgress.filter(lp => lp.isCompleted)
      const lastProgress = completedProgress.length > 0 
        ? completedProgress.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
        : null
      
      const lastAccessed = lastProgress ? lastProgress.updatedAt : enrollment.updatedAt

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image || null,
        progress: Math.round(progress),
        totalLessons,
        completedLessons,
        timeSpent: timeSpentHours,
        lastAccessed: getTimeAgo(lastAccessed),
        nextLesson: nextLessonTitle,
        thumbnail: course.thumbnail || null,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        category: course.category.name,
        status: enrollment.status,
      }
    })

    // Get achievements (progress milestones)
    const achievementsData = await db.progressMilestone.findMany({
      where: { userId },
      orderBy: { achievedAt: "desc" },
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

    const achievements = achievementsData.map((achievement) => {
      const achievedDate = new Date(achievement.achievedAt)
      const daysAgo = Math.floor((Date.now() - achievedDate.getTime()) / (1000 * 60 * 60 * 24))
      let unlockedAt = "Not unlocked yet"
      
      if (daysAgo === 0) unlockedAt = "Today"
      else if (daysAgo === 1) unlockedAt = "Yesterday"
      else if (daysAgo < 7) unlockedAt = `${daysAgo} days ago`
      else if (daysAgo < 30) unlockedAt = `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? "s" : ""} ago`
      else unlockedAt = `${Math.floor(daysAgo / 30)} month${Math.floor(daysAgo / 30) > 1 ? "s" : ""} ago`

      return {
        id: achievement.id,
        title: achievement.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: achievement.description,
        icon: achievementIcons[achievement.type as keyof typeof achievementIcons] || "Trophy",
        color: achievementColors[achievement.type as keyof typeof achievementColors] || "from-gray-500 to-gray-600",
        unlockedAt,
        rarity: getRarityFromType(achievement.type),
        progress: achievement.type === "COURSE_COMPLETED" ? 1 : undefined,
        maxProgress: achievement.type === "COURSE_COMPLETED" ? 1 : undefined,
      }
    })

    // Get learning streak data
    const streakData = await calculateLearningStreak(userId)

    // Calculate total study hours from completed lessons
    const totalStudyMinutes = enrollments.reduce((total, enrollment) => {
      return total + enrollment.lessonProgress
        .filter(lp => lp.isCompleted)
        .reduce((sum, lp) => sum + (lp.lesson.duration || 0), 0)
    }, 0)
    const totalHours = Math.round((totalStudyMinutes / 60) * 10) / 10

    // Calculate completed courses
    const coursesCompleted = enrollments.filter(e => e.status === "COMPLETED").length
    const coursesInProgress = enrollments.filter(e => e.status === "ACTIVE").length

    // Calculate average score from quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId, isCompleted: true },
      select: { score: true }
    })
    
    const averageScore = quizAttempts.length > 0 
      ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length)
      : 0

    // Get level and XP data
    const level = getLevelNumber(student.level)
    const xp = student.totalPoints
    const xpToNext = (level + 1) * 500

    // Get weekly activity
    const weeklyActivityData = await getWeeklyActivity(userId)

    return {
      user: {
        name: student.user.name,
        avatar: student.user.avatar || student.user.image || null,
        rank: student.currentRank,
        level,
        xp,
        xpToNext,
      },
      stats: {
        totalHours,
        coursesCompleted,
        coursesInProgress,
        averageScore,
        rank: student.currentRank,
        level,
        xp,
        xpToNext,
      },
      coursesProgress,
      achievements,
      learningStreak: streakData,
      weeklyActivity: weeklyActivityData,
    }
  } catch (error) {
    console.error("Error fetching student progress data:", error)
    throw new Error("Failed to fetch progress data")
  }
}

// 🧠 Calculate learning streak
async function calculateLearningStreak(userId: string) {
  // Get all lesson completions in the last 30 days
  const recentCompletions = await db.lessonProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: {
        not: null,
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    select: {
      completedAt: true,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  // Extract unique dates from valid completions
  const validCompletions = recentCompletions.filter(c => c.completedAt !== null)
  const uniqueDates = [...new Set(
    validCompletions.map(c => new Date(c.completedAt!).toDateString())
  )]

  // Calculate current streak
  let currentStreak = 0
  let longestStreak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

  // Check current streak starting from today
  let checkDate = new Date()
  let streakCount = 0
  
  for (let i = 0; i < 30; i++) {
    const dateString = checkDate.toDateString()
    if (uniqueDates.includes(dateString)) {
      streakCount++
      if (i === 0) currentStreak = streakCount
    } else {
      break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Calculate longest streak in the last 30 days
  let consecutiveDays = 0
  let currentDate = new Date()
  
  for (let i = 0; i < 30; i++) {
    const dateString = currentDate.toDateString()
    if (uniqueDates.includes(dateString)) {
      consecutiveDays++
      longestStreak = Math.max(longestStreak, consecutiveDays)
    } else {
      consecutiveDays = 0
    }
    currentDate.setDate(currentDate.getDate() - 1)
  }

  // Calculate this week's activity (last 7 days)
  const thisWeek = Array(7).fill(0)
  const now = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateString = date.toDateString()
    if (uniqueDates.includes(dateString)) {
      thisWeek[6 - i] = 1
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    thisWeek,
  }
}

// 🧠 Get weekly activity data
async function getWeeklyActivity(userId: string) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const weeklyCompletions = await db.lessonProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: {
        not: null,
        gte: oneWeekAgo,
      },
    },
    include: {
      lesson: {
        select: {
          duration: true,
        },
      },
    },
  })

  // Group by day and calculate hours
  const dailyHours: { [key: string]: number } = {}
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  // Initialize all days to 0
  weekDays.forEach(day => {
    dailyHours[day] = 0
  })

  // Calculate hours for each completion
  weeklyCompletions.forEach(completion => {
    if (completion.completedAt) {
      const day = weekDays[new Date(completion.completedAt).getDay()]
      const hours = (completion.lesson.duration || 0) / 60
      dailyHours[day] = (dailyHours[day] || 0) + hours
    }
  })

  return dailyHours
}

// 🧠 Helper: Convert a date to "time ago" format
function getTimeAgo(date: Date | null): string {
  if (!date) return "Never"
  
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? "s" : ""} ago`
  return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? "s" : ""} ago`
}

// 🧠 Helper: Get level number from education level
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

// 🧠 Helper: Get rarity from milestone type
function getRarityFromType(type: string): string {
  switch (type) {
    case "LESSON_COMPLETED":
      return "Common"
    case "QUIZ_PASSED":
      return "Uncommon"
    case "COURSE_COMPLETED":
      return "Rare"
    case "SKILL_MASTERED":
      return "Epic"
    default:
      return "Common"
  }
}