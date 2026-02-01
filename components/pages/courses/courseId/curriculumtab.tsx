"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, Play, Lock } from "lucide-react";
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
      duration?: number | null;
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
    title?: string
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
            return (
              <Card key={module.id} className="glass-card border-white/10">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleModule(module.id)}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Module {sortedModules.indexOf(module) + 1}: {module.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-400">
                      <span>{module.lessons.length} lessons</span>
                      <span>{module.duration || 0} mins</span>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3">
                      {sortedLessons.map((lesson, lessonIndex) => {
                        const locked = !isEnrolled && !lesson.isPreview;
                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                              locked
                                ? "bg-white/5"
                                : "bg-white/5 hover:bg-white/10 cursor-pointer"
                            }`}
                            onClick={() =>
                              handleLessonClick(
                                lesson.id,
                                lesson.isPreview,
                                lesson.previewVideo,
                                lesson.title
                              )
                            }>
                            {/* Lesson Info */}
                            <div className="flex items-center space-x-3 flex-1">
                              {locked ? (
                                <Lock className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Play className="w-4 h-4 text-neon-blue" />
                              )}
                              <Badge className="bg-white/10 text-gray-300 border-white/10 text-xs">
                                Lesson {lessonIndex + 1}
                              </Badge>
                              <span className="text-gray-300 flex-1">
                                {lesson.title}
                              </span>
                              {lesson.isPreview && (
                                <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs">
                                  Preview
                                </Badge>
                              )}
                            </div>

                            {/* Duration + Preview Btn */}
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-400 text-sm">
                                {lesson.duration || 0} mins
                              </span>
                              {!locked && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-blue hover:bg-neon-blue/20">
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
