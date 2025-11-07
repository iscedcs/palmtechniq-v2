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
        (_: string, i: number) => i !== index
      )
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
              )
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
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="text-yellow-400 font-semibold mb-2">
              Before Publishing
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Add at least 5 lessons</li>
              <li>• Upload course thumbnail</li>
              <li>• Set a valid course price</li>
              <li>• Review all course details</li>
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
