"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  isCompleted: boolean;
  isLocked?: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  isLocked?: boolean;
  task?: {
    hasTask: boolean;
    isSubmitted: boolean;
  };
}

export default function LessonSidebar({
  courseTitle,
  modules,
  currentLessonId,
  progress,
  onChangeLesson,
}: {
  courseTitle: string;
  modules: Module[];
  currentLessonId: string;
  progress: number;
  onChangeLesson: (lesson: Lesson) => void;
}) {
  const allLessons = modules.flatMap((m) => m.lessons);
  const [isOpen, setIsOpen] = useState(false);

  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const totalLessons = allLessons.length;

  return (
    <div className="w-full lg:w-[320px] xl:w-[360px] p-6 border-t lg:border-t-0 lg:border-l border-white/10">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-white text-xl">{courseTitle}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen((prev) => !prev)}
              className="lg:hidden text-gray-300 hover:text-white hover:bg-white/10">
              {isOpen ? "Hide lessons" : "Show lessons"}
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
          <Progress value={progress || 0} className="mt-2" />
          <p className="text-sm text-gray-400 mt-1">
            {completedLessons} of {totalLessons} lessons completed
          </p>
          {progress ?? 0}% completed
        </CardHeader>

        <CardContent className={`${isOpen ? "block" : "hidden"} lg:block`}>
          <ScrollArea className="h-[calc(100vh-240px)] pr-2">
            <div className="space-y-4">
              {modules.map((module) => {
                const moduleCompleted = module.lessons.every(
                  (lesson) => lesson.isCompleted
                );

                return (
                  <div key={module.id}>
                    {/* Module header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {moduleCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="font-medium text-white">{module.title}</h4>
                      {module.task?.hasTask ? (
                        module.task.isSubmitted ? (
                          <Badge className="bg-neon-green/20 text-neon-green border border-neon-green/40">
                            Task done
                          </Badge>
                        ) : (
                          <Badge className="bg-neon-orange/20 text-neon-orange border border-neon-orange/40">
                            Task required
                          </Badge>
                        )
                      ) : null}
                    </div>

                    {/* Lessons inside module */}
                    <div className="ml-7 space-y-2">
                      {module.lessons.map((lesson) => {
                        const isActive = lesson.id === currentLessonId;

                        return (
                          <Button
                            key={lesson.id}
                            variant="ghost"
                            className={`w-full justify-start p-3 rounded-lg transition-colors text-left h-auto whitespace-normal ${
                              lesson.isLocked && !lesson.isCompleted
                                ? "cursor-not-allowed opacity-40"
                                : isActive
                                ? "bg-neon-blue/20 border border-neon-blue/30 shadow-[0_0_15px_rgba(0,200,255,0.4)] animate-pulse-smooth"
                                : "hover:bg-white/5"
                            }`}
                            onClick={(e) => {
                              if (!lesson.isLocked || lesson.isCompleted) {
                                const button = e.currentTarget;
                                button.classList.add("lesson-click-flash");
                                setTimeout(
                                  () =>
                                    button.classList.remove(
                                      "lesson-click-flash"
                                    ),
                                  800
                                );
                                onChangeLesson(lesson);
                              }
                            }}
                            disabled={lesson.isLocked && !lesson.isCompleted}>
                            <div className="flex flex-col items-start w-full">
                              <div className="flex gap-2 w-full items-start">
                                {lesson.isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-400" />
                                )}
                                <span
                                  className={`text-sm leading-snug break-words ${
                                    isActive
                                      ? "text-white"
                                      : lesson.isLocked && !lesson.isCompleted
                                      ? "text-gray-500"
                                      : "text-gray-300"
                                  }`}>
                                  <span className="font-medium">
                                    {lesson.title}
                                  </span>
                                  {lesson.description && (
                                    <span className="text-gray-400">
                                      {" "}
                                      — {lesson.description}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 ml-6 mt-1">
                                {Math.floor(lesson.duration)} min
                              </p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
