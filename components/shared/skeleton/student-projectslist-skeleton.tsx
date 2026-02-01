"use client";

import StudentProjectCardSkeleton from "./student-projects-skeleton";

export default function StudentProjectsListSkeleton({
  count = 3,
}: {
  count?: number;
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <StudentProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
