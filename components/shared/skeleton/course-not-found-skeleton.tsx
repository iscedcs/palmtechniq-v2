"use client";
import { Button } from "@/components/ui/button";
import { BookX } from "lucide-react";

export default function CourseNotFoundSkeleton() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-white text-center px-6">
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-neutral-900 p-6 rounded-full">
          <BookX className="h-10 w-10 text-white/70" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-2">Course not found</h1>
          <p className="text-white/60 max-w-md">
            The course you’re looking for doesn’t exist or may have been
            removed.
          </p>
        </div>

        <Button
          variant="secondary"
          className="rounded-xl mt-4"
          onClick={() => (window.location.href = "/courses")}>
          Back to Courses
        </Button>
      </div>
    </main>
  );
}
