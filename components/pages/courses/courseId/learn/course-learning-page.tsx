"use client";

import { useState, useEffect, useRef } from "react";
import VideoPlayer from "@/components/pages/courses/courseId/learn/lessonPlayer";
import LessonTabs from "@/components/pages/courses/courseId/learn/lessonTabs";
import LessonSidebar from "@/components/pages/courses/courseId/learn/lessonSidebar";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";
import { LessonAIAssistant } from "@/components/ai/lesson-ai-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CourseLearningPageSkeleton from "@/components/shared/skeleton/courselearningpageskeleton";
import { useRouter } from "next/navigation";

export default function CourseLearningPageClient({
  courseData,
  initialLessonId,
}: any) {
  const router = useRouter();

  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<number>(
    courseData.progress ?? 0
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [moduleTaskPrompt, setModuleTaskPrompt] = useState<{
    taskId: string;
    moduleTitle: string;
  } | null>(null);

  const [showAI, setShowAI] = useState(false);
  useEffect(() => {
    const lessons = courseData.modules.flatMap((m: any) =>
      m.lessons.map((l: any) => ({
        ...l,
        isCompleted: l.isCompleted ?? false,
        isLocked: l.isCompleted ? false : l.isLocked ?? false,
      }))
    );
    setAllLessons(lessons);

    let initialLesson = null;

    if (initialLessonId) {
      // Try to find the specific lesson to load
      initialLesson = lessons.find((l: any) => l.id === initialLessonId);
    }

    // Default to first incomplete or first lesson
    if (!initialLesson) {
      initialLesson =
        lessons.find((l: any) => !l.isCompleted && !l.isLocked) || lessons[0];
    }

    if (initialLesson) {
      setCurrentLesson(initialLesson);
    }
  }, [courseData, initialLessonId]);

  useEffect(() => {
    if (!currentLesson) return;
    const moduleForLesson = courseData.modules.find((m: any) =>
      m.lessons.some((l: any) => l.id === currentLesson.id)
    );
    if (!moduleForLesson) {
      setModuleTaskPrompt(null);
      return;
    }
    const isLastLesson =
      moduleForLesson.lessons?.[moduleForLesson.lessons.length - 1]?.id ===
      currentLesson.id;
    const taskInfo = moduleForLesson.task;
    if (
      isLastLesson &&
      taskInfo?.hasTask &&
      taskInfo.taskId &&
      !taskInfo.isSubmitted
    ) {
      setModuleTaskPrompt({
        taskId: taskInfo.taskId,
        moduleTitle: moduleForLesson.title,
      });
    } else {
      setModuleTaskPrompt(null);
    }
  }, [currentLesson, courseData.modules]);

  const changeLesson = (lesson: any) => {
    if (lesson.isLocked && !lesson.isCompleted) {
      toast.error(
        "This lesson is locked. Complete the previous lessons first."
      );
      return;
    }
    setCurrentLesson({
      ...lesson,
      isCompleted: lesson.isCompleted ?? false,
    });
    setCurrentTime(0);
    window.history.replaceState(
      null,
      "",
      `/courses/${courseData.id}/learn/${lesson.id}`
    );
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        body: JSON.stringify({ duration: Math.floor(duration) }),
      });
      console.log("Lesson marked complete:", lessonId);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (typeof data.progress === "number") {
        setCourseProgress(data.progress);
        courseData.progress = data.progress;
      }

      // Update the completion and unlocking logic
      const updatedLessons = allLessons.map((l, idx, arr) => {
        if (l.id === lessonId) {
          // mark this one complete
          return { ...l, isCompleted: true };
        }

        // unlock the next lesson only if quiz is passed or not required
        const prev = arr[idx - 1];
        if (
          prev &&
          prev.id === lessonId &&
          (!prev.quiz || prev.quizPassed)
        ) {
          return { ...l, isLocked: false };
        }

        return l;
      });
      // update local state
      setAllLessons(updatedLessons);

      if (currentLesson?.id === lessonId) {
        setCurrentLesson({ ...currentLesson, isCompleted: true });
      }

      courseData.modules = courseData.modules.map((m: any) => {
        const lessonIndex = m.lessons.findIndex((l: any) => l.id === lessonId);
        if (lessonIndex === -1) return m; // skip unrelated modules

        const updatedLessons = m.lessons.map((l: any, idx: number) => {
          if (l.id === lessonId) return { ...l, isCompleted: true };
          if (
            idx === lessonIndex + 1 &&
            (!m.lessons[idx - 1]?.quiz || m.lessons[idx - 1]?.quizPassed)
          )
            return { ...l, isLocked: false };
          return l;
        });

        return { ...m, lessons: updatedLessons };
      });
      // courseData.modules = courseData.modules.map((m: any) => ({
      //   ...m,
      //   lessons: m.lessons.map((l: any, idx: number) => {
      //     if (l.id === lessonId) return { ...l, isCompleted: true };
      //     const prev = m.lessons[idx - 1];
      //     if (prev && prev.id === lessonId) return { ...l, isLocked: false };
      //     return l;
      //   }),
      // }));

      if (data.quizId) {
        toast.info("Lesson completed! Start the quiz below to continue.");
        return;
      }

      const moduleForLesson = courseData.modules.find((m: any) =>
        m.lessons.some((l: any) => l.id === lessonId)
      );
      const isLastLessonInModule =
        moduleForLesson?.lessons?.[moduleForLesson.lessons.length - 1]?.id ===
        lessonId;

      if (
        isLastLessonInModule &&
        data.taskRequired &&
        data.moduleTaskId &&
        !data.moduleTaskSubmitted
      ) {
        setModuleTaskPrompt({
          taskId: data.moduleTaskId,
          moduleTitle: moduleForLesson?.title || "this module",
        });
        toast.info(
          "This module has a task. Submit it to stay eligible for your certificate."
        );
      }

      if (
        data.certificateEnabled &&
        data.courseCompleted &&
        !data.certificateEligible
      ) {
        const missing: string[] = [];
        if (data.certificateMissing?.quizzes) missing.push("quizzes");
        if (data.certificateMissing?.tasks) missing.push("module tasks");
        if (data.certificateMissing?.projects) missing.push("course project");
        if (missing.length > 0) {
          toast.info(
            `Course completed, but certificate requires: ${missing.join(", ")}.`
          );
        }
      }

      toast.success("Lesson completed! Moving to the next lesson...");
      setTimeout(() => {
        const idx = updatedLessons.findIndex((l) => l.id === lessonId);
        if (idx >= 0 && idx < updatedLessons.length - 1) {
          changeLesson(updatedLessons[idx + 1]);
        }
        if (idx === updatedLessons.length - 1) {
          toast.success("🎉 Course completed!");
        }
      }, 1800);
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      toast.error("Failed to mark lesson as complete.");
    }
  };

  if (!currentLesson) {
    return <CourseLearningPageSkeleton />;
  }

  const currentModule = courseData.modules.find((m: any) =>
    m.lessons.some((l: any) => l.id === currentLesson.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-[1600px] flex flex-col lg:flex-row gap-6 px-4">
          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                  {currentLesson.title}
                </h1>
                <p className="text-sm text-gray-400">
                  {currentModule?.title ?? "Module"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentLesson.quiz ? (
                  <Badge className="bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                    Quiz Available
                  </Badge>
                ) : null}
                {currentLesson.quizPassed ? (
                  <Badge className="bg-neon-green/20 text-neon-green border border-neon-green/40">
                    Quiz Passed
                  </Badge>
                ) : null}
                {currentLesson.isCompleted ? (
                  <Badge className="bg-neon-green/20 text-neon-green border border-neon-green/40">
                    Completed
                  </Badge>
                ) : currentLesson.isLocked ? (
                  <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/40">
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-neon-blue/20 text-neon-blue border border-neon-blue/40">
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <VideoPlayer
            src={currentLesson.videoUrl}
            poster={currentLesson.thumbnailUrl}
            autoPlay
            markLessonComplete={() => markLessonComplete(currentLesson.id)}
            onDurationChange={(d) => setDuration(d)}
          />
          {currentLesson?.isCompleted &&
            currentLesson?.quiz &&
            !currentLesson?.quizPassed && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() =>
                    router.push(
                      `/courses/${courseData.id}/quiz/${currentLesson.quiz.id}`
                    )
                  }
                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                  Start Quiz
                </Button>
              </div>
            )}
          {moduleTaskPrompt && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-neon-orange/40 bg-neon-orange/10 p-4 text-sm text-orange-100 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">Module task available</p>
                <p className="text-orange-200/80">
                  Complete the task for {moduleTaskPrompt.moduleTitle} to stay
                  eligible for your certificate.
                </p>
              </div>
              <Button
                onClick={() =>
                  router.push(
                    `/student/assignments?taskId=${moduleTaskPrompt.taskId}`
                  )
                }
                className="bg-gradient-to-r from-neon-orange to-orange-400 text-white">
                Go to Task
              </Button>
            </div>
          )}
          <LessonTabs
            description={currentLesson.description || ""}
            lessonResources={currentLesson.resources || []}
            moduleResources={currentModule?.resources || []}
            reviews={currentLesson.reviews || []}
            quiz={currentLesson.quiz}
            courseId={courseData.id}
            isCompleted={currentLesson.isCompleted}
            quizPassed={currentLesson.quizPassed}
          />
        </div>

          {/* Sidebar */}
          <LessonSidebar
            progress={courseProgress}
            courseTitle={courseData.title}
            modules={courseData.modules}
            currentLessonId={currentLesson.id}
            onChangeLesson={changeLesson}
          />
        </div>

        {/* AI Assistant */}
        <FloatingAIButton
          onActivate={() => setShowAI(true)}
          isActive={showAI}
          lessonProgress={(currentTime / duration) * 100}
        />
        <LessonAIAssistant
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          lessonContent={currentLesson.description}
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      </div>
    </div>
  );
}
