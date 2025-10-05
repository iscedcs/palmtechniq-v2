"use client";
import { io, Socket } from "socket.io-client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNotificationsStore } from "@/lib/store/notifications-store";

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

  useEffect(() => {
    fetch("/api/socket").catch(() => {});

    if (!socketSingleton) {
      socketSingleton = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        withCredentials: true,
      });
    }
    const s = socketSingleton;
    setSocket(s);

    const onConnect = () => console.log("✅ Socket.IO connected:", s.id);
    const onDisconnect = () => console.log("❌ Socket.IO disconnected");

    const onNotify = (data: any) => {
      console.log("📩 Incoming notification:", data);
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
