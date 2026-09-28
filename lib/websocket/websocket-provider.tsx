"use client";
import { io, Socket } from "socket.io-client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { getUserPreferences } from "@/actions/user-preferences";
import { defaultUserPreferences } from "@/lib/user-preferences";

const WebSocketContext = createContext<{ socket: Socket | null }>({
  socket: null,
});
let socketSingleton: Socket | null = null;
// Which signed-in user the current connection was authenticated as, so a
// switch to a different account (or signing out) in the same tab — without
// a full page reload — forces a fresh handshake instead of leaving the
// connection joined to the previous user's rooms indefinitely.
let socketOwnerId: string | null | undefined = undefined;

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [preferences, setPreferences] = useState(defaultUserPreferences);
  const preferencesRef = useRef(preferences);

  const shouldShowNotification = (data: any) => {
    const current = preferencesRef.current;
    if (!current?.pushNotifications) return false;

    const rawCategory =
      data?.metadata?.category || data?.metadata?.type || data?.type || "";
    const category = String(rawCategory).toLowerCase();

    if (category.includes("course") && category.includes("reminder")) {
      return current.courseReminders;
    }
    if (category.includes("mentorship")) {
      return current.mentorshipAlerts;
    }
    if (category.includes("achievement")) {
      return current.achievementNotifications;
    }
    if (category.includes("weekly") && category.includes("progress")) {
      return current.weeklyProgress;
    }
    if (category.includes("marketing")) {
      return current.marketingEmails;
    }

    return true;
  };

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const result = await getUserPreferences();
        if (!isMounted) return;
        setPreferences(result.preferences);
      } catch {
        if (!isMounted) return;
        setPreferences(defaultUserPreferences);
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetch("/api/socket").catch(() => {});

    if (!socketSingleton) {
      socketSingleton = io({
        path: "/api/socket",
        transports: ["polling"],
        upgrade: false,
        withCredentials: true,
      });
      socketOwnerId = userId;
    } else if (socketOwnerId !== userId) {
      // The identity behind this tab changed (a different account signed
      // in, or this one signed out) without a page reload. The existing
      // connection is still authenticated and joined to the old rooms —
      // force it to re-handshake against the current cookies so it ends up
      // in the right (or no) rooms.
      socketOwnerId = userId;
      socketSingleton.disconnect();
      socketSingleton.connect();
    }
    const s = socketSingleton;
    setSocket(s);

    const onConnect = () => console.log("✅ Socket.IO connected:", s.id);
    const onDisconnect = () => console.log("❌ Socket.IO disconnected");

    const onNotify = (data: any) => {
      console.log("📩 Incoming notification:", data);
      if (!shouldShowNotification(data)) return;
      addNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
      });
    };

    s.on("connect", onConnect);
    s.on("notification", onNotify);
    s.on("disconnect", onDisconnect);

    return () => {
      s.off("notification", onNotify);
      s.off("connect");
      s.off("disconnect");
    };
  }, [addNotification, userId]);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
