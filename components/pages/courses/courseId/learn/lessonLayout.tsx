import { getCourseWithModules } from "@/data/course";

import LessonHeader from "./lessonHeader";
import VideoPlayer from "./lessonPlayer";
import LessonTabs from "./lessonTabs";
import LessonSidebar from "./lessonSidebar";

export default async function LessonLayout(props: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseId } = await props.params;
  const { lesson: lessonId } = await props.searchParams;
  const course = await getCourseWithModules(courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Course not found
      </div>
    );
  }

  // flatten all lessons
  const allLessons = course.modules.flatMap((m) => m.lessons);

  // find current lesson (from search param or default to first lesson)
  const currentLesson =
    allLessons.find((l) => l.id === lessonId) || allLessons[0];

  const completedLessonIds = allLessons
    .filter((lesson) => lesson.id !== currentLesson.id) // mark previous lessons as completed
    .map((lesson) => lesson.id);

  // 2️⃣ Map modules with isCompleted fields (normalize description for LessonSidebar's Lesson type)
  const modulesWithCompletion = course.modules.map((module) => {
    const lessons = module.lessons.map((lesson) => ({
      ...lesson,
      description: lesson.description ?? "",
      isCompleted: completedLessonIds.includes(lesson.id),
    }));

    return {
      ...module,
      lessons,
      isCompleted: lessons.every((lesson) => lesson.isCompleted),
    };
  });

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        No lessons available
      </div>
    );
  }

  async function markLessonCompleted(): Promise<void> {
    // Optionally, call an API to mark the lesson as completed for the user
    // Example:
    // await fetch(`/api/lessons/${currentLesson.id}/complete`, { method: "POST" });
    // You may want to show a toast or update local state here
    console.log(`Lesson ${currentLesson.id} marked as completed.`);
  }

  function goToNextLesson(): void {
    const currentIndex = allLessons.findIndex(
      (lesson) => lesson.id === currentLesson.id,
    );
    const nextLesson = allLessons[currentIndex + 1];

    if (nextLesson) {
      const nextLessonUrl = new URL(window.location.href);
      nextLessonUrl.searchParams.set("lesson", nextLesson.id);
      window.location.href = nextLessonUrl.toString();
    } else {
      console.log("You have completed all lessons in this course.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <LessonHeader course={course} currentLesson={currentLesson} />
          <VideoPlayer
            src={currentLesson.videoUrl!}
            poster="/placeholder.svg?height=400&width=800&text=Video+Thumbnail"
            markLessonComplete={markLessonCompleted}
            goToNextLesson={goToNextLesson}
          />
          <LessonTabs
            // completedLessons={completedLessonIds.length}
            // totalLessons={allLessons.length}
            description={currentLesson.description || ""}
            lessonResources={[]}
            moduleResources={[]}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 border-l border-white/10">
          <LessonSidebar
            courseTitle={course.title}
            progress={Math.round(
              (allLessons.findIndex(
                (lesson) => lesson.id === currentLesson.id,
              ) /
                allLessons.length) *
                100,
            )}
            modules={modulesWithCompletion}
            currentLessonId={currentLesson.id}
            onChangeLesson={(lesson) => {
              const lessonUrl = new URL(window.location.href);
              lessonUrl.searchParams.set("lesson", lesson.id);
              window.location.href = lessonUrl.toString();
            }}
          />
        </div>
      </div>
    </div>
  );
}
