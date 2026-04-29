"use client";

import { publishCourse, updateCourse } from "@/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courseSchema } from "@/schemas";
import { ArrowLeft, Eye, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface CourseHeaderProps {
  course: {
    id: string;
    title: string;
    status: "draft" | "published" | "archived";
    updatedAt: string;
  };
  form: UseFormReturn<z.infer<typeof courseSchema>>;
  modules: any[];
}

export function CourseHeader({ course, form, modules }: CourseHeaderProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [_, startTransition] = useTransition();

  const saveChanges = async (
    values: z.infer<typeof courseSchema>,
    isPublished: boolean,
    modules: any[]
  ) => {
    setIsSaving(true);
    try {
      const res = await updateCourse(course.id, values, modules, isPublished);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        if (isPublished && res.requiresApproval) {
          toast.success("Course submitted for approval");
        } else {
          toast.success("Course updated successfully!");
        }
        startTransition(() => router.refresh());
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await publishCourse(course.id);
      if ("error" in res) {
        toast.error(res.error);
      } else if (res.requiresApproval) {
        toast.success("Course submitted for approval");
        startTransition(() => router.refresh());
      } else {
        toast.success("Course published successfully!");
        startTransition(() => router.refresh());
      }
    } catch {
      toast.error("Failed to publish course");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="py-8 border-b border-white/10">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge
                className={
                  course.status === "published"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : course.status === "draft"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }>
                {course.status}
              </Badge>
              <span className="text-gray-400 text-sm">
                Last updated: {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => saveChanges(form.getValues(), false, modules)}
            disabled={isSaving}
            className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          {course.status === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
              <Upload className="w-4 h-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
