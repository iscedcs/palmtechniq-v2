"use client";

import { formatDurationMinutes } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, Play, Lock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CoursePreviewModal } from "@/components/conversion-features";

export default function CurriculumTab({
  modules,
  isEnrolled,
  courseId,
}: {
  modules: {
    id: string;
    title: string;
    duration?: number | null;
    sortOrder?: number | null;
    lessons: {
      id: string;
      title: string;
      duration?: number | string;
      sortOrder?: number | null;
      isPreview?: boolean;
      previewVideo?: string | null;
    }[];
  }[];
  isEnrolled: boolean;
  courseId: string;
}) {
  const router = useRouter();
  const [openModule, setOpenModule] = useState<string | null>(null);
  const sortedModules = [...modules].sort((a, b) => {
    const aOrder = a.sortOrder ?? 0;
    const bOrder = b.sortOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title);
  });
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    previewUrl?: string | null;
  }>({ isOpen: false, title: "", previewUrl: "" });
  const toggleModule = (id: string) => {
    setOpenModule(openModule === id ? null : id);
  };

  const handleLessonClick = (
    lessonId: string,
    isPreview?: boolean,
    previewUrl?: string | null,
    title?: string,
  ) => {
    if (isEnrolled) {
      router.push(`/courses/${courseId}/learn?lesson=${lessonId}`);
    } else if (isPreview && previewUrl) {
      setPreviewModal({
        isOpen: true,
        title: title || "Lesson Preview",
        previewUrl,
      });
    } else {
      toast("Purchase this course to unlock full content.", {
        description: "Only preview lessons are available until you enroll.",
      });
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4">
        {sortedModules.length === 0 ? (
          <p className="text-gray-400">No curriculum available yet.</p>
        ) : (
          sortedModules.map((module) => {
            const isOpen = openModule === module.id;
            const sortedLessons = [...module.lessons].sort((a, b) => {
              const aOrder = a.sortOrder ?? 0;
              const bOrder = b.sortOrder ?? 0;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.title.localeCompare(b.title);
            });
            const totalDuration =
              module.duration ||
              module.lessons.reduce((acc: number, l) => {
                const d = typeof l.duration === "number" ? l.duration : parseFloat(String(l.duration || 0));
                return acc + (Number.isFinite(d) ? d : 0);
              }, 0);

            return (
              <Card
                key={module.id}
                className="glass-card border-white/10 overflow-hidden">
                <CardHeader
                  className="cursor-pointer p-4 sm:p-6"
                  onClick={() => toggleModule(module.id)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      Module {sortedModules.indexOf(module) + 1}: {module.title}
                    </h3>
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-gray-400 shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-white/5 border-white/10 text-gray-300 text-xs shrink-0 whitespace-nowrap">
                          {module.lessons.length}{" "}
                          {module.lessons.length === 1 ? "lesson" : "lessons"}
                        </Badge>
                        <span className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm shrink-0 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDurationMinutes(totalDuration)}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 pt-2">
                      {sortedLessons.map((lesson, lessonIndex) => {
                        const locked = !isEnrolled && !lesson.isPreview;
                        return (
                          <div
                            key={lesson.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg gap-2 transition-colors group ${
                              locked
                                ? "bg-white/5"
                                : "bg-white/5 hover:bg-white/10 cursor-pointer"
                            }`}
                            onClick={() =>
                              handleLessonClick(
                                lesson.id,
                                lesson.isPreview,
                                lesson.previewVideo,
                                lesson.title,
                              )
                            }>
                            {/* Lesson Info */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {locked ? (
                                <Lock className="w-4 h-4 text-gray-500 shrink-0" />
                              ) : (
                                <Play className="w-4 h-4 text-neon-blue shrink-0" />
                              )}
                              <Badge className="bg-white/10 text-gray-300 border-white/10 text-xs shrink-0 whitespace-nowrap">
                                Lesson {lessonIndex + 1}
                              </Badge>
                              <span className="text-gray-300 text-sm flex-1 truncate sm:whitespace-normal">
                                {lesson.title}
                              </span>
                              {lesson.isPreview && (
                                <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs shrink-0 whitespace-nowrap">
                                  Preview
                                </Badge>
                              )}
                            </div>

                            {/* Duration + Preview Btn */}
                            <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 text-xs sm:text-sm">
                              <span className="text-gray-400 whitespace-nowrap">
                                {formatDurationMinutes(lesson.duration)}
                              </span>
                              {!locked && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-neon-blue hover:bg-neon-blue/20 text-xs h-7 px-2">
                                  {isEnrolled ? "Start" : "Preview"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </motion.div>

      <CoursePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, title: "", previewUrl: "" })
        }
        courseTitle={previewModal.title}
        previewUrl={previewModal.previewUrl!}
      />
    </>
  );
}
