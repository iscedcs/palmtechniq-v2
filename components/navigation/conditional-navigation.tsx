"use client";

import { usePathname } from "next/navigation";
import React from "react";

export function ConditionalNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide main LMS navigation when accessing any bootcamp routes
  if (pathname?.startsWith("/bootcamp")) {
    return null;
  }

  return <>{children}</>;
}
