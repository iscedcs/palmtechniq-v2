"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLearningPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 pt-20">
        {/* Video Player Skeleton */}
        <div className="relative w-full aspect-video bg-zinc-800/70 rounded-xl overflow-hidden">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            Loading video...
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-1/4 h-6 rounded-md" />
          <Skeleton className="w-full h-20 rounded-md" />
          <Skeleton className="w-5/6 h-20 rounded-md" />
          <Skeleton className="w-2/3 h-20 rounded-md" />
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <div className="hidden lg:block w-[320px] bg-zinc-900/60 border-l border-zinc-800 p-6 pt-24 space-y-4">
        <Skeleton className="w-3/4 h-6 rounded-md mb-4" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="flex-1 h-5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
