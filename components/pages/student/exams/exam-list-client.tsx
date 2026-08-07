"use client";

import type { ExamAvailability, StudentExamSummary } from "@/data/exam";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, ClipboardList } from "lucide-react";
import Link from "next/link";

const STATE: Record<
  ExamAvailability,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  OPEN: { label: "Open now", variant: "default" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  UPCOMING: { label: "Upcoming", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "outline" },
  MISSED: { label: "Missed", variant: "destructive" },
  CLOSED: { label: "Closed", variant: "outline" },
};

const ORDER: ExamAvailability[] = [
  "IN_PROGRESS",
  "OPEN",
  "UPCOMING",
  "SUBMITTED",
  "CLOSED",
  "MISSED",
];

export function ExamListClient({ exams }: { exams: StudentExamSummary[] }) {
  if (exams.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-20 text-center">
        <ClipboardList className="mx-auto mb-3 size-10 text-gray-400" />
        <h1 className="text-xl font-semibold">No exams yet</h1>
        <p className="mt-1 text-sm text-gray-400">
          When a tutor schedules an exam for one of your courses, it will appear
          here.
        </p>
      </div>
    );
  }

  // Anything actionable first; anything finished last.
  const sorted = [...exams].sort(
    (a, b) => ORDER.indexOf(a.availability) - ORDER.indexOf(b.availability),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20">
      <h1 className="mb-1 text-2xl font-semibold">Exams</h1>
      <p className="mb-6 text-sm text-gray-400">
        Scheduled assessments for your courses and programmes.
      </p>

      <div className="space-y-3">
        {sorted.map((exam) => {
          const state = STATE[exam.availability];
          const actionable =
            exam.availability === "OPEN" || exam.availability === "IN_PROGRESS";

          return (
            <Card key={exam.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{exam.title}</h2>
                    <Badge variant={state.variant}>{state.label}</Badge>
                    {exam.resultReleased && exam.percentage !== null && (
                      <Badge variant={exam.passed ? "default" : "destructive"}>
                        {exam.percentage.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {exam.courseTitle && (
                    <p className="mt-0.5 text-sm text-gray-400">
                      {exam.courseTitle}
                    </p>
                  )}

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                    <CalendarClock className="size-3.5" />
                    {exam.opensAt
                      ? new Date(exam.opensAt).toLocaleString()
                      : "Not scheduled"}
                    {exam.durationMinutes
                      ? ` · ${exam.durationMinutes} min`
                      : ""}
                  </p>
                </div>

                <Button asChild variant={actionable ? "default" : "outline"}>
                  <Link href={`/student/exams/${exam.id}`}>
                    {exam.availability === "IN_PROGRESS"
                      ? "Continue"
                      : exam.availability === "OPEN"
                        ? "Start"
                        : "View"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
