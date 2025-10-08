"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"

// 🧠 Get all active enrolled courses for the current user
export async function getEnrolledCourses() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const userId = session.user.id

    const enrollments = await db.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            tutor: {
              include: { user: true },
            },
            category: true,
            reviews: { select: { rating: true } },
            enrollments: { select: { id: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return enrollments.map((enrollment) => {
      const course = enrollment.course
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
          : 0

      const progress = enrollment.progress ?? 0

      return {
        id: course.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        progress: Math.round(progress),
        totalLessons: course.totalLessons,
        completedLessons: Math.round((progress / 100) * course.totalLessons),
        nextLesson: "Continue Learning",
        timeLeft: course.duration
          ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
          : "N/A",
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        students: course.enrollments.length,
        category: course.category.name,
        lastAccessed: getTimeAgo(enrollment.updatedAt),
        certificate: course.certificate || false,
      }
    })
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return []
  }
}

// 🧠 Get available (non-enrolled) courses
export async function getAvailableCourses() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const userId = session.user.id

    const enrolledCourseIds = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    })

    const enrolledIds = enrolledCourseIds.map((e) => e.courseId)

    const courses = await db.course.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: enrolledIds },
      },
      include: {
        tutor: {
          include: { user: true },
        },
        category: true,
        reviews: { select: { rating: true } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return courses.map((course) => {
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
          : 0

      return {
        id: course.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        price: course.currentPrice || course.price,
        originalPrice: course.basePrice || course.price,
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        students: course.enrollments.length,
        duration: course.duration
          ? `${Math.floor(course.duration / 60)} hours`
          : "N/A",
        lessons: course.totalLessons,
        category: course.category.name,
        bestseller: course.enrollments.length > 100,
        trending: course.enrollments.length > 50,
        newCourse: isNewCourse(course.createdAt),
        certificate: course.certificate || false,
      }
    })
  } catch (error) {
    console.error("Error fetching available courses:", error)
    return []
  }
}

// 🧠 Get completed courses with grades and certificates
export async function getCompletedCourses() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const userId = session.user.id

    const completedEnrollments = await db.enrollment.findMany({
      where: { userId, status: "COMPLETED" },
      include: {
        course: {
          include: {
            tutor: { include: { user: true } },
            category: true,
            reviews: { select: { rating: true } },
            certificates: {
              where: { userId },
              select: { certificateId: true },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    })

    return completedEnrollments.map((enrollment) => {
      const course = enrollment.course
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
          : 0

      const finalGrade =
        enrollment.progress >= 95
          ? "A+"
          : enrollment.progress >= 90
          ? "A"
          : enrollment.progress >= 85
          ? "B+"
          : enrollment.progress >= 80
          ? "B"
          : "C"

      return {
        id: course.id,
        title: course.title,
        instructor: course.tutor.user.name,
        instructorAvatar: course.tutor.user.avatar || course.tutor.user.image,
        completedDate: enrollment.completedAt
          ? getTimeAgo(enrollment.completedAt)
          : "Recently",
        thumbnail: course.thumbnail,
        difficulty: course.level,
        rating: Number(averageRating.toFixed(1)),
        finalGrade,
        certificate: course.certificates.length > 0,
        certificateId:
          course.certificates.length > 0
            ? course.certificates[0].certificateId
            : undefined,
        category: course.category.name,
      }
    })
  } catch (error) {
    console.error("Error fetching completed courses:", error)
    return []
  }
}

// ⏳ Helper: Convert a date to “time ago” format
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  if (diffInDays < 30)
    return `${Math.floor(diffInDays / 7)} week${
      Math.floor(diffInDays / 7) > 1 ? "s" : ""
    } ago`
  return `${Math.floor(diffInDays / 30)} month${
    Math.floor(diffInDays / 30) > 1 ? "s" : ""
  } ago`
}

// 🆕 Helper: Check if course is new (created in last 30 days)
function isNewCourse(createdAt: Date): boolean {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(createdAt).getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  return diffInDays <= 30
}
