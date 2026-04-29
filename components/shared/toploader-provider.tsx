"use client";

import React, { Suspense } from "react";
import type { ReactNode } from "react";
import { CyberToploader } from "../ui/top-loader";

interface ToploaderProviderProps {
  children: ReactNode;
  color?: string;
  height?: number;
  showSpinner?: boolean;
  crawlSpeed?: number;
  speed?: number;
}

export function ToploaderProvider({
  children,
  color = "linear-gradient(90deg, #00343d 0%, #27ba55 50%, #000000 100%)",
  height = 4,
  showSpinner = true,
  crawlSpeed = 200,
  speed = 300,
}: ToploaderProviderProps) {
  return (
    <>
      {/* CyberToploader uses useSearchParams under the hood; wrap in Suspense */}
      <Suspense fallback={null}>
        <CyberToploader
          color={color}
          height={height}
          showSpinner={showSpinner}
          crawlSpeed={crawlSpeed}
          speed={speed}
        />
      </Suspense>
      {children}
    </>
  );
}
