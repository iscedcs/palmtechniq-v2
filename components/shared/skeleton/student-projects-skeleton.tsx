"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProjectCardSkeleton() {
  return (
    <div className="p-6 bg-white/5 rounded-lg border border-white/10 space-y-4 animate-pulse">
      {/* Title + badges */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />

      {/* Meta row */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Technologies */}
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Submissions */}
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 flex-1 rounded-full" />
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}
