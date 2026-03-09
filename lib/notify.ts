import { db } from "./db";
import { NotificationType } from "@prisma/client";

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
   * Send notification to a specific user (persisted to DB for polling)
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
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  },

  /**
   * Send notification to all users with a specific role
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
    } catch (error) {
      console.error("Failed to create role notifications:", error);
    }
  },

  /**
   * Send notification to all users enrolled in a course
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
    } catch (error) {
      console.error("Failed to create course notifications:", error);
    }
  },
};
