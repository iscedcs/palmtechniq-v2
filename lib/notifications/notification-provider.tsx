"use client";

import { createContext, useContext } from "react";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";

interface NotificationProviderContextType {
  isPolling: boolean;
  lastPollTime: string | null;
  refetch: () => Promise<void>;
}

const NotificationProviderContext =
  createContext<NotificationProviderContextType>({
    isPolling: false,
    lastPollTime: null,
    refetch: async () => {},
  });

export const useNotificationProvider = () =>
  useContext(NotificationProviderContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPolling, lastPollTime, refetch } = useNotificationPolling({
    enabled: true,
  });

  return (
    <NotificationProviderContext.Provider
      value={{ isPolling, lastPollTime, refetch }}>
      {children}
    </NotificationProviderContext.Provider>
  );
}
