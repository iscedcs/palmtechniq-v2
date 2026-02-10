"use client";

import ResourceUploaderComponent from "@/components/pages/courses/courseId/resources-uploader";
import { LessonQuizEditor } from "@/components/pages/tutor/edit/module-quiz-editor";
import { CourseCompletionTracker } from "@/components/shared/course-completion-tracker";
import LessonUploadFile from "@/components/shared/lesson-uploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, PlayCircle, Clock, BookOpen, Layers } from "lucide-react";
import { Dispatch, SetStateAction, useMemo, useRef } from "react";
import { updateLessonVideo } from "@/actions/tutor-actions";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

interface CourseLesson {
  id: string;
  title: string;
  lessonType: "VIDEO";
  duration: number;
  content?: string;
  description?: string;
  videoUrl?: string;
  sortOrder: number;
  isPreview: boolean;
  quiz?: {
    id: string;
    title: string;
    description?: string | null;
    timeLimit?: number | null;
    passingScore: number;
    maxAttempts: number;
  } | null;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  content?: string;
  duration: number;
  lessons: CourseLesson[];
  sortOrder: number;
  isPublished: boolean;
}

interface CourseCurriculumFormProps {
  modules: CourseModule[];
  addModule: () => void;
  removeModule: (e: React.MouseEvent, moduleId: string) => void;
  updateModule: (moduleId: string, updates: Partial<CourseModule>) => void;
  addLesson: (moduleId: string, courseId?: string) => void;
  removeLesson: (
    e: React.MouseEvent,
    moduleId: string,
    lessonId: string
  ) => void;
  updateLesson: (
    moduleId: string,
    lessonId: string,
    updates: Partial<CourseLesson>
  ) => void;
  lessonUploading: boolean;
  setLessonUploading: Dispatch<SetStateAction<boolean>>;
}

