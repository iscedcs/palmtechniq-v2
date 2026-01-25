"use client";

import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, ChevronDown, ChevronUp, Clock } from "lucide-react";
import LessonUploadFile from "@/components/shared/lesson-uploader";
import { toast } from "sonner";
import { SortableItem } from "../shared/sortable-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lessonSchema, moduleSchema } from "@/schemas";
import { addLessonToModule, addModuleToCourse } from "@/actions/tutor-actions";
import { UseFormReturn } from "react-hook-form";

interface CourseCurriculumBuilderProps {
  form: UseFormReturn<any>;
  modules: CourseModule[];
  setModules: Dispatch<SetStateAction<CourseModule[]>>;

  // setModules: (mods: CourseModule[]) => void;
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

interface CourseLesson {
  id: string;
  title: string;
  type: "VIDEO";
  duration: number;
  content?: string;
  description?: string;
  videoUrl?: string;
  sortOrder: number;
  isPreview: boolean;
}

export default function CourseCurriculumBuilder({
  form,
  modules,
  setModules,
}: CourseCurriculumBuilderProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [lessonUploading, setLessonUploading] = useState(false);

  // --- Local Draft Persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem("courseBasicInfoDraft", JSON.stringify(values));
    });
    return () => subscription.unsubscribe?.();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem("courseBasicInfoDraft");
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, []);

  // ✅ Only start dragging when moving >5px — allows clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const toggleModuleExpand = (id: string) =>
    setExpandedModule((prev) => (prev === id ? null : id));

  const addModule = async (courseId?: string) => {
    const newModule: CourseModule = {
      id: `temp-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      description: "",
      content: "",
      duration: 0,
      lessons: [],
      sortOrder: modules.length,
      isPublished: false,
    };

    const ValidatedModule = moduleSchema.safeParse(newModule);
    if (!ValidatedModule.success) {
      toast.error(
        ValidatedModule.error.issues[0]?.message || "Validation error"
      );
      return;
    }
    if (courseId) {
      const result = await addModuleToCourse(courseId, ValidatedModule.data);
      if (result.success) {
        setModules((prev) => [...prev, { ...newModule, id: result.moduleId }]);

        // setModules([...modules, { ...newModule, id: result.moduleId }]);
      } else {
        toast.error(result.error);
      }
    } else setModules((prev) => [...prev, newModule]);
    // else
    //   setModules([...modules, newModule]);
  };

  const updateModule = (id: string, updates: Partial<CourseModule>) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };
  // const updateModule = (id: string, updates: Partial<CourseModule>) =>
  //   setModules(modules.map((m) => (m.id === id ? { ...m, ...updates } : m)));

  const removeModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    toast.success("Module removed");
  };
  // const removeModule = (id: string) => {
  //   setModules(modules.filter((m) => m.id !== id));
  //   toast.success("Module removed");
  // };

  const addLesson = async (moduleId: string, courseId?: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;
    const newLesson: CourseLesson = {
      id: `temp-${Date.now()}`,
      title: "",
      type: "VIDEO",
      duration: 0,
      sortOrder: module.lessons.length,
      description: "",
      content: "",
      isPreview: false,
      videoUrl: "",
    };

    const ValidatedLesson = lessonSchema.safeParse(newLesson);
    console.log("Saving lesson videoUrl:", ValidatedLesson.data?.videoUrl);
    if (!ValidatedLesson.success) {
      toast.error(ValidatedLesson.error.issues[0]?.message);
      return;
    }

    if (courseId) {
      const result = await addLessonToModule(
        courseId,
        moduleId,
        ValidatedLesson.data
      );

      if (result.success) {
        updateModule(moduleId, {
          lessons: [...module.lessons, { ...newLesson, id: result.lessonId }],
        });
      } else {
        toast.error(result.error);
      }
    } else {
      updateModule(moduleId, { lessons: [...module.lessons, newLesson] });
    }
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<CourseLesson>
  ) => {
    setModules((prevModules) =>
      prevModules.map((m) => {
        if (m.id !== moduleId) return m;

        const updatedLessons = m.lessons.map((l) =>
          l.id === lessonId ? { ...l, ...updates } : l
        );

        const totalDuration = updatedLessons.reduce(
          (sum, l) => sum + (l.duration || 0),
          0
        );

        return { ...m, lessons: updatedLessons, duration: totalDuration };
      })
    );
  };

  // const updateLesson = (
  //   moduleId: string,
  //   lessonId: string,
  //   updates: Partial<CourseLesson>
  // ) => {
  //   const module = modules.find((m) => m.id === moduleId);
  //   if (!module) return;

  //   const updatedLessons = module.lessons.map((l) =>
  //     l.id === lessonId ? { ...l, ...updates } : l
  //   );

  //   const totalDuration = updatedLessons.reduce(
  //     (sum, l) => sum + (l.duration || 0),
  //     0
  //   );

  //   updateModule(moduleId, {
  //     lessons: updatedLessons,
  //     duration: totalDuration,
  //   });
  // };

  // const removeLesson = (moduleId: string, lessonId: string) => {
  //   const module = modules.find((m) => m.id === moduleId);
  //   if (!module) return;
  //   updateModule(moduleId, {
  //     lessons: module.lessons.filter((l) => l.id !== lessonId),
  //   });
  //   toast.success("Lesson removed");
  // };
  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m
      )
    );
    toast.success("Lesson removed");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const newModules = arrayMove(modules, oldIndex, newIndex);
    setModules(newModules.map((m, i) => ({ ...m, sortOrder: i })));
  };

  // 🔢 Compute total duration (across all modules)
  const totalDurationMinutes = useMemo(
    () =>
      modules.reduce(
        (sum, mod) =>
          sum + mod.lessons.reduce((a, l) => a + (l.duration || 0), 0),
        0
      ),
    [modules]
  );

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Card className="glass-card border-white/10 hover-glow">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="grid  items-center gap-3">
            <CardTitle className="text-white text-xl">
              Curriculum Builder
            </CardTitle>
            {totalDurationMinutes > 0 && (
              <span className="flex items-center text-gray-300 text-sm bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Clock className="w-4 h-4 mr-2 text-neon-blue" />
                Total: {formatDuration(totalDurationMinutes)}
              </span>
            )}
          </div>
          <Button
            onClick={() => addModule()}
            type="button"
            className="bg-gradient-to-r from-neon-blue to-neon-purple">
            <Plus className="w-4 h-4 mr-2" /> Add Module
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No modules yet. Click “Add Module” to begin.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}>
                {modules.map((module, moduleIndex) => (
                  <SortableItem key={module.id} id={module.id}>
                    <motion.div
                      layout
                      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex justify-between items-center">
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
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModuleExpand(module.id);
                            }}>
                            {expandedModule === module.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModule(module.id);
                            }}
                            className="text-red-400 hover:bg-red-500/10">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedModule === module.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 mt-4 border-t border-white/10 pt-4">
                            <div>
                              <p className="text-xs text-gray-400 mb-2">
                                Module Description
                              </p>
                              <Textarea
                              value={module.description}
                              onChange={(e) =>
                                updateModule(module.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Enter module description"
                              className="bg-white/10 placeholder:text-gray-50/35 border-white/20 text-white"
                            />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-2">
                                Module Content
                              </p>
                              <Textarea
                              value={module.content}
                              onChange={(e) =>
                                updateModule(module.id, {
                                  content: e.target.value,
                                })
                              }
                              placeholder="Enter module content"
                              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                            />
                            </div>
                            <div className="mt-2 text-sm text-gray-300">
                              Module duration: {module.duration} min
                            </div>
                            {/* LESSONS */}
                            <div className="space-y-3">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <motion.div
                                  key={lesson.id}
                                  layout
                                  className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                                  <div className="flex justify-between items-center">
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
                                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                                      />
                                    </div>
                                    <Button
                                      size="icon"
                                      type="button"
                                      variant="ghost"
                                      onClick={() =>
                                        removeLesson(module.id, lesson.id)
                                      }
                                      className="text-red-400 hover:bg-red-500/10">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  {/* <div className="flex justify-between items-center">
                                    <Textarea
                                      value={lesson.content}
                                      onChange={(e) =>
                                        updateLesson(module.id, lesson.id, {
                                          content: e.target.value,
                                        })
                                      }
                                      placeholder="enter the summary of this lesson"
                                      className="bg-white/10 border-white/20 placeholder:text-gray-50/35 border-0 text-white"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onChange={(e) =>
                                        removeLesson(module.id, lesson.id)
                                      }
                                      className="text-red-400">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div> */}
                                  <Select value={lesson.type} disabled>
                                    <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-50/35">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="VIDEO">
                                        Video
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {lesson.type === "VIDEO" && (
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs text-gray-400 mb-2">
                                          Lesson Description
                                        </p>
                                        <Input
                                          type="text"
                                          value={lesson.description}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              description: e.target.value,
                                            })
                                          }
                                          placeholder="Enter lesson description"
                                          className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                                        />
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 mb-2">
                                          Lesson Content
                                        </p>
                                        <Textarea
                                          value={lesson.content}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              content: e.target.value,
                                            })
                                          }
                                          placeholder="Enter lesson content"
                                          className="my-2 bg-white/10 border-white/20 text-white placeholder:text-gray-50/35"
                                        />
                                      </div>
                                      <LessonUploadFile
                                        uploading={lessonUploading}
                                        setUploading={setLessonUploading}
                                        onUploadSuccess={(url) => {
                                          updateLesson(module.id, lesson.id, {
                                            videoUrl: url,
                                          });

                                          const video =
                                            document.createElement("video");
                                          video.src = url;
                                          video.onloadedmetadata = () => {
                                            const minutes = Math.ceil(
                                              video.duration / 60
                                            );
                                            updateLesson(module.id, lesson.id, {
                                              duration: minutes,
                                            });
                                            toast.success(
                                              `Video uploaded (${minutes} min)`
                                            );
                                          };
                                        }}
                                      />
                                    </div>
                                  )}
                                  {/* <LessonUploadFile
                                    uploading={lessonUploading}
                                    setUploading={setLessonUploading}
                                    onUploadSuccess={(url) => {
                                      updateLesson(module.id, lesson.id, {
                                        videoUrl: url,
                                      });
                                      const video =
                                        document.createElement("video");
                                      video.src = url;
                                      video.onloadedmetadata = () => {
                                        const minutes = Math.ceil(
                                          video.duration / 60
                                        );
                                        updateLesson(module.id, lesson.id, {
                                          duration: minutes,
                                        });
                                        toast.success(
                                          `Video uploaded (${minutes} min)`
                                        );
                                      };
                                    }}
                                  /> */}

                                  <div className="text-sm text-gray-300">
                                    Lesson duration: {lesson.duration} min
                                  </div>
                                </motion.div>
                              ))}

                              <Button
                                type="button"
                                onClick={() => addLesson(module.id)}
                                className="w-full bg-gradient-to-r from-neon-green to-emerald-400">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Lesson
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
