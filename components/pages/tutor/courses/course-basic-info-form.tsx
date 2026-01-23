"use client";

import { motion, AnimatePresence } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UploadFile from "@/components/shared/uploader";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { z } from "zod";

interface CourseBasicInfoFormProps {
  categories: string[];
  levels: string[];
}

export default function CourseBasicInfoForm({
  categories,
  levels,
}: CourseBasicInfoFormProps) {
  const form = useFormContext<z.infer<any>>();
  const [uploading, setUploading] = useState({
    thumbnail: false,
    video: false,
  });
  const [currentTag, setCurrentTag] = useState("");
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentOutcome, setCurrentOutcome] = useState("");

  const [openSections, setOpenSections] = useState({
    tags: true,
    requirements: false,
    outcomes: false,
  });

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

  // --- Dynamic list handlers
  const addItem = (
    field: "tags" | "requirements" | "outcomes",
    value: string
  ) => {
    if (!value.trim()) return;
    const current = form.getValues(field);
    if (!current.includes(value.trim())) {
      form.setValue(field, [...current, value.trim()]);
      if (field === "tags") setCurrentTag("");
      if (field === "requirements") setCurrentRequirement("");
      if (field === "outcomes") setCurrentOutcome("");
    }
  };

  const removeItem = (
    field: "tags" | "requirements" | "outcomes",
    value: string
  ) => {
    form.setValue(
      field,
      form.getValues(field).filter((v: any) => v !== value)
    );
  };

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Card className="glass-card border-white/10 hover-glow">
        <CardHeader>
          <CardTitle className="text-white text-xl">
            Basic Information
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
                    placeholder="e.g. Mastering React.js"
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
                    placeholder="A concise subtitle about your course"
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
                <FormLabel className="text-white">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What will students learn in this course?"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
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
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Language</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Level */}
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

          {/* Thumbnail */}
          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Thumbnail</FormLabel>
                <FormControl>
                  <UploadFile
                    setValue={form.setValue}
                    fieldName="thumbnail"
                    uploading={uploading.thumbnail}
                    setUploading={(val) =>
                      setUploading((prev) => ({
                        ...prev,
                        thumbnail: val as boolean,
                      }))
                    }
                  />
                </FormControl>
                {field.value && (
                  <img
                    src={field.value}
                    alt="Thumbnail"
                    className="mt-3 rounded-md h-28"
                  />
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
                <FormLabel className="text-white">Preview Video</FormLabel>
                <FormControl>
                  <UploadFile
                    setValue={form.setValue}
                    fieldName="previewVideo"
                    uploading={uploading.video}
                    setUploading={(val) =>
                      setUploading((prev) => ({
                        ...prev,
                        video: val as boolean,
                      }))
                    }
                  />
                </FormControl>
                {field.value && (
                  <video
                    src={field.value}
                    controls
                    className="mt-3 rounded-md h-28"
                  />
                )}
              </FormItem>
            )}
          />

          {/* Collapsible Sections */}
          {[
            {
              key: "tags",
              title: "Tags",
              placeholder: "Add tag (e.g. react, frontend, hooks)",
              gradient: "from-neon-blue to-neon-purple",
              value: currentTag,
              setValue: setCurrentTag,
            },
            {
              key: "requirements",
              title: "Requirements",
              placeholder: "e.g. Basic HTML/CSS knowledge",
              gradient: "from-neon-green to-emerald-400",
              value: currentRequirement,
              setValue: setCurrentRequirement,
            },
            {
              key: "outcomes",
              title: "Learning Outcomes",
              placeholder: "e.g. Build real-world React applications",
              gradient: "from-neon-orange to-yellow-400",
              value: currentOutcome,
              setValue: setCurrentOutcome,
            },
          ].map((section) => (
            <Collapsible
              key={section.key}
              open={openSections[section.key as keyof typeof openSections]}
              onOpenChange={() =>
                toggleSection(section.key as keyof typeof openSections)
              }>
              <Card className="glass-card border-white/10 mt-6">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-white text-lg">
                    {section.title}
                  </CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white">
                      {openSections[
                        section.key as keyof typeof openSections
                      ] ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>

                <AnimatePresence initial={false}>
                  {openSections[section.key as keyof typeof openSections] && (
                    <CollapsibleContent asChild>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}>
                        <CardContent className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={section.value}
                              onChange={(e) => section.setValue(e.target.value)}
                              placeholder={section.placeholder}
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Button
                              type="button"
                              onClick={() =>
                                addItem(
                                  section.key as
                                    | "tags"
                                    | "requirements"
                                    | "outcomes",
                                  section.value
                                )
                              }
                              className={`bg-gradient-to-r ${section.gradient}`}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {form
                              .getValues(section.key as any)
                              .map((item: any) => (
                                <Badge
                                  key={item}
                                  className="bg-white/10 text-white">
                                  {item}
                                  <X
                                    className="w-3 h-3 ml-2 cursor-pointer"
                                    onClick={() =>
                                      removeItem(
                                        section.key as
                                          | "tags"
                                          | "requirements"
                                          | "outcomes",
                                        item
                                      )
                                    }
                                  />
                                </Badge>
                              ))}
                          </div>
                        </CardContent>
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
