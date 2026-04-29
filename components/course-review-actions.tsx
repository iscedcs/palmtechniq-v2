"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CourseReviewActionsProps {
  courseId: string;
}

export function CourseReviewActions({ courseId }: CourseReviewActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="border-white/20 text-white hover:bg-white/10">
        Back
      </Button>
      <Button
        onClick={() => {
          router.push(`/tutor/courses/${courseId}/edit`);
        }}
        className="bg-neon-blue hover:bg-neon-blue/90 text-white">
        View Full Details
      </Button>
    </div>
  );
}
