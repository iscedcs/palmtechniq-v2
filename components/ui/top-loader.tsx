"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Skeleton } from "./skeleton";

interface CyberToploaderProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
  crawlSpeed?: number;
  speed?: number;
  easing?: string;
  shadow?: boolean;
}

export function CyberToploader({
  color = "linear-gradient(90deg, #00343d 0%, #27ba55 50%, #000000 100%)",
  height = 4,
  showSpinner = false,
  crawlSpeed = 200,
  speed = 200,
  easing = "ease",
  shadow = true,
}: CyberToploaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate loading progress
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, crawlSpeed);

      // Complete loading after navigation
      timeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, speed);
      }, 100);
    };

    startLoading();

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [pathname, searchParams, crawlSpeed, speed]);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Main Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{ height: `${height}px` }}>
        {/* Background Track */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-blue/10 to-transparent animate-pulse" />
        </div>

        {/* Progress Fill */}
        <div
          className="h-full relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: color,
            transition: `width ${speed}ms ${easing}`,
            boxShadow: shadow
              ? `0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(244, 114, 182, 0.3)`
              : "none",
          }}>
          {/* Animated Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

          {/* Moving Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 w-1 h-full bg-white/60 animate-pulse"
                style={{
                  left: `${20 * i}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>

          {/* Trailing Edge Glow */}
          <div
            className="absolute top-0 right-0 w-8 h-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 100%)",
              filter: "blur(2px)",
            }}
          />
        </div>

        {/* Cyber Grid Overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px),
              linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Spinner */}
      {showSpinner && isLoading && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
          <div className="relative">
            {/* Outer Ring */}
            <div className="w-8 h-8 border-2 border-transparent border-t-neon-blue border-r-neon-purple rounded-full animate-spin">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 blur-sm" />
            </div>

            {/* Inner Ring */}
            <div
              className="absolute inset-1 w-6 h-6 border-2 border-transparent border-b-neon-pink border-l-neon-green rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-pink/20 to-neon-green/20 blur-sm" />
            </div>

            {/* Center Dot */}
            <div className="absolute inset-3 w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-neon-blue/50" />
          </div>
        </div>
      )}

      {/* Loading Text */}
      {isLoading && (
        <div className="fixed top-4 left-4 z-[9999] pointer-events-none">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <div className="text-neon-blue animate-pulse">●</div>
            <span className="text-gradient bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              <Skeleton className="w-4 h4" />
            </span>
          </div>
        </div>
      )}

      {/* Completion Flash */}
      {progress === 100 && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 animate-pulse"
            style={{ animationDuration: "0.3s" }}
          />
        </div>
      )}
    </>
  );
}
