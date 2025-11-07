"use client";

import { useState, useEffect, useRef } from "react";
import VideoPlayer from "@/components/pages/courses/courseId/learn/lessonPlayer";
import LessonTabs from "@/components/pages/courses/courseId/learn/lessonTabs";
import LessonSidebar from "@/components/pages/courses/courseId/learn/lessonSidebar";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";
import { LessonAIAssistant } from "@/components/ai/lesson-ai-assistant";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

      // Update the completion and unlocking logic
      const updatedLessons = allLessons.map((l, idx, arr) => {
        if (l.id === lessonId) {
          // mark this one complete
          return { ...l, isCompleted: true };
        }

        // unlock the next lesson if previous one is now completed
        const prev = arr[idx - 1];
        if (prev && prev.id === lessonId) {
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
          if (idx === lessonIndex + 1) return { ...l, isLocked: false }; // unlock next in same module
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

      const currentModule = courseData.modules.find((m: any) =>
        m.lessons.some((l: any) => l.id === lessonId)
      );

      const moduleQuiz = currentModule?.quiz;

      if (data.resetQuiz && data.quizId) {
        toast.info("Your quiz attempts have been reset. Redirecting...");
        setTimeout(() => {
          router.push(`/courses/${courseData.id}/quiz/${data.quizId}`);
        }, 2000);
        return;
      }

      const allLessonsCompleted = currentModule?.lessons.every(
        (l: any) => l.isCompleted
      );

      const previouslyCompleted = currentLesson?.isCompleted;
      if (allLessonsCompleted && !previouslyCompleted) {
        if (moduleQuiz) {
          toast.success("🎯 Module lessons completed! Redirecting to quiz...");
          setTimeout(() => {
            router.push(`/courses/${courseData.id}/quiz/${moduleQuiz.id}`);
          }, 1500);
        } else {
          toast.info(" ✅Module completed! No quiz assigned.");
        }
        return;
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

  return (
    <div className="min-h-screen bg-background ">
      <div className="pt-20 flex">
        {/* Main Content */}

        <div className="flex-1 p-6">
          <VideoPlayer
            src={currentLesson.videoUrl}
            poster={currentLesson.thumbnailUrl}
            autoPlay
            markLessonComplete={() => markLessonComplete(currentLesson.id)}
            goToNextLesson={() => {
              const idx = allLessons.findIndex(
                (l) => l.id === currentLesson.id
              );
              if (idx < allLessons.length - 1)
                changeLesson(allLessons[idx + 1]);
            }}
            onDurationChange={(d) => setDuration(d)}
          />
          <LessonTabs
            description={currentLesson.description || ""}
            lessonResources={currentLesson.resources || []}
            moduleResources={
              courseData.modules.find((m: any) =>
                m.lessons.some((l: any) => l.id === currentLesson.id)
              )?.resources || []
            }
            reviews={currentLesson.reviews || []}
          />
        </div>

        {/* Sidebar */}
        <LessonSidebar
          progress={courseData.progress}
          courseTitle={courseData.title}
          modules={courseData.modules}
          currentLessonId={currentLesson.id}
          onChangeLesson={changeLesson}
        />

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
