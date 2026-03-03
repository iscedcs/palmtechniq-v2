"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle, XCircle } from "lucide-react";

interface CourseSettingsFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any, isPublished: boolean) => void;
  modules: any[];
}

export default function CourseSettingsForm({
  form,
  onSubmit,
  modules,
}: CourseSettingsFormProps) {
  // Watch form values for reactive checklist
  const watchedValues = form.watch();
  
  const publishingChecklist = [
    {
      label: "Course title",
      complete: Boolean(watchedValues.title?.trim()),
    },
    {
      label: "Course description",
      complete: Boolean(watchedValues.description?.trim()),
    },
    {
      label: "Category selected",
      complete: Boolean(watchedValues.category?.trim()),
    },
    {
      label: "At least 1 module",
      complete: modules.length > 0,
    },
    {
      label: "At least 3 lessons per module",
      complete: modules.length > 0 && modules.every((mod) => mod.lessons?.length >= 3),
    },
    {
      label: "All lessons have titles",
      complete: modules.length > 0 && modules.every((mod: any) => 
        mod.lessons?.length > 0 && mod.lessons.every((lesson: any) => lesson.title?.trim())
      ),
    },
    {
      label: "Course thumbnail uploaded",
      complete: Boolean(watchedValues.thumbnail),
    },
    {
      label: "Course price set",
      complete: typeof watchedValues.price === "number" && watchedValues.price >= 0,
    },
  ];

  const completedCount = publishingChecklist.filter((item) => item.complete).length;
  const totalCount = publishingChecklist.length;
  const allComplete = completedCount === totalCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {/* ⚙️ Course Settings */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Course Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 💬 Allow Discussions */}
          <FormField
            control={form.control}
            name="allowDiscussions"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-white">
                    Allow Discussions
                  </FormLabel>
                  <p className="text-sm text-gray-400">
                    Enable student Q&A or topic discussions within the course.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 🏅 Certificates */}
          <FormField
            control={form.control}
            name="certificate"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-white">
                    Provide Certificate
                  </FormLabel>
                  <p className="text-sm text-gray-400">
                    Issue a completion certificate to students after finishing
                    the course.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* 🚀 Publishing Options */}
      <Card className="glass-card border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Publishing Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dynamic Publishing Checklist */}
          <div className={`p-4 border rounded-lg ${allComplete ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold ${allComplete ? "text-green-400" : "text-yellow-400"}`}>
                {allComplete ? "Ready to Publish!" : "Before Publishing"}
              </h4>
              <span className={`text-sm ${allComplete ? "text-green-400" : "text-gray-400"}`}>
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <ul className="text-sm space-y-2">
              {publishingChecklist.map((item, index) => (
                <li key={index} className={`flex items-center gap-2 ${item.complete ? "text-green-400" : "text-red-400"}`}>
                  {item.complete ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* 🧭 Action Buttons */}
          {/* <div className="space-y-4">
            <Button
              type="submit"
              onClick={() =>
                form.handleSubmit((data) => onSubmit(data, false))()
              }
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600">
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>

            <Button
              type="button"
              onClick={() =>
                form.handleSubmit(
                  (data) => {
                    console.log("✅ Validated data:", data);
                    onSubmit(data, true);
                  },
                  (errors) => {
                    console.error("❌ Validation errors:", errors);
                    toast.error("Validation failed, check console for details");
                  }
                )()
              }
              className="w-full bg-gradient-to-r from-neon-green to-emerald-400"
              disabled={
                !form.getValues("title") ||
                !form.getValues("description") ||
                modules.length === 0 ||
                modules.some((mod) => mod.lessons.length < 3) ||
                !form.getValues("thumbnail")
              }>
              <Eye className="w-4 h-4 mr-2" />
              Publish Course
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </motion.div>
  );
}
