import { db } from "./db";
import { NotificationType } from "@prisma/client";
import { getIO } from "./socket";

export type NotificationPayload = {
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "course"
    | "payment"
    | "system";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
};

// Map frontend types to Prisma enum
const mapNotificationType = (
  type: NotificationPayload["type"],
): NotificationType => {
  switch (type) {
    case "success":
      return "SUCCESS";
    case "warning":
      return "WARNING";
    case "error":
      return "ERROR";
    default:
      return "INFO";
  }
};

export const notify = {
  /**
   * Send notification to a specific user (persisted to DB + real-time push)
   */
  user: async (userId: string, p: NotificationPayload) => {
    try {
      await db.notification.create({
        data: {
          userId,
          title: p.title,
          message: p.message,
          type: mapNotificationType(p.type),
          data: {
            actionUrl: p.actionUrl,
            actionLabel: p.actionLabel,
            ...p.metadata,
          },
        },
      });

      // Real-time push via Socket.IO (getIO() called at runtime, not module load)
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit("notification", {
          type: p.type,
          title: p.title,
          message: p.message,
          actionUrl: p.actionUrl,
          actionLabel: p.actionLabel,
          metadata: p.metadata,
        });
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  },

  /**
   * Send notification to all users with a specific role (persisted + real-time push)
   */
  role: async (role: string, p: NotificationPayload) => {
    try {
      // Find all users with this role
      const users = await db.user.findMany({
        where: { role: role as any },
        select: { id: true },
      });

      // Create notifications for each user
      if (users.length > 0) {
        await db.notification.createMany({
          data: users.map((user: any) => ({
            userId: user.id,
            title: p.title,
            message: p.message,
            type: mapNotificationType(p.type),
            data: {
              actionUrl: p.actionUrl,
              actionLabel: p.actionLabel,
              ...p.metadata,
            },
          })),
        });
      }

      // Real-time push to all sockets in the role room
      const io = getIO();
      if (io) {
        io.to(`role:${role}`).emit("notification", {
          type: p.type,
          title: p.title,
          message: p.message,
          actionUrl: p.actionUrl,
          actionLabel: p.actionLabel,
          metadata: p.metadata,
        });
      }
    } catch (error) {
      console.error("Failed to create role notifications:", error);
    }
  },

  /**
   * Send notification to all users enrolled in a course (persisted + real-time push)
   */
  course: async (courseId: string, p: NotificationPayload) => {
    try {
      // Find all active enrollments for this course
      const enrollments = await db.enrollment.findMany({
        where: { courseId, status: "ACTIVE" },
        select: { userId: true },
      });

      // Create notifications for each enrolled user
      if (enrollments.length > 0) {
        await db.notification.createMany({
          data: enrollments.map((enrollment: any) => ({
            userId: enrollment.userId,
            title: p.title,
            message: p.message,
            type: mapNotificationType(p.type),
            data: {
              actionUrl: p.actionUrl,
              actionLabel: p.actionLabel,
              courseId,
              ...p.metadata,
            },
          })),
        });
      }

      // Real-time push to all sockets in the course room
      const io = getIO();
      if (io) {
        io.to(`course:${courseId}`).emit("notification", {
          type: p.type,
          title: p.title,
          message: p.message,
          actionUrl: p.actionUrl,
          actionLabel: p.actionLabel,
          metadata: p.metadata,
        });
      }
    } catch (error) {
      console.error("Failed to create course notifications:", error);
    }
  },
};
