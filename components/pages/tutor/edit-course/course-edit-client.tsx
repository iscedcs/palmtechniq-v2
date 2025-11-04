"use client";

import { updateCourse } from "@/actions/course";
import {
  addLessonToModule,
  addModuleToCourse,
  removeLessonFromModule,
  removeModuleFromCourse,
} from "@/actions/tutor-actions";
import { motion } from "framer-motion";

import { CourseBasicForm } from "@/components/component/forms/create-course/course-basic-form";
import { CourseCurriculumForm } from "@/components/component/forms/create-course/course-curriculum-form";
import { CoursePricingForm } from "@/components/component/forms/create-course/course-pricing-form";
import { CourseSettingsForm } from "@/components/component/forms/create-course/course-settings-form";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showUndoToast } from "@/lib/utils/tosst-util";
import { courseSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Settings } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const categories: { id: string; name: string }[] = [
  { id: "cmfar9u390000fd1gw9f75qga", name: "Web Development" },
  { id: "cmfar9vrm0001fd1g8almpj1f", name: "Mobile Development" },
  { id: "cmfar9wrc0002fd1g9qkfx3yv", name: "Data Science" },
  { id: "cmfar9xvb0003fd1gqntzi3j4", name: "Machine Learning" },
  { id: "cmfar9ywt0004fd1gq6anbxmn", name: "UI/UX Design" },
  { id: "cmfara03d0005fd1grcbxxvx0", name: "Digital Marketing" },
  { id: "cmfara12w0006fd1g7pkbaabu", name: "Business" },
  { id: "cmfara26u0007fd1gonrbj5cj", name: "Entrepreneurship" },
  { id: "cmfara3ax0008fd1gfuzw13oj", name: "Finance & Accounting" },
  { id: "cmfara4i00009fd1gcfkhieyd", name: "Leadership & Management" },
  { id: "cmfara5w4000afd1ghx1xj8f7", name: "Personal Development" },
  { id: "cmfara6vs000bfd1g29m6ndc4", name: "Productivity" },
  { id: "cmfara7vb000cfd1gn8epux3l", name: "Photography" },
  { id: "cmfara97i000dfd1ghtt2p3br", name: "Graphic Design" },
  { id: "cmfaraaa8000efd1grxz6489o", name: "Music" },
  { id: "cmfarabj9000ffd1g1j5yv87v", name: "Film & Video" },
  { id: "cmfaracyg000gfd1gyu3ku19l", name: "Language Learning" },
  { id: "cmfarae61000hfd1g973qlulm", name: "Health & Fitness" },
  { id: "cmfaraf9y000ifd1gh02ore3m", name: "Nutrition & Diet" },
  { id: "cmfaragey000jfd1gw6x2p4yk", name: "Lifestyle" },
  { id: "cmfarahfn000kfd1gyufgu656", name: "Cooking" },
  { id: "cmfaraivn000lfd1gz2rf2qev", name: "Art & Creativity" },
  { id: "cmfarak3a000mfd1gnu0vijrw", name: "Cybersecurity" },
  { id: "cmfaral7c000nfd1g82q30roi", name: "Cloud Computing" },
  { id: "cmfaramb4000ofd1ge1cqfbbc", name: "DevOps" },
];

const levels = ["Beginner", "Intermediate", "Advanced"];

