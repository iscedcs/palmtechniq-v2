"use client";

import {
  addLessonToModule,
  addModuleToCourse,
  createCourse,
} from "@/actions/tutor-actions";
import FormError from "@/components/shared/form-error";
import FormSuccess from "@/components/shared/form-success";
import LessonUploadFile from "@/components/shared/lesson-uploader";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import UploadFile from "@/components/shared/uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { courseSchema, lessonSchema, moduleSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  BookOpen,
  Eye,
  PlayCircle,
  Plus,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  videoUrl?: string;
  sortOrder: number;
  description?: string; // Added
  isPreview: boolean;
}

const categories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "UI/UX Design",
  "Digital Marketing",
  "Business",
  "Entrepreneurship",
  "Finance & Accounting",
  "Leadership & Management",
  "Personal Development",
  "Productivity",
  "Photography",
  "Graphic Design",
  "Music",
  "Film & Video",
  "Language Learning",
  "Health & Fitness",
  "Nutrition & Diet",
  "Lifestyle",
  "Cooking",
  "Art & Creativity",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
];

const levels = ["Beginner", "Intermediate", "Advanced"];

export default function CreateCourse() {
  const [currentStep, setCurrentStep] = useState(0);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [uploading, setUploading] = useState({
    thumbnail: false,
    video: false,
  });
  const [lessonUploading, setLessonUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      duration: 0,
      category: "",
      level: "BEGINNER",
      language: "English",
      price: 0,
      basePrice: 0,
      currentPrice: 0,
      currency: "NGN",
      thumbnail: "",
      previewVideo: "",
      tags: [],
      requirements: [],
      outcomes: [],
      isPublished: false,
      allowDiscussions: true,
      certificate: true,
      isFlashSale: false,
      flashSaleEnd: undefined,
      groupBuyingEnabled: false,
      groupBuyingDiscount: 0,
    },
  });

  const [currentTag, setCurrentTag] = useState("");
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentOutcome, setCurrentOutcome] = useState("");

  const addTag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      currentTag.trim() &&
      !form.getValues("tags").includes(currentTag.trim())
    ) {
      form.setValue("tags", [...form.getValues("tags"), currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.preventDefault();
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove)
    );
  };

  const addRequirement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentRequirement.trim()) {
      form.setValue("requirements", [
        ...form.getValues("requirements"),
        currentRequirement.trim(),
      ]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    form.setValue(
      "requirements",
      form.getValues("requirements").filter((_, i) => i !== index)
    );
  };

  const addLearningOutcome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentOutcome.trim()) {
      form.setValue("outcomes", [
        ...form.getValues("outcomes"),
        currentOutcome.trim(),
      ]);
      setCurrentOutcome("");
    }
  };

  const removeLearningOutcome = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    form.setValue(
      "outcomes",
      form.getValues("outcomes").filter((_, i) => i !== index)
    );
  };

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
    const validatedModule = moduleSchema.safeParse(newModule);
    if (!validatedModule.success) {
      toast.error(
        validatedModule.error.issues[0]?.message || "Validation error"
      );
      return;
    }
    if (courseId) {
      const result = await addModuleToCourse(courseId, validatedModule.data);
      if (result.success) {
        setModules([...modules, { ...newModule, id: result.moduleId }]);
      } else {
        toast.error(result.error);
      }
    } else {
      setModules([...modules, newModule]);
    }
  };

  const updateModule = (moduleId: string, updates: Partial<CourseModule>) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId ? { ...module, ...updates } : module
      )
    );
  };

  const removeModule = (e: React.MouseEvent, moduleId: string) => {
    e.preventDefault();
    setModules(modules.filter((module) => module.id !== moduleId));
  };

  const addLesson = async (moduleId: string, courseId?: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    const newLesson: CourseLesson = {
      id: `temp-${Date.now()}`,
      title: `Lesson ${module.lessons.length + 1}`,
      type: "VIDEO",
      duration: 0,
      sortOrder: module.lessons.length,
      description: "",
      content: "",
      isPreview: false,
      videoUrl: "",
    };

    const validatedLesson = lessonSchema.safeParse(newLesson);
    if (!validatedLesson.success) {
      toast.error(validatedLesson.error.issues[0]?.message);
      return;
    }

    if (courseId) {
      const result = await addLessonToModule(
        courseId,
        moduleId,
        validatedLesson.data
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
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    const updatedLessons = module.lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    );
    updateModule(moduleId, { lessons: updatedLessons });
  };

  const removeLesson = (
    e: React.MouseEvent,
    moduleId: string,
    lessonId: string
  ) => {
    e.preventDefault();
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    updateModule(moduleId, {
      lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
    });
  };

  const onSubmit = (
    values: z.infer<typeof courseSchema>,
    isPublished: boolean
  ) => {
    if (isPublished) {
      if (modules.length < 1 || modules.some((mod) => mod.lessons.length < 5)) {
        setError(
          "Course must have at least one module with 5 lessons to publish"
        );
        toast.error(
          "Course must have at least one module with 5 lessons to publish"
        );
        return;
      }
      if (!values.thumbnail) {
        setError("Please upload a course thumbnail");
        toast.error("Please upload a course thumbnail");
        return;
      }
    }

    setError("");
    setSuccess("");

    startTransition(() => {
      createCourse(
        { ...values, certificate: values.certificate, isPublished },
        modules
      )
        .then((data) => {
          if (data && "error" in data) {
            setError(data.error!);
            toast.error(data.error);
          } else {
            form.reset();
            setModules([]);
            setSuccess("Course created successfully");
            toast.success("Course created successfully");
            router.refresh();
            if (isPublished) {
              router.push("/tutor/courses");
            }
          }
        })

        .catch((error) => {
          console.error("Error during creation:", error);
          setError("Something went wrong! Please try again");
          toast.error("Something went wrong! Please try again");
        });
    });
  };

  const steps = [
    { id: 0, title: "Basic Info", icon: BookOpen },
    { id: 1, title: "Curriculum", icon: PlayCircle },
    { id: 2, title: "Pricing", icon: NairaSign },
    { id: 3, title: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-gradient">
              Create New Course
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Build an engaging, high-converting course for PalmTechnIQ
              learners.
            </p>
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}
          </motion.div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => onSubmit(data, false))}
              className="space-y-8">
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-8">
                  <div className="flex flex-wrap gap-4 mb-8">
                    {steps.map((step) => (
                      <Button
                        key={step.id}
                        variant={
                          currentStep === step.id ? "default" : "outline"
                        }
                        className={`flex-1 text-center ${
                          currentStep === step.id
                            ? "bg-gradient-to-r from-neon-blue to-neon-purple"
                            : "border-white/20 text-white hover:bg-white/10"
                        }`}
                        onClick={() => setCurrentStep(step.id)}>
                        <step.icon className="w-4 h-4 mr-2" />
                        {step.title}
                      </Button>
                    ))}
                  </div>

                  {currentStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}>
                      <Card className="glass-card border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Course Title
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="subtitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Subtitle
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Description
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Category
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                      <SelectValue />
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Duration
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min={0}
                                    placeholder="Total course Duration in minutes"
                                    className="bg-white/10 border-white/20 text-white"
                                    onChange={(e) => {
                                      const val = e.target.valueAsNumber;
                                      field.onChange(
                                        Number.isNaN(val) ? undefined : val
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Level
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {levels.map((level) => (
                                      <SelectItem
                                        key={level}
                                        value={level
                                          .toUpperCase()
                                          .replace(" ", "_")}>
                                        {level}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Language
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="English">
                                      English
                                    </SelectItem>
                                    <SelectItem value="Spanish">
                                      Spanish
                                    </SelectItem>
                                    <SelectItem value="French">
                                      French
                                    </SelectItem>
                                    <SelectItem value="German">
                                      German
                                    </SelectItem>
                                    <SelectItem value="Portuguese">
                                      Portuguese
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="thumbnail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Course Thumbnail
                                </FormLabel>
                                <FormControl>
                                  <UploadFile
                                    setValue={form.setValue}
                                    fieldName="thumbnail"
                                    uploading={uploading.thumbnail}
                                    setUploading={(value) =>
                                      setUploading((prev) => ({
                                        ...prev,
                                        thumbnail:
                                          typeof value === "function"
                                            ? value(prev.thumbnail)
                                            : value,
                                      }))
                                    }
                                  />
                                </FormControl>
                                {field.value && (
                                  <img
                                    src={field.value}
                                    alt="Thumbnail"
                                    className="mt-2 h-24 rounded"
                                  />
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="previewVideo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Preview Video
                                </FormLabel>
                                <FormControl>
                                  <UploadFile
                                    setValue={form.setValue}
                                    fieldName="previewVideo"
                                    uploading={uploading.video}
                                    setUploading={(value) =>
                                      setUploading((prev) => ({
                                        ...prev,
                                        thumbnail:
                                          typeof value === "function"
                                            ? value(prev.thumbnail)
                                            : value,
                                      }))
                                    }
                                  />
                                </FormControl>
                                {field.value && (
                                  <video
                                    src={field.value}
                                    controls
                                    className="mt-2 h-24 rounded"
                                  />
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card className="glass-card border-white/10 mt-6">
                        <CardHeader>
                          <CardTitle className="text-white">Tags</CardTitle>
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
                            {form.getValues("tags").map((tag) => (
                              <Badge
                                key={tag}
                                className="bg-white/10 text-white">
                                {tag}
                                <X
                                  className="w-3 h-3 ml-2 cursor-pointer"
                                  onClick={(e) => removeTag(e, tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card border-white/10 mt-6">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Requirements
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              value={currentRequirement}
                              onChange={(e) =>
                                setCurrentRequirement(e.target.value)
                              }
                              placeholder="Add a requirement"
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Button
                              type="button"
                              onClick={addRequirement}
                              className="bg-gradient-to-r from-neon-blue to-neon-purple">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <ul className="list-disc pl-5 text-gray-300">
                            {form
                              .getValues("requirements")
                              .map((req, index) => (
                                <li
                                  key={index}
                                  className="flex justify-between items-center">
                                  {req}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => removeRequirement(e, index)}
                                    className="text-red-400">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </li>
                              ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="glass-card border-white/10 mt-6">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Learning Outcomes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              value={currentOutcome}
                              onChange={(e) =>
                                setCurrentOutcome(e.target.value)
                              }
                              placeholder="Add a learning outcome"
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Button
                              type="button"
                              onClick={addLearningOutcome}
                              className="bg-gradient-to-r from-neon-blue to-neon-purple">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <ul className="list-disc pl-5 text-gray-300">
                            {form
                              .getValues("outcomes")
                              .map((outcome, index) => (
                                <li
                                  key={index}
                                  className="flex justify-between items-center">
                                  {outcome}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) =>
                                      removeLearningOutcome(e, index)
                                    }
                                    className="text-red-400">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </li>
                              ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}>
                      <Card className="glass-card border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Curriculum
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <Button
                            type="button"
                            onClick={() => addModule()}
                            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Module
                          </Button>
                          {modules.map((module) => (
                            <Card
                              key={module.id}
                              className="glass-card border-white/20 mt-4">
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <Input
                                    value={module.title}
                                    onChange={(e) =>
                                      updateModule(module.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    className="bg-transparent border-0 text-white text-lg font-semibold"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => removeModule(e, module.id)}
                                    className="text-red-400">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                                <Textarea
                                  value={module.description}
                                  onChange={(e) =>
                                    updateModule(module.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Module description"
                                  className="mt-2 bg-white/10 border-white/20 text-white"
                                />
                                <Textarea
                                  value={module.content}
                                  onChange={(e) =>
                                    updateModule(module.id, {
                                      content: e.target.value,
                                    })
                                  }
                                  placeholder="Module content"
                                  className="mt-2 bg-white/10 border-white/20 text-white"
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
                                  className="mt-2 bg-white/10 border-white/20 text-white"
                                />
                              </CardHeader>
                              <CardContent>
                                <Button
                                  type="button"
                                  onClick={() => addLesson(module.id)}
                                  className="w-full bg-gradient-to-r from-neon-green to-emerald-400">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Lesson
                                </Button>
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="mt-4 p-4 bg-white/5 rounded-lg">
                                    <div className="flex space-y-3 justify-between items-center">
                                      <Input
                                        value={lesson.title}
                                        onChange={(e) =>
                                          updateLesson(module.id, lesson.id, {
                                            title: e.target.value,
                                          })
                                        }
                                        className="bg-white/10 border-white/20 border-0 text-white"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) =>
                                          removeLesson(e, module.id, lesson.id)
                                        }
                                        className="text-red-400">
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <Input
                                        value={lesson.content}
                                        onChange={(e) =>
                                          updateLesson(module.id, lesson.id, {
                                            content: e.target.value,
                                          })
                                        }
                                        className="bg-white/10 border-white/20 border-0 text-white"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) =>
                                          removeLesson(e, module.id, lesson.id)
                                        }
                                        className="text-red-400">
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <Select
                                      value={lesson.type}
                                      onValueChange={(value) =>
                                        updateLesson(module.id, lesson.id, {
                                          type: value as any,
                                        })
                                      }>
                                      <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="VIDEO">
                                          Video
                                        </SelectItem>
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
                                      className="mt-2 bg-white/10 border-white/20 text-white"
                                    />
                                    {lesson.type === "VIDEO" && (
                                      <div className="space-y-3">
                                        <Textarea
                                          value={lesson.description || ""}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              description: e.target.value,
                                            })
                                          }
                                          placeholder="Lesson description"
                                          className="mt-2 bg-white/10 border-white/20 text-white"
                                        />
                                        {/* <Textarea
                                          value={lesson.content || ""}
                                          onChange={(e) =>
                                            updateLesson(module.id, lesson.id, {
                                              content: e.target.value,
                                            })
                                          }
                                          placeholder="Lesson content"
                                          className="my-2 bg-white/10 border-white/20 text-white"
                                        /> */}
                                        <LessonUploadFile
                                          uploading={lessonUploading}
                                          setUploading={setLessonUploading}
                                          onUploadSuccess={(url) => {
                                            updateLesson(module.id, lesson.id, {
                                              videoUrl: url,
                                            });
                                          }}
                                        />
                                      </div>
                                    )}
                                    {/* {lesson.type === "TEXT" && (
                                      <Textarea
                                        value={lesson.content || ""}
                                        onChange={(e) =>
                                          updateLesson(module.id, lesson.id, {
                                            content: e.target.value,
                                          })
                                        }
                                        placeholder="Lesson content"
                                        className="mt-2 bg-white/10 border-white/20 text-white"
                                      />
                                    )} */}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}>
                      <Card className="glass-card border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Pricing & Monetization
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={form.control}
                            name="basePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Base Price
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="currentPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">
                                  Current Price
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    className="bg-white/10 border-white/20 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="groupBuyingEnabled"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel className="text-white">
                                    Enable Group Buying
                                  </FormLabel>
                                  <p className="text-sm text-gray-400">
                                    Offer discounts for group purchases
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
                          {form.getValues("groupBuyingEnabled") && (
                            <FormField
                              control={form.control}
                              name="groupBuyingDiscount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">
                                    Group Buying Discount (%)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={(field.value ?? 0) * 100}
                                      onChange={(e) =>
                                        field.onChange(
                                          Number(e.target.value) / 100
                                        )
                                      }
                                      className="bg-white/10 border-white/20 text-white"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormField
                            control={form.control}
                            name="isFlashSale"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel className="text-white">
                                    Enable Flash Sale
                                  </FormLabel>
                                  <p className="text-sm text-gray-400">
                                    Temporary discount period
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
                          {form.getValues("isFlashSale") && (
                            <FormField
                              control={form.control}
                              name="flashSaleEnd"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">
                                    Flash Sale End Date
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="datetime-local"
                                      value={
                                        field.value
                                          ? field.value.slice(0, 16)
                                          : ""
                                      }
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}>
                      <Card className="glass-card border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Course Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                    Enable student discussions
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
                                    Issue certificate upon completion
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

                      <Card className="glass-card border-white/10 mt-6">
                        <CardHeader>
                          <CardTitle className="text-white">
                            Publishing Options
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
                              <li>• Set course price</li>
                              <li>• Review all content</li>
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <Button
                              type="submit"
                              onClick={() =>
                                form.handleSubmit((data) =>
                                  onSubmit(data, false)
                                )()
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
                                    console.error(
                                      "❌ Validation errors:",
                                      errors
                                    );
                                    toast.error(
                                      "Validation failed, check console for details"
                                    );
                                  }
                                )()
                              }
                              className="w-full bg-gradient-to-r from-neon-green to-emerald-400"
                              disabled={
                                !form.getValues("title") ||
                                !form.getValues("description") ||
                                modules.length === 0 ||
                                modules.some((mod) => mod.lessons.length < 5) ||
                                !form.getValues("thumbnail")
                              }>
                              <Eye className="w-4 h-4 mr-2" />
                              Publish Course
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <div className="flex justify-between pt-8 border-t border-white/10">
                    <Button
                      type="button"
                      onClick={() =>
                        setCurrentStep(Math.max(0, currentStep - 1))
                      }
                      disabled={currentStep === 0}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10">
                      Previous
                    </Button>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        onClick={() =>
                          form.handleSubmit((data) => onSubmit(data, false))()
                        }
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                      {currentStep < steps.length - 1 ? (
                        <Button
                          type="button"
                          onClick={() =>
                            setCurrentStep(
                              Math.min(steps.length - 1, currentStep + 1)
                            )
                          }
                          className="bg-gradient-to-r from-neon-blue to-neon-purple">
                          Next
                        </Button>
                      ) : (
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
                                toast.error(
                                  "Validation failed, check console for details"
                                );
                              }
                            )()
                          }
                          className="bg-gradient-to-r from-neon-green to-emerald-400"
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
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}
