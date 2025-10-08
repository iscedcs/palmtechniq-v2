"use client";

import { useState, useEffect, useRef } from "react";
import VideoPlayer from "@/components/pages/courses/courseId/learn/lessonPlayer";
import LessonTabs from "@/components/pages/courses/courseId/learn/lessonTabs";
import LessonSidebar from "@/components/pages/courses/courseId/learn/lessonSidebar";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";
import { LessonAIAssistant } from "@/components/ai/lesson-ai-assistant";

export default function CourseLearningPageClient({ courseData }: any) {
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
      }))
    );
    setAllLessons(lessons);

    const initialLesson =
      lessons.find((l: any) => !l.isCompleted) || lessons[0];
    if (initialLesson) {
      setCurrentLesson(initialLesson);
    }
  }, [courseData]);

  const changeLesson = (lesson: any) => {
    setCurrentLesson({
      ...lesson,
      isCompleted: lesson.isCompleted ?? false,
    });
    setCurrentTime(0);
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      console.log("Lesson marked complete:", lessonId);

      // update local state
      setAllLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, isCompleted: true } : l))
      );
      if (currentLesson?.id === lessonId) {
        setCurrentLesson({ ...currentLesson, isCompleted: true });
      }

      courseData.modules = courseData.modules.map((m: any) => ({
        ...m,
        lessons: m.lessons.map((l: any) =>
          l.id === lessonId ? { ...l, isCompleted: true } : l
        ),
      }));
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading course content...
      </div>
    );
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
          />
          <LessonTabs
            description={currentLesson.description || ""}
            resources={currentLesson.resources || []}
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