export function CourseEditClient({
  course,
  categories,
}: {
  course: any;
  categories: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState({
    thumbnail: false,
    video: false,
  });

  const [lessonUploading, setLessonUploading] = useState(false);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      ...course,
      isPublished: course.isPublished ?? false,
      category: course.category?.id || "",
      certificateEnabled: course.certificate,
      tags: course.tags || [],
      targetAudience: course.targetAudience || [],
      metaTitle: course.metaTitle || "",
      metaDescription: course.metaDescription || "",
      requirements: course.requirements || [],
      outcomes: course.outcomes || [],
    },
  });

  const [modules, setModules] = useState(course.modules || []);

  // 📌 Tags
  const [currentTag, setCurrentTag] = useState("");

  const addTag = () => {
    if (
      currentTag.trim() &&
      !form.getValues("tags").includes(currentTag.trim())
    ) {
      form.setValue("tags", [...form.getValues("tags"), currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove)
    );
  };

  // 📌 Requirements
  const [currentRequirement, setCurrentRequirement] = useState("");

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      form.setValue("requirements", [
        ...form.getValues("requirements"),
        currentRequirement.trim(),
      ]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    form.setValue(
      "requirements",
      form.getValues("requirements").filter((_, i) => i !== index)
    );
  };

  // 🎯 Outcomes
  const [currentOutcome, setCurrentOutcome] = useState("");

  const addLearningOutcome = () => {
    if (currentOutcome.trim()) {
      form.setValue("outcomes", [
        ...form.getValues("outcomes"),
        currentOutcome.trim(),
      ]);
      setCurrentOutcome("");
    }
  };

  const removeLearningOutcome = (index: number) => {
    form.setValue(
      "outcomes",
      form.getValues("outcomes").filter((_, i) => i !== index)
    );
  };

  const addModule = async () => {
    try {
      const sortOrder = (modules.at(-1)?.sortOrder ?? 0) + 1;
      const res = await addModuleToCourse(course.id, {
        title: `Module ${modules.length + 1}`,

        duration: 1,
        sortOrder,
        isPublished: false,
      });

      if (!res?.success) {
        toast.error(res?.error ?? "Failed to add module");
        return;
      }

      setModules((prev: any) => [
        ...prev,
        {
          id: res.moduleId,
          title: `Module ${prev.length + 1}`,
          description: "",
          content: "",
          duration: 1,
          sortOrder,
          isPublished: false,
          lessons: [],
        },
      ]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add module");
    }
  };

  const removeModule = async (e: React.MouseEvent, moduleId: string) => {
    e.preventDefault();

    const modIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (modIndex < 0) return;

    const removedModule = modules[modIndex];
    const prevModules = structuredClone(modules);

    // ✅ Optimistic UI: remove immediately
    setModules((cur: any) => cur.filter((m: any) => m.id !== moduleId));

    try {
      const res = await removeModuleFromCourse(course.id, moduleId);
      if (!res?.success)
        throw new Error(res?.error ?? "Failed to remove module");
    } catch (err) {
      // Rollback UI on error
      setModules(prevModules);
      toast.error("Failed to remove module");
      return;
    }

    showUndoToast({
      message: `Module “${removedModule.title}” removed successfully`,
      undoLabel: "Restore module",
      onUndo: async () => {
        // 1) Recreate module
        const created = await addModuleToCourse(course.id, {
          title: removedModule.title,
          description: removedModule.description ?? "",
          content: removedModule.content ?? "",
          duration: removedModule.duration ?? 0,
          sortOrder: removedModule.sortOrder ?? modIndex,
          isPublished: removedModule.isPublished ?? false,
        });
        if (!created?.success)
          throw new Error(created?.error ?? "Failed to restore module");

        const newModuleId = created.moduleId;

        // 2) Recreate lessons (keep order)
        const restoredLessons: any[] = [];
        for (const l of removedModule.lessons ?? []) {
          const r = await addLessonToModule(course.id, newModuleId, {
            title: l.title,
            lessonType: l.lessonType ?? "VIDEO",
            duration: l.duration ?? 0,
            content: l.content ?? "",
            description: l.description ?? "",
            videoUrl: l.videoUrl ?? "",
            sortOrder: l.sortOrder ?? 0,
            isPreview: l.isPreview ?? false,
          });
          if (!r?.success)
            throw new Error(r?.error ?? "Failed to restore lesson");
          restoredLessons.push({ ...l, id: r.lessonId });
        }

        // 3) Put back in UI at original index with new ids
        setModules((cur: any) => {
          const next = structuredClone(cur);
          next.splice(modIndex, 0, {
            ...removedModule,
            id: newModuleId,
            lessons: restoredLessons,
          });
          return next;
        });
      },
    });
  };

  const updateModule = (
    moduleId: string,
    updates: Partial<(typeof modules)[0]>
  ) => {
    setModules(
      modules.map((m: any) => (m.id === moduleId ? { ...m, ...updates } : m))
    );
  };
  const addLesson = async (moduleId: string) => {
    try {
      const mod = modules.find((m: any) => m.id === moduleId);
      if (!mod) return;

      const sortOrder = (mod.lessons.at(-1)?.sortOrder ?? 0) + 1;
      const payload = {
        title: `Lesson ${mod.lessons.length + 1}`,
        lessonType: "VIDEO" as const, // ✅ correct key
        duration: 1,

        sortOrder,
        isPreview: false,
      };
      console.log({ payload });
      const res = await addLessonToModule(course.id, moduleId, payload);
      if (!res?.success) {
        toast.error(res?.error ?? "Failed to add lesson");
        return;
      }

      setModules((prev: any) =>
        prev.map((m: any) =>
          m.id !== moduleId
            ? m
            : {
                ...m,
                lessons: [
                  ...m.lessons,
                  {
                    id: res.lessonId,
                    ...payload,
                    content: "",
                    description: "",
                    videoUrl: "",
                  }, // ✅ server id
                ],
              }
        )
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to add lesson");
    }
  };

  const removeLesson = async (
    e: React.MouseEvent,
    moduleId: string,
    lessonId: string
  ) => {
    e.preventDefault();

    const modIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (modIndex < 0) return;

    const lessonIndex = modules[modIndex].lessons.findIndex(
      (l: any) => l.id === lessonId
    );
    if (lessonIndex < 0) return;

    const removedLesson = modules[modIndex].lessons[lessonIndex];
    const prevModules = structuredClone(modules);

    // ✅ Optimistic UI: remove immediately
    setModules((cur: any) => {
      const next = structuredClone(cur);
      next[modIndex].lessons.splice(lessonIndex, 1);
      return next;
    });

    try {
      const res = await removeLessonFromModule(course.id, moduleId, lessonId);
      if (!res?.success)
        throw new Error(res?.error ?? "Failed to remove lesson");
    } catch (err) {
      // Rollback UI on error
      setModules(prevModules);
      toast.error("Failed to remove lesson");
      return;
    }

    showUndoToast({
      message: `Lesson ${removedLesson.title} removed sucessfully`,
      undoLabel: "Restore lesson",
      onUndo: async () => {
        // Re-create in DB
        const r = await addLessonToModule(course.id, moduleId, {
          title: removedLesson.title,
          lessonType: removedLesson.lessonType ?? "VIDEO",
          duration: removedLesson.duration ?? 0,
          content: removedLesson.content ?? "",
          description: removedLesson.description ?? "",
          videoUrl: removedLesson.videoUrl ?? "",
          sortOrder: removedLesson.sortOrder ?? lessonIndex,
          isPreview: removedLesson.isPreview ?? false,
        });
        if (!r?.success) throw new Error(r?.error ?? "Failed to restore");

        // Put back in UI at the same position, with new id
        setModules((cur: any) => {
          const next = structuredClone(cur);
          next[modIndex].lessons.splice(lessonIndex, 0, {
            ...removedLesson,
            id: r.lessonId,
          });
          return next;
        });
      },
    });
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<any>
  ) => {
    setModules(
      modules.map((m: any) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l: any) =>
                l.id === lessonId ? { ...l, ...updates } : l
              ),
            }
          : m
      )
    );
  };
  const onSubmit = (
    values: z.infer<typeof courseSchema>,
    isPublished: boolean
  ) => {
    startTransition(async () => {
      try {
        const res = await updateCourse(course.id, values, modules, isPublished);

        if (res.error) {
          toast.error(res.error);
          console.error("❌ Update failed:", res.error);
        } else {
          toast.success(
            isPublished ? "Course published!" : "Course saved as draft"
          );
          console.log("✅ Course updated:", res);
        }
      } catch (error) {
        console.error("❌ Error calling updateCourse:", error);
        toast.error("Something went wrong while updating");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-8 sm:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => onSubmit(data, false))}
                  className="space-y-8">
                  <Tabs defaultValue="details" className="w-full scroll-smooth">
                    {/* Tab Navigation */}
                    <TabsList className="flex sm:grid sm:grid-cols-4 gap-2 overflow-x-auto no-scrollbar mb-6 sm:mb-8 bg-transparent text-white">
                      {[
                        { value: "details", label: "Details", icon: FileText },
                        { value: "content", label: "Content", icon: BookOpen },
                        { value: "pricing", label: "Pricing", icon: NairaSign },
                        {
                          value: "settings",
                          label: "Settings",
                          icon: Settings,
                        },
                      ].map(({ value, label, icon: Icon }) => (
                        <TabsTrigger
                          key={value}
                          value={value}
                          className="flex items-center flex-shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_#22c55e80] transition-all data-[state=active]:scale-[1.02] data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green data-[state=active]:to-emerald-400">
                          <Icon className="w-4 h-4 mr-2 sm:mr-2" />
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details">
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        <CourseBasicForm
                          form={form}
                          categories={categories}
                          levels={levels}
                          uploading={uploading}
                          setUploading={setUploading}
                          currentTag={currentTag}
                          setCurrentTag={setCurrentTag}
                          addTag={addTag}
                          removeTag={removeTag}
                          currentRequirement={currentRequirement}
                          setCurrentRequirement={setCurrentRequirement}
                          addRequirement={addRequirement}
                          removeRequirement={removeRequirement}
                          currentOutcome={currentOutcome}
                          setCurrentOutcome={setCurrentOutcome}
                          addLearningOutcome={addLearningOutcome}
                          removeLearningOutcome={removeLearningOutcome}
                        />
                      </motion.div>
                    </TabsContent>

                    {/* Curriculum Tab */}
                    <TabsContent value="content">
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        <CourseCurriculumForm
                          modules={modules}
                          addModule={addModule}
                          removeModule={removeModule}
                          updateModule={updateModule}
                          addLesson={addLesson}
                          removeLesson={removeLesson}
                          updateLesson={updateLesson}
                          lessonUploading={lessonUploading}
                          setLessonUploading={setLessonUploading}
                        />
                      </motion.div>
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing">
                      <motion.div
                        key="pricing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        <CoursePricingForm form={form} />
                      </motion.div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}>
                        <CourseSettingsForm
                          form={form}
                          modules={modules}
                          onSubmit={onSubmit}
                        />
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                  <div className="sticky bottom-0 left-0 w-full bg-neon/40 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4">
                    <Button
                      type="submit"
                      onClick={() =>
                        form.handleSubmit((data) => onSubmit(data, false))()
                      }
                      className="w-full sm:w-auto bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600">
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit((data) =>
                        onSubmit(data, true)
                      )}
                      className="w-full sm:w-auto bg-gradient-to-r from-neon-green to-emerald-400">
                      Publish Course
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
