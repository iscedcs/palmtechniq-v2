// lib/store/notifications-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "course"
  | "payment"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: Notification[];
  isOpen: boolean;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleDropdown: () => void;
  openDropdown: () => void;
  closeDropdown: () => void;

  // Computed (derived)
  unreadCount: () => number;
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
}

// Helpers
const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const MAX_NOTIFICATIONS = 100;

const shouldDedupe = (
  a: Omit<Notification, "id" | "createdAt" | "isRead">,
  b: Notification
) => {
  // Same title+message within 5s => treat as duplicate burst
  if (a.title !== b.title || a.message !== b.message) return false;
  const delta = Date.now() - new Date(b.createdAt).getTime();
  return delta <= 5000;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isOpen: false,

      addNotification: (data) => {
        const state = get();

        // Optional: dedupe rapid duplicates
        const existing = state.notifications.find((n) => shouldDedupe(data, n));
        if (existing) {
          // If it was unread, leave as unread; optionally bump createdAt
          set({
            notifications: [
              { ...existing, createdAt: new Date().toISOString() },
              ...state.notifications.filter((n) => n.id !== existing.id),
            ].slice(0, MAX_NOTIFICATIONS),
          });
          return;
        }

        const notification: Notification = {
          ...data,
          id: genId(),
          createdAt: new Date().toISOString(),
          isRead: false,
        };

        set({
          notifications: [notification, ...state.notifications].slice(
            0,
            MAX_NOTIFICATIONS
          ),
        });

        // Browser toast (best requested after user gesture, but allowed here if granted)
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
            });
          }
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      toggleDropdown: () => set((s) => ({ isOpen: !s.isOpen })),
      openDropdown: () => set({ isOpen: true }),
      closeDropdown: () => set({ isOpen: false }),

      // Derived
      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
      getUnreadNotifications: () =>
        get().notifications.filter((n) => !n.isRead),
      getNotificationsByType: (type) =>
        get().notifications.filter((n) => n.type === type),
    }),
    {
      name: "notifications-storage",
      partialize: (state) => ({
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.notifications?.length > MAX_NOTIFICATIONS) {
          state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
        }
      },
    }
  )
);

export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {}
  }
}

// Existing helpers — unchanged API; they’ll now get uuid + ISO createdAt
export const notificationHelpers = {
  courseEnrollment: (courseTitle: string) => {
    useNotificationsStore.getState().addNotification({
      type: "success",
      title: "Course Enrollment Successful",
      message: `You've successfully enrolled in ${courseTitle}`,
      actionUrl: "/student/courses",
      actionLabel: "View Courses",
    });
  },
  paymentSuccess: (amount: number, courseTitle: string) => {
    useNotificationsStore.getState().addNotification({
      type: "success",
      title: "Payment Successful",
      message: `Payment of ₦${amount} for ${courseTitle} has been processed`,
      actionUrl: "/student/courses",
      actionLabel: "View Courses",
    });
  },
  assignmentDue: (assignmentTitle: string, dueDate: string) => {
    useNotificationsStore.getState().addNotification({
      type: "warning",
      title: "Assignment Due Soon",
      message: `${assignmentTitle} is due on ${dueDate}`,
      actionUrl: "/student/assignments",
      actionLabel: "View Assignment",
    });
  },
  newMessage: (senderName: string) => {
    useNotificationsStore.getState().addNotification({
      type: "info",
      title: "New Message",
      message: `You have a new message from ${senderName}`,
      actionUrl: "/messages",
      actionLabel: "View Messages",
    });
  },
};
