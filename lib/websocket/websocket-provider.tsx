"use client";
import { io, Socket } from "socket.io-client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { getUserPreferences } from "@/actions/user-preferences";
import { defaultUserPreferences } from "@/lib/user-preferences";

const WebSocketContext = createContext<{ socket: Socket | null }>({
  socket: null,
});
let socketSingleton: Socket | null = null;

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
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
  }, [addNotification]);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
