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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Film, ImageIcon, BookOpen } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import UploadFile from "@/components/shared/uploader";
import Image from "next/image";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

type Category = {
  id: string;
  name: string;
};

type Props = {
  form: UseFormReturn<any>;
  categories: Category[];
  levels: string[];
  uploading: { thumbnail: boolean; video: boolean };
  setUploading: React.Dispatch<
    React.SetStateAction<{ thumbnail: boolean; video: boolean }>
  >;
  currentTag: string;
  setCurrentTag: (val: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  currentRequirement: string;
  setCurrentRequirement: (val: string) => void;
  addRequirement: () => void;
  removeRequirement: (index: number) => void;
  currentOutcome: string;
  setCurrentOutcome: (val: string) => void;
  addLearningOutcome: () => void;
  removeLearningOutcome: (index: number) => void;
};

export function CourseBasicForm({
  form,
  categories,
  levels,
  uploading,
  setUploading,
  currentTag,
  setCurrentTag,
  addTag,
  removeTag,
  currentRequirement,
  setCurrentRequirement,
  addRequirement,
  removeRequirement,
  currentOutcome,
  setCurrentOutcome,
  addLearningOutcome,
  removeLearningOutcome,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
      {/* ===== LEFT SIDE: Course Basic Form ===== */}
      <div className="space-y-8">
        {/* Basic Info */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-xl md:text-2xl gap-2">
              <BookOpen className="w-5 h-5 text-neon-blue" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Course Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Python for Data Science"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subtitle */}
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Subtitle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="A practical guide to mastering data analysis"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white ">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your course content, audience, and goals..."
                      className="bg-white/10 border-white/20 text-sm sm:text-xl text-white min-h-[120px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category + Level + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem
                            key={level}
                            value={level.toUpperCase().replace(" ", "_")}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

            </div>

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choose language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        "English",
                        "Spanish",
                        "French",
                        "German",
                        "Portuguese",
                      ].map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Media Section */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-neon-green text-xl" /> Media Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thumbnail */}
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-neon-blue" /> Course
                    Thumbnail
                  </FormLabel>
                  <FormControl>
                    <UploadFile
                      setValue={form.setValue}
                      fieldName="thumbnail"
                      uploading={uploading.thumbnail}
                      setUploading={(value: any) =>
                        setUploading((prev) => ({ ...prev, thumbnail: value }))
                      }
                    />
                  </FormControl>
                  {field.value && (
                    <div className="mt-3 relative">
                      <Image
                        width={200}
                        height={120}
                        src={field.value}
                        alt="Thumbnail"
                        className="rounded-md border border-white/20 shadow-md"
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Preview Video */}
            <FormField
              control={form.control}
              name="previewVideo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-neon-green" /> Preview Video
                  </FormLabel>
                  <FormControl>
                    <UploadFile
                      setValue={form.setValue}
                      fieldName="previewVideo"
                      uploading={uploading.video}
                      setUploading={(value: any) =>
                        setUploading((prev) => ({ ...prev, video: value }))
                      }
                    />
                  </FormControl>
                  {field.value &&
                    (isYoutubeUrl(field.value) ? (
                      <iframe
                        src={`${toYoutubeEmbedUrl(field.value)}?autoplay=0`}
                        title="Preview video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="mt-3 w-full max-h-48 rounded-md border border-white/20"
                      />
                    ) : (
                      <video
                        src={field.value}
                        controls
                        className="mt-3 w-full max-h-48 rounded-md border border-white/20"
                      />
                    ))}
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tags / Requirements / Outcomes */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tags */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a tag"
                  className="bg-white/10 border-white/20 text-white"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-gradient-to-r from-neon-blue to-neon-purple">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(form.getValues("tags") as string[])).map(
                  (tag: string) => (
                    <Badge
                      key={tag}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition">
                      {tag}
                      <X
                        className="w-3 h-3 ml-2 cursor-pointer hover:text-red-400 transition"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                />
                <Button
                  type="button"
                  onClick={addRequirement}
                  className="bg-gradient-to-r from-neon-blue to-neon-purple">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="list-disc pl-5 text-gray-300 text-sm  space-y-2">
                {form
                  .getValues("requirements")
                  ?.map((req: string, index: number) => (
                    <li
                      key={index}
                      className="flex justify-between text-sm  items-center">
                      {req}
                      <X
                        className="w-4 h-4 text-red-400  cursor-pointer"
                        onClick={() => removeRequirement(index)}
                      />
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Learning Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentOutcome}
                  onChange={(e) => setCurrentOutcome(e.target.value)}
                  placeholder="Add a learning outcome"
                  className="bg-white/10 border-white/20 text-sm sm:text-xl text-white"
                />
                <Button
                  type="button"
                  onClick={addLearningOutcome}
                  className="bg-gradient-to-r from-neon-green to-green-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                {form
                  .getValues("learningOutcomes")
                  ?.map((outcome: string, index: number) => (
                    <li
                      key={index}
                      className="flex justify-between text-sm  items-center">
                      {outcome}
                      <X
                        className="w-4 h-4 text-red-400 cursor-pointer"
                        onClick={() => removeLearningOutcome(index)}
                      />
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== RIGHT SIDE: Live Summary Sidebar with Completion Meter ===== */}
      <div className="hidden xl:block">
        <div className="sticky top-20">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md p-5 space-y-5 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3">
              Course Overview
            </h3>

            {/* ✅ Progress Meter */}
            {(() => {
              const requiredFields = [
                form.watch("title"),
                form.watch("description"),
                form.watch("category"),
                form.watch("level"),
                form.watch("language"),
                form.watch("thumbnail"),
                form.watch("previewVideo"),
              ];

              const filledCount = requiredFields.filter(Boolean).length;
              const completion = Math.round(
                (filledCount / requiredFields.length) * 100
              );

              return (
                <div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Completion</span>
                    <span className="text-white font-medium">
                      {completion}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        completion < 40
                          ? "bg-red-400"
                          : completion < 70
                          ? "bg-yellow-400"
                          : "bg-neon-green"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Your course setup is{" "}
                    <span className="text-white">{completion}%</span> complete.
                    Complete all fields to publish confidently.
                  </p>
                </div>
              );
            })()}

            {/* Summary Info */}
            <div className="border-t border-white/10 pt-4 space-y-2 text-sm text-gray-300">
              <p>
                <span className="font-medium text-white">Title:</span>{" "}
                {form.watch("title") || "—"}
              </p>
              <p>
                <span className="font-medium text-white">Category:</span>{" "}
                {categories.find((c) => c.id === form.watch("category"))
                  ?.name || "—"}
              </p>
              <p>
                <span className="font-medium text-white">Level:</span>{" "}
                {form.watch("level") || "—"}
              </p>
              <p>
                <span className="font-medium text-white">Language:</span>{" "}
                {form.watch("language") || "—"}
              </p>
            </div>

            {/* Thumbnail Preview */}
            {form.watch("thumbnail") && (
              <div className="pt-3 border-t border-white/10">
                <Image
                  src={form.watch("thumbnail")}
                  alt="Course thumbnail preview"
                  width={250}
                  height={150}
                  className="rounded-md border border-white/20"
                />
              </div>
            )}

            <p className="text-xs text-gray-400 pt-3 border-t border-white/10">
              This live summary updates as you edit your course. Use it to track
              completeness before moving to curriculum setup.
            </p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
