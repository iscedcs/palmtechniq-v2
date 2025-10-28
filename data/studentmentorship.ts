"use server";

import { db } from "@/lib/db"
import { SessionStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type MentorshipSession = {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  price: number;
  status: SessionStatus;
  meetingUrl?: string | null;
  notes?: string | null;
  feedback?: string | null;
  rating?: number | null;
  scheduledAt: Date;
  startedAt?: Date | null;
  endedAt?: Date | null;
  studentId: string;
  tutorId: string;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  tutor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    title?: string | null;
    company?: string | null;
    expertise: string[];
    averageRating: number;
    totalReviews: number;
  };
};

export type AvailableMentor = {
  id: string;
  name: string;
  title: string;
  company?: string | null;
  avatar?: string | null;
  rating: number;
  reviews: number;
  hourlyRate: number;
  expertise: string[];
  bio: string | null;
  availability: string;
  location?: string | null;
  languages: string[];
  isVerified: boolean;
};

export async function getUpcomingSessions(userId: string): Promise<MentorshipSession[]> {
  try {
    const sessions = await db.mentorshipSession.findMany({
      where: {
        studentId: userId,
        status: {
          in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS],
        },
        scheduledAt: {
          gte: new Date(),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Fetch additional tutor details
    const sessionsWithTutorDetails = await Promise.all(
      sessions.map(async (session) => {
        const tutorProfile = await db.tutor.findUnique({
          where: { userId: session.tutor.id },
          select: {
            title: true,
            expertise: true,
            averageRating: true,
            totalReviews: true,
          },
        });

        return {
          ...session,
          tutor: {
            ...session.tutor,
            title: tutorProfile?.title || "Mentor",
            expertise: tutorProfile?.expertise || [],
            averageRating: tutorProfile?.averageRating || 0,
            totalReviews: tutorProfile?.totalReviews || 0,
          },
        };
      })
    );

    return sessionsWithTutorDetails;
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error);
    return [];
  }
}

export async function getPastSessions(userId: string): Promise<MentorshipSession[]> {
  try {
    const sessions = await db.mentorshipSession.findMany({
      where: {
        studentId: userId,
        status: SessionStatus.COMPLETED,
        endedAt: {
          lte: new Date(),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
    });

    // Fetch additional tutor details
    const sessionsWithTutorDetails = await Promise.all(
      sessions.map(async (session) => {
        const tutorProfile = await db.tutor.findUnique({
          where: { userId: session.tutor.id },
          select: {
            title: true,
            expertise: true,
            averageRating: true,
            totalReviews: true,
          },
        });

        return {
          ...session,
          tutor: {
            ...session.tutor,
            title: tutorProfile?.title || "Mentor",
            expertise: tutorProfile?.expertise || [],
            averageRating: tutorProfile?.averageRating || 0,
            totalReviews: tutorProfile?.totalReviews || 0,
          },
        };
      })
    );

    return sessionsWithTutorDetails;
  } catch (error) {
    console.error("Error fetching past sessions:", error);
    return [];
  }
}

export async function getAvailableMentors(): Promise<AvailableMentor[]> {
  try {
    const tutors = await db.tutor.findMany({
      where: {
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            bio: true,
          },
        },
      },
      orderBy: {
        averageRating: 'desc',
      },
    });

   // In getAvailableMentors function
return tutors.map(tutor => ({
  id: tutor.id,
  name: tutor.user.name,
  title: tutor.title,
  company: tutor.course || null,  // Allow null
  avatar: tutor.user.avatar || null,  // Allow null
  rating: tutor.averageRating,
  reviews: tutor.totalReviews,
  hourlyRate: tutor.hourlyRate || 0,
  expertise: tutor.expertise,
  bio: tutor.user.bio || null,  // Allow null
  availability: "Available this week",
  location: tutor.user.location || null,  // Allow null
  languages: ["English"],
  isVerified: tutor.isVerified,
}));
  } catch (error) {
    console.error("Error fetching available mentors:", error);
    return [];
  }
}

export async function getMentorshipStats(userId: string) {
  try {
    const [totalSessions, completedSessions, totalHours, averageRating] = await Promise.all([
      // Total sessions
      db.mentorshipSession.count({
        where: { studentId: userId },
      }),
      // Completed sessions
      db.mentorshipSession.count({
        where: { 
          studentId: userId,
          status: SessionStatus.COMPLETED,
        },
      }),
      // Total hours (sum of duration for completed sessions in hours)
      db.mentorshipSession.aggregate({
        where: { 
          studentId: userId,
          status: SessionStatus.COMPLETED,
        },
        _sum: {
          duration: true,
        },
      }),
      // Average rating from completed sessions
      db.mentorshipSession.aggregate({
        where: { 
          studentId: userId,
          status: SessionStatus.COMPLETED,
          rating: { not: null },
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return {
      totalSessions,
      completedSessions,
      totalHours: Math.round((totalHours._sum.duration || 0) / 60),
      averageRating: averageRating._avg.rating || 0,
    };
  } catch (error) {
    console.error("Error fetching mentorship stats:", error);
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalHours: 0,
      averageRating: 0,
    };
  }
}

export async function bookMentorshipSession(
  studentId: string,
  tutorId: string,
  sessionData: {
    title: string;
    description?: string;
    duration: number;
    price: number;
    scheduledAt: Date;
    notes?: string;
  }
) {
  try {
    const session = await db.mentorshipSession.create({
      data: {
        ...sessionData,
        studentId,
        tutorId,
        status: SessionStatus.SCHEDULED,
      },
    });

    revalidatePath("/mentorship");
    return { success: true, session };
  } catch (error) {
    console.error("Error booking session:", error);
    return { success: false, error: "Failed to book session" };
  }
}

export async function cancelMentorshipSession(sessionId: string, userId: string) {
  try {
    const session = await db.mentorshipSession.update({
      where: {
        id: sessionId,
        studentId: userId,
        status: {
          in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS],
        },
      },
      data: {
        status: SessionStatus.CANCELLED,
      },
    });

    revalidatePath("/mentorship");
    return { success: true, session };
  } catch (error) {
    console.error("Error cancelling session:", error);
    return { success: false, error: "Failed to cancel session" };
  }
}

export async function submitSessionFeedback(
  sessionId: string,
  userId: string,
  feedback: {
    rating: number;
    comment: string;
  }
) {
  try {
    const session = await db.mentorshipSession.update({
      where: {
        id: sessionId,
        studentId: userId,
        status: SessionStatus.COMPLETED,
      },
      data: {
        rating: feedback.rating,
        feedback: feedback.comment,
      },
    });

    // Update tutor's average rating
    const tutorSessions = await db.mentorshipSession.findMany({
      where: {
        tutorId: session.tutorId,
        status: SessionStatus.COMPLETED,
        rating: { not: null },
      },
    });

    const averageRating = tutorSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / tutorSessions.length;

    await db.tutor.update({
      where: { userId: session.tutorId },
      data: {
        averageRating,
        totalReviews: tutorSessions.length,
      },
    });

    revalidatePath("/mentorship");
    return { success: true, session };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, error: "Failed to submit feedback" };
  }
}