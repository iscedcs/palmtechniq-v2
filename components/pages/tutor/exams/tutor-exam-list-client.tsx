"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, FilePlus2, Users } from "lucide-react";
import Link from "next/link";

type ExamRow = {
  id: string;
  title: string;
  status: string;
  scopeLabel: string;
  opensAt: Date | null;
  durationMinutes: number | null;
  totalPoints: number;
  candidateCount: number;
  questionCount: number;
  attemptCount: number;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> =
  {
    DRAFT: "secondary",
    SCHEDULED: "default",
    LIVE: "default",
    CLOSED: "outline",
    GRADING: "default",
    RELEASED: "outline",
    ARCHIVED: "outline",
  };

export function TutorExamListClient({ exams }: { exams: ExamRow[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Exams</h1>
          <p className="text-sm text-gray-400">
            Schedule and run assessments for your courses.
          </p>
        </div>
        <Button asChild>
          <Link href="/tutor/exams/new">
            <FilePlus2 className="mr-2 size-4" />
            New exam
          </Link>
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="font-medium">No exams yet</h2>
            <p className="mt-1 text-sm text-gray-400">
              Create one, add your questions, then publish it to your students.
            </p>
            <Button asChild className="mt-4">
              <Link href="/tutor/exams/new">Create your first exam</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{exam.title}</h2>
                    <Badge variant={STATUS_VARIANT[exam.status] ?? "secondary"}>
                      {exam.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-400">{exam.scopeLabel}</p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      {exam.opensAt
                        ? new Date(exam.opensAt).toLocaleString()
                        : "Not scheduled"}
                      {exam.durationMinutes ? ` · ${exam.durationMinutes} min` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {exam.candidateCount} candidate
                      {exam.candidateCount === 1 ? "" : "s"}
                    </span>
                    <span>
                      {exam.questionCount} question
                      {exam.questionCount === 1 ? "" : "s"}
                    </span>
                    {exam.attemptCount > 0 && <span>{exam.attemptCount} sat</span>}
                  </div>
                </div>

                <Button asChild variant="outline">
                  <Link href={`/tutor/exams/${exam.id}`}>
                    {exam.status === "DRAFT" ? "Edit" : "Manage"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
