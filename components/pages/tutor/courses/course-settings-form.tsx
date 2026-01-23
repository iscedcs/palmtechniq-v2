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
          {/* 🟡 Reminder Block */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="text-yellow-400 font-semibold mb-2">
              Before Publishing
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Add at least 3 lessons</li>
              <li>• Upload course thumbnail</li>
              <li>• Set your course price</li>
              <li>• Review all content</li>
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
