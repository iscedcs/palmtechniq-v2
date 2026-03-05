"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Plus,
  Save,
  X,
  Settings,
  Target,
  Globe,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import React from "react";

interface CourseSettingsFormProps {
  form: any;
  modules: any[];
  onSubmit: (values: any, isPublished: boolean) => void;
}

export function CourseSettingsForm({
  form,
  modules,
  onSubmit,
}: CourseSettingsFormProps) {
  const [currentAudience, setCurrentAudience] = React.useState("");

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
      complete:
        modules.length > 0 && modules.every((mod) => mod.lessons?.length >= 3),
    },
    {
      label: "All lessons have titles",
      complete:
        modules.length > 0 &&
        modules.every(
          (mod: any) =>
            mod.lessons?.length > 0 &&
            mod.lessons.every((lesson: any) => lesson.title?.trim()),
        ),
    },
    {
      label: "Course thumbnail uploaded",
      complete: Boolean(watchedValues.thumbnail),
    },
    {
      label: "Course price set",
      complete:
        typeof watchedValues.basePrice === "number" &&
        watchedValues.basePrice >= 0,
    },
  ];

  const completedCount = publishingChecklist.filter(
    (item) => item.complete,
  ).length;
  const totalCount = publishingChecklist.length;
  const allComplete = completedCount === totalCount;

  const addAudience = () => {
    if (currentAudience.trim()) {
      form.setValue("targetAudience", [
        ...(form.getValues("targetAudience") || []),
        currentAudience.trim(),
      ]);
      setCurrentAudience("");
    }
  };

  const removeAudience = (index: number) => {
    form.setValue(
      "targetAudience",
      (form.getValues("targetAudience") || []).filter(
        (_: string, i: number) => i !== index,
      ),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8">
      {/* General Settings */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Settings className="w-5 h-5 text-neon-blue" />
            Course Settings
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Discussions */}
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
                    Enable student interactions and questions
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

          {/* Certificate */}
          <FormField
            control={form.control}
            name="certificate"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="flex items-center gap-2 text-white">
                    <ShieldCheck className="w-4 h-4 text-neon-green" /> Provide
                    Certificate
                  </FormLabel>
                  <p className="text-sm text-gray-400">
                    Automatically issue a certificate upon completion
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

      {/* SEO & Metadata */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-yellow-400 text-xl" /> SEO & Metadata
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Meta Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Learn Python Fast - Beginner to Pro"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Meta Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write a short SEO-friendly description..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-neon-purple text-xl" /> Target
            Audience
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={currentAudience}
              onChange={(e) => setCurrentAudience(e.target.value)}
              placeholder="Add audience (e.g. Beginners, Data Analysts)"
              className="bg-white/10 border-white/20 text-white"
            />
            <Button
              type="button"
              onClick={addAudience}
              className="bg-gradient-to-r from-neon-blue to-neon-purple">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(form.getValues("targetAudience") || []).map(
              (aud: string, index: number) => (
                <Badge key={index} className="bg-white/10 text-white">
                  {aud}
                  <X
                    className="w-3 h-3 ml-2 cursor-pointer hover:text-red-400 transition"
                    onClick={() => removeAudience(index)}
                  />
                </Badge>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5 text-neon-green" /> Publishing Options
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dynamic Publishing Checklist */}
          <div
            className={`p-4 border rounded-lg ${allComplete ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <h4
                className={`font-semibold ${allComplete ? "text-green-400" : "text-yellow-400"}`}>
                {allComplete ? "Ready to Publish!" : "Before Publishing"}
              </h4>
              <span
                className={`text-sm ${allComplete ? "text-green-400" : "text-gray-400"}`}>
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <ul className="text-sm space-y-2">
              {publishingChecklist.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 ${item.complete ? "text-green-400" : "text-red-400"}`}>
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

          {/* <div className="space-y-4">
            <Button
              type="submit"
              onClick={() =>
                form.handleSubmit((data: any) => onSubmit(data, false))()
              }
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600">
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>

            <Button
              type="button"
              onClick={form.handleSubmit(
                (data: any) => onSubmit(data, true),
                (errors: any) => console.error("❌ Validation errors:", errors)
              )}
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
