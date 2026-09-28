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
  // Whose notifications are currently held (persisted to localStorage, so it
  // survives reloads). Compared against the live session on every mount —
  // see syncOwner.
  ownerUserId: string | null;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => void;
  /**
   * Call with the current session's user id (or null when signed out) as
   * soon as it's known. This store persists to a single, un-namespaced
   * localStorage key shared by every account that ever signs in on this
   * browser — without this check, switching accounts on a shared device
   * left the previous account's notifications (including admin- or
   * tutor-only ones) visible to whoever signs in next. When the id differs
   * from who the store currently belongs to, it wipes the list and takes
   * ownership; same id is a no-op.
   */
  syncOwner: (userId: string | null) => void;
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
      ownerUserId: null,

      syncOwner: (userId) => {
        if (get().ownerUserId === userId) return;
        set({ ownerUserId: userId, notifications: [] });
      },

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
        const notification = get().notifications.find((n) => n.id === id);
        if (notification?.metadata?.dbId) {
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [notification.metadata.dbId] }),
          }).catch(console.error);
        }
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAllRead: true }),
        }).catch(console.error);
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
        }));
      },

      removeNotification: (id) => {
        const notification = get().notifications.find((n) => n.id === id);
        if (notification?.metadata?.dbId) {
          fetch(`/api/notifications?id=${notification.metadata.dbId}`, {
            method: "DELETE",
          }).catch(console.error);
        }
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        fetch("/api/notifications?clearAll=true", {
          method: "DELETE",
        }).catch(console.error);
        set({ notifications: [] });
      },

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
        ownerUserId: state.ownerUserId,
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
