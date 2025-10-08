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

export const notify = {
  user: (userId: string, p: NotificationPayload) =>
    getIO()?.to(`user:${userId}`).emit("notification", p),
  role: (role: string, p: NotificationPayload) =>
    getIO()?.to(`role:${role}`).emit("notification", p),
  course: (courseId: string, p: NotificationPayload) =>
    getIO()?.to(`course:${courseId}`).emit("notification", p),
};
