import { db } from "@/lib/db";

export interface DemoLesson {
  id: string;
  title: string;
  duration: number;
  videoUrl: string | null;
  description: string | null;
  demoDuration: number; // 60 seconds for demo
}

export interface DemoCourseData {
  title: string;
  instructor: string;
  thumbnail: string | null;
  duration: string;
  studentCount: number;
  lessons: DemoLesson[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
  };
}

export async function fetchDemoCourseData(): Promise<DemoCourseData | null> {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn(
        "DATABASE_URL not available. Demo course data will load at runtime.",
      );
      return null;
    }

    // Find Ethical Hacking course
    const course = await db.course.findFirst({
      where: {
        title: { contains: "Ethical Hacking", mode: "insensitive" },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        duration: true,
        modules: {
          select: {
            lessons: {
              select: {
                id: true,
                title: true,
                duration: true,
                videoUrl: true,
                description: true,
              },
              orderBy: { sortOrder: "asc" },
              take: 4, // Only first 4 lessons for demo
            },
          },
          orderBy: { sortOrder: "asc" },
          take: 1, // First module
        },
        creator: {
          select: {
            name: true,
          },
        },
        thumbnail: true,
        enrollments: {
          select: {
            _count: true,
          },
        },
      },
    });

    if (!course || !course.modules || course.modules.length === 0) {
      return null;
    }

    const lessons = course.modules[0].lessons;
    if (lessons.length === 0) {
      return null;
    }

    // Transform lessons for demo (1 minute = 60 seconds each)
    const demoLessons: DemoLesson[] = lessons.map(
      (lesson: {
        id: string;
        title: string;
        duration: number | null;
        videoUrl: string | null;
        description: string | null;
      }) => ({
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration || 0,
        videoUrl: lesson.videoUrl,
        description: lesson.description,
        demoDuration: 60, // 1 minute per lesson for demo
      }),
    );

    // Mock quiz aligned with ethical hacking content
    const ethicalHackingQuiz = {
      question:
        "What is the primary ethical principle in ethical hacking/penetration testing?",
      options: [
        "To gain unauthorized access to systems",
        "To identify vulnerabilities with proper authorization and help improve security",
        "To steal sensitive data for profit",
        "To disable security systems",
      ],
      correct: 1,
    };

    const studentCount = course.enrollments?.length || 0;

    return {
      title: course.title,
      instructor: course.creator?.name || "Expert Instructor",
      thumbnail: course.thumbnail,
      duration: course.duration
        ? `${Math.round(course.duration / 60)}h ${course.duration % 60}m`
        : "0h",
      studentCount,
      lessons: demoLessons,
      quiz: ethicalHackingQuiz,
    };
  } catch (error) {
    console.error("Error fetching demo course data:", error);
    // Return null instead of throwing - let the fallback UI display
    return null;
  }
}
