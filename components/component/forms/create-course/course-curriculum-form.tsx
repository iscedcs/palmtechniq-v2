"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LessonUploadFile from "@/components/shared/lesson-uploader";
import { Dispatch, SetStateAction } from "react";
import { addLessonToModule } from "@/actions/tutor-actions";

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
  return (
    <Card className="glass-card border-white/10">
      <div className="flex justify-between mx-3 my-4 items-center">
        <h3 className="text-xl font-semibold text-white">Course Curriculum</h3>
        <Button
          type="button"
          onClick={addModule}
          className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      <CardContent>
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="text-lg font-semibold text-white">
                {module.title || "Untitled Module"}
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                  {/* Module fields */}
                  <Input
                    value={module.title}
                    onChange={(e) =>
                      updateModule(module.id, { title: e.target.value })
                    }
                    className="bg-transparent border-white/20 text-white"
                    placeholder="Module title"
                  />
                  <Textarea
                    value={module.description || ""}
                    onChange={(e) =>
                      updateModule(module.id, { description: e.target.value })
                    }
                    placeholder="Module description"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Textarea
                    value={module.content || ""}
                    onChange={(e) =>
                      updateModule(module.id, { content: e.target.value })
                    }
                    placeholder="Module content"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Input
                    type="number"
                    value={module.duration}
                    onChange={(e) =>
                      updateModule(module.id, {
                        duration: Number(e.target.value),
                      })
                    }
                    placeholder="Module duration (minutes)"
                    className="bg-white/10 border-white/20 text-white"
                  />

                  {/* Remove Module */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => removeModule(e, module.id)}>
                    <X className="w-4 h-4 mr-1" /> Remove Module
                  </Button>

                  {/* Add Lesson */}
                  <Button
                    type="button"
                    onClick={() => addLesson(module.id)}
                    className="w-full mt-4 bg-gradient-to-r from-neon-green to-green-400">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>

                  {/* Lessons Accordion */}
                  <Accordion type="multiple" className="mt-4 space-y-3">
                    {module.lessons.map((lesson) => (
                      <AccordionItem key={lesson.id} value={lesson.id}>
                        <AccordionTrigger className="text-md font-medium text-white">
                          {lesson.title || "Untitled Lesson"}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 bg-white/10 rounded-md space-y-2">
                            <Input
                              value={lesson.title}
                              onChange={(e) =>
                                updateLesson(module.id, lesson.id, {
                                  title: e.target.value,
                                })
                              }
                              className="bg-white/10 border-white/20 text-white"
                              placeholder="Lesson title"
                            />

                            <Textarea
                              value={lesson.content || ""}
                              onChange={(e) =>
                                updateLesson(module.id, lesson.id, {
                                  content: e.target.value,
                                })
                              }
                              placeholder="Lesson content"
                              className="bg-white/10 border-white/20 text-white"
                            />

                            <Textarea
                              value={lesson.description || ""}
                              onChange={(e) =>
                                updateLesson(module.id, lesson.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Lesson description"
                              className="bg-white/10 border-white/20 text-white"
                            />

                            <Select
                              value={lesson.lessonType}
                              onValueChange={(value) =>
                                updateLesson(module.id, lesson.id, {
                                  lessonType: value as any,
                                })
                              }>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Lesson Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIDEO">Video</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input
                              type="number"
                              placeholder="Duration (minutes)"
                              value={lesson.duration}
                              onChange={(e) =>
                                updateLesson(module.id, lesson.id, {
                                  duration: Number(e.target.value),
                                })
                              }
                              className="bg-white/10 border-white/20 text-white"
                            />

                            {lesson.lessonType === "VIDEO" && (
                              <div className="mt-2">
                                {lesson.videoUrl ? (
                                  <video
                                    src={lesson.videoUrl}
                                    controls
                                    className="w-full max-h-60 rounded-md border border-white/20"
                                  />
                                ) : (
                                  <p className="text-sm text-white/50 italic">
                                    No video uploaded yet
                                  </p>
                                )}

                                <LessonUploadFile
                                  uploading={lessonUploading}
                                  setUploading={setLessonUploading}
                                  onUploadSuccess={(url) =>
                                    updateLesson(module.id, lesson.id, {
                                      videoUrl: url,
                                    })
                                  }
                                />
                              </div>
                            )}

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) =>
                                removeLesson(e, module.id, lesson.id)
                              }
                              className="mt-2">
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
  );
}