export function CourseCurriculumForm({
  modules,
  addModule,
  removeModule,
  updateModule,
  addLesson,
  removeLesson,
  updateLesson,
  lessonUploading,
  setLessonUploading,
}: CourseCurriculumFormProps) {
  const durationCache = useRef<Record<string, number>>({});
  // 🧮 Compute quick stats
  const stats = useMemo(() => {
    const totalLessons = modules.reduce(
      (sum, m) => sum + (m.lessons?.length || 0),
      0
    );
    const totalQuizzes = modules.reduce(
      (sum, module) =>
        sum + module.lessons.filter((lesson) => lesson.quiz).length,
      0
    );
    const totalDuration = modules.reduce(
      (sum, m) =>
        sum +
        (m.duration ||
          m.lessons.reduce((ls, l) => ls + (l.duration || 0), 0)),
      0
    );
    return {
      totalModules: modules.length,
      totalLessons,
      totalQuizzes,
      totalDuration,
    };
  }, [modules]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 sm:gap-6 relative">
      {/* ===== Left: Curriculum Editor ===== */}
      <Card className="glass-card border-white/10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3 sm:gap-0">
          <CardTitle className="text-xl md:text-2xl font-semibold text-white">
            Course Curriculum
          </CardTitle>
          <Button
            type="button"
            onClick={addModule}
            className="w-full sm:w-auto bg-gradient-to-r from-neon-blue to-neon-purple text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Module
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6">
          {modules.length === 0 && (
            <p className="text-gray-400 text-sm italic">
              No modules yet. Click “Add Module” to start structuring your
              course.
            </p>
          )}

          <Accordion type="multiple" className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="text-lg font-semibold text-white hover:text-neon-blue transition-colors">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-neon-green" />
                    Module {moduleIndex + 1}: {module.title || "Untitled Module"}
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4 shadow-inner">
                    {/* Module fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-sm text-gray-400 shrink-0">
                          Module {moduleIndex + 1}:
                        </span>
                        <Input
                          value={module.title}
                          onChange={(e) =>
                            updateModule(module.id, { title: e.target.value })
                          }
                          placeholder="Module title"
                          className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                        />
                      </div>
                      <div className="text-sm text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-purple" />
                        {module.duration} min
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        Module Description
                      </p>
                      <Textarea
                        value={module.description || ""}
                        onChange={(e) =>
                          updateModule(module.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter module description"
                        className="bg-white/10 border-white/20 text-sm sm:text-xl text-white min-h-[90px]"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        Module Content
                      </p>
                      <Textarea
                        value={module.content || ""}
                        onChange={(e) =>
                          updateModule(module.id, { content: e.target.value })
                        }
                        placeholder="Enter module content"
                        className="bg-white/10 border-white/20 text-sm sm:text-xl text-white min-h-[90px]"
                      />
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <ResourceUploaderComponent moduleId={module.id} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-between pt-3 border-t border-white/10">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => removeModule(e, module.id)}>
                        <X className="w-4 h-4 mr-1" /> Remove Module
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addLesson(module.id)}
                        className="bg-gradient-to-r from-neon-green to-green-400">
                        <Plus className="w-4 h-4 mr-2" /> Add Lesson
                      </Button>
                    </div>

                    {/* Lessons */}
                    <Accordion type="multiple" className="mt-4 space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <AccordionItem key={lesson.id} value={lesson.id}>
                          <AccordionTrigger className="text-md font-medium text-white hover:text-neon-green transition-colors">
                            Lesson {lessonIndex + 1}:{" "}
                            {lesson.title || "Untitled Lesson"}
                          </AccordionTrigger>

                          <AccordionContent>
                            <div className="bg-white/10 border border-white/20 p-2 sm:p-5 rounded-lg space-y-4">
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-xs text-gray-400 shrink-0">
                                  Lesson {lessonIndex + 1}:
                                </span>
                                <Input
                                  value={lesson.title}
                                  onChange={(e) =>
                                    updateLesson(module.id, lesson.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Lesson title"
                                  className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                                />
                              </div>

                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Lesson Description
                                </p>
                                <Textarea
                                  value={lesson.description || ""}
                                  onChange={(e) =>
                                    updateLesson(module.id, lesson.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Enter lesson description"
                                  className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                                />
                              </div>

                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Lesson Content
                                </p>
                                <Textarea
                                  value={lesson.content || ""}
                                  onChange={(e) =>
                                    updateLesson(module.id, lesson.id, {
                                      content: e.target.value,
                                    })
                                  }
                                  placeholder="Enter lesson content"
                                  className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                                />
                              </div>

                              <div className="grid md:grid-cols-2 gap-3">
                                <Select value={lesson.lessonType} disabled>
                                  <SelectTrigger className="bg-white/10 text-sm sm:text-xl border-white/20 text-white">
                                    <SelectValue placeholder="Lesson Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VIDEO">Video</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="text-sm text-gray-300 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-neon-purple" />
                                  {lesson.duration} min
                                </div>
                              </div>

                              {lesson.lessonType === "VIDEO" && (
                                <div className="space-y-3">
                                  {lesson.videoUrl ? (
                                    <>
                                      {isYoutubeUrl(lesson.videoUrl) ? (
                                        <iframe
                                          src={toYoutubeEmbedUrl(
                                            lesson.videoUrl
                                          )}
                                          title="Lesson video"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          className="w-full max-h-56 sm:max-h-64 rounded-lg border border-white/20"
                                        />
                                      ) : (
                                        <video
                                          src={lesson.videoUrl}
                                          controls
                                          className="w-full max-h-56 sm:max-h-64 rounded-lg border border-white/20"
                                        />
                                      )}
                                      <div className="space-y-2">
                                        <Input
                                          readOnly
                                          value={lesson.videoUrl}
                                          className="bg-white/10 border-white/20 text-xs sm:text-sm text-white"
                                        />
                                        <a
                                          href={lesson.videoUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-neon-blue underline underline-offset-4">
                                          Open current video
                                        </a>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">
                                      No video uploaded yet
                                    </p>
                                  )}
                                  <LessonUploadFile
                                    uploading={lessonUploading}
                                    setUploading={setLessonUploading}
                                    onUploadSuccess={(url) => {
                                      updateLesson(module.id, lesson.id, {
                                        videoUrl: url,
                                      });
                                      if (!lesson.id.startsWith("temp-")) {
                                        updateLessonVideo(
                                          lesson.id,
                                          url,
                                          durationCache.current[lesson.id]
                                        ).catch((error) => {
                                          console.error(error);
                                        });
                                      }
                                    }}
                                    onDuration={(minutes) => {
                                      durationCache.current[lesson.id] = minutes;
                                      updateLesson(module.id, lesson.id, {
                                        duration: minutes,
                                      });
                                    }}
                                  />
                                  <ResourceUploaderComponent
                                    lessonId={lesson.id}
                                  />
                                </div>
                              )}

                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-white font-medium mb-2">
                                  Lesson Quiz
                                </h4>
                                <LessonQuizEditor
                                  lessonId={lesson.id}
                                  existingQuiz={lesson.quiz ?? undefined}
                                />
                              </div>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) =>
                                  removeLesson(e, module.id, lesson.id)
                                }
                                className="mt-3">
                                <X className="w-4 h-4 mr-1" /> Remove Lesson
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* ===== Right: Sticky Summary Sidebar ===== */}
      <div className="hidden xl:block">
        <div className="sticky top-20">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md p-5 space-y-4 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3">
              Curriculum Overview
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-blue" /> Modules
                </span>
                <span className="font-medium text-white">
                  {stats.totalModules}
                </span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neon-green" /> Lessons
                </span>
                <span className="font-medium text-white">
                  {stats.totalLessons}
                </span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neon-purple" /> Duration
                </span>
                <span className="font-medium text-white">
                  {stats.totalDuration} min
                </span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-2">🧩 Quizzes</span>
                <span className="font-medium text-white">
                  {stats.totalQuizzes}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-gray-400 text-xs leading-relaxed">
                This summary updates automatically as you add modules, lessons,
                or quizzes. Great for keeping track of overall course depth.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
