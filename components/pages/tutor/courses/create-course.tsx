"use client";

import { createCourse } from "@/actions/tutor-actions";
import FormError from "@/components/shared/form-error";
import FormSuccess from "@/components/shared/form-success";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { courseSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  BookOpen,
  Eye,
  PlayCircle,
  Save,
  Settings,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import CourseBasicInfoForm from "./course-basic-info-form";
import CourseCurriculumBuilder from "./course-curriculum-builder";
import CoursePricingForm from "./course-pricing-form";
import CourseSettingsForm from "./course-settings-form";
import CourseTypeSelector from "./course-type-selector";
import { Spinner } from "@/components/ui/spinner";

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
  description?: string;
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const modulesRef = useRef<CourseModule[]>([]);
  const draftKey = "courseCreateDraft";

  // Track publishing requirements reactively
  const [publishReady, setPublishReady] = useState({
    hasTitle: false,
    hasDescription: false,
    hasCategory: false,
    hasModules: false,
    hasThreeLessons: false,
    hasLessonTitles: false,
    hasThumbnail: false,
    hasPrice: false,
  });

  const defaultValues: z.infer<typeof courseSchema> = {
    courseType: "REGULAR",
    programSlug: undefined,
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
    groupTiers: [],
  };

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema) as Resolver<
      z.infer<typeof courseSchema>
    >,
    defaultValues,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        values?: z.infer<typeof courseSchema>;
        modules?: CourseModule[];
      };
      if (parsed?.values) {
        form.reset({ ...defaultValues, ...parsed.values });
      }
      if (parsed?.modules) {
        setModules(parsed.modules);
      }
    } catch (err) {
      console.warn("Failed to restore course draft", err);
    }
  }, [form]);

  useEffect(() => {
    modulesRef.current = modules;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ values: form.getValues(), modules }),
      );
    } catch (err) {
      console.warn("Failed to store course draft", err);
    }
    // Update module-related publishing requirements when modules change
    const values = form.getValues();
    setPublishReady((prev) => ({
      ...prev,
      hasModules: modules.length > 0,
      hasThreeLessons:
        modules.length > 0 && modules.every((mod) => mod.lessons.length >= 3),
      hasLessonTitles:
        modules.length > 0 &&
        modules.every(
          (mod) =>
            mod.lessons.length > 0 &&
            mod.lessons.every((lesson) => lesson.title?.trim()),
        ),
    }));
  }, [modules, form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ values, modules: modulesRef.current }),
        );
      } catch (err) {
        console.warn("Failed to store course draft", err);
      }
      // Update publishing requirements reactively
      setPublishReady({
        hasTitle: Boolean(values.title && values.title.trim()),
        hasDescription: Boolean(
          values.description && values.description.trim(),
        ),
        hasCategory: Boolean(values.category && values.category.trim()),
        hasModules: modulesRef.current.length > 0,
        hasThreeLessons:
          modulesRef.current.length > 0 &&
          modulesRef.current.every((mod) => mod.lessons.length >= 3),
        hasLessonTitles:
          modulesRef.current.length > 0 &&
          modulesRef.current.every(
            (mod) =>
              mod.lessons.length > 0 &&
              mod.lessons.every((lesson) => lesson.title?.trim()),
          ),
        hasThumbnail: Boolean(values.thumbnail),
        hasPrice: typeof values.price === "number" && values.price >= 0,
      });
    });
    return () => subscription.unsubscribe?.();
  }, [form]);

  const onSubmit = async (
    values: z.infer<typeof courseSchema>,
    isPublished: boolean,
  ) => {
    if (isPublished) {
      if (modules.length < 1 || modules.some((mod) => mod.lessons.length < 3)) {
        setError(
          "Course must have at least one module with 3 lessons to publish",
        );
        toast.error(
          "Course must have at least one module with 3 lessons to publish",
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

    await new Promise((r) => setTimeout(r, 100));
    const resolvedBasePrice =
      typeof values.basePrice === "number"
        ? values.basePrice
        : typeof values.currentPrice === "number"
          ? values.currentPrice
          : (values.price ?? 0);
    const resolvedCurrentPrice =
      typeof values.currentPrice === "number"
        ? values.currentPrice
        : resolvedBasePrice;

    startTransition(() => {
      console.log("Submitting modules:", modules);
      createCourse(
        {
          ...values,
          certificate: values.certificate,
          isPublished,
          price: resolvedBasePrice,
          basePrice: resolvedBasePrice,
          currentPrice: resolvedCurrentPrice,
        },
        modules,
      )
        .then((data) => {
          if (data && "error" in data) {
            setError(data.error!);
            toast.error(data.error);
          } else {
            form.reset(defaultValues);
            setModules([]);
            localStorage.removeItem(draftKey);
            setSuccess("Course created successfully");
            if (isPublished && data?.requiresApproval) {
              toast.success("Course submitted for approval");
            } else {
              toast.success("Course created successfully");
            }
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

  // Handler for form validation errors
  const onFormError = (errors: any) => {
    console.error("❌ Form validation errors:", errors);
    const errorMessages = Object.entries(errors)
      .map(([field, error]: [string, any]) => `${field}: ${error?.message}`)
      .slice(0, 3) // Show first 3 errors
      .join(", ");
    toast.error(`Please fix form errors: ${errorMessages}`);
  };

  const steps = [
    { id: 0, title: "Course Type", icon: GraduationCap },
    { id: 1, title: "Basic Info", icon: BookOpen },
    { id: 2, title: "Curriculum", icon: PlayCircle },
    { id: 3, title: "Pricing", icon: NairaSign },
    { id: 4, title: "Settings", icon: Settings },
  ];

  const handleResetBuilder = () => {
    form.reset(defaultValues);
    setModules([]);
    setCurrentStep(0);
    setError("");
    setSuccess("");
    localStorage.removeItem(draftKey);
  };

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
              onSubmit={form.handleSubmit(
                (data) => onSubmit(data, false),
                onFormError,
              )}
              className="space-y-8">
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-8">
                  <div className="flex flex-wrap gap-4 mb-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetBuilder}
                      className="ml-auto border-white/20 text-white hover:bg-white/10">
                      Start again
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-8">
                    {steps.map((step) => (
                      <Button
                        key={step.id}
                        type="button"
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

                  {currentStep === 0 && <CourseTypeSelector form={form} />}

                  {currentStep === 1 && (
                    <CourseBasicInfoForm
                      categories={categories}
                      levels={levels}
                    />
                  )}

                  {currentStep === 2 && (
                    <CourseCurriculumBuilder
                      form={form}
                      modules={modules}
                      setModules={setModules}
                    />
                  )}

                  {currentStep === 3 && <CoursePricingForm form={form} />}

                  {currentStep === 4 && (
                    <CourseSettingsForm
                      form={form}
                      onSubmit={onSubmit}
                      modules={modules}
                    />
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
                        onClick={() =>
                          form.handleSubmit(
                            (data) => onSubmit(data, false),
                            onFormError,
                          )()
                        }
                        type="submit"
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
                              Math.min(steps.length - 1, currentStep + 1),
                            )
                          }
                          className="bg-gradient-to-r from-neon-blue to-neon-purple">
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() =>
                            form.handleSubmit((data) => {
                              console.log("✅ Validated data:", data);
                              onSubmit(data, true);
                            }, onFormError)()
                          }
                          className={`bg-gradient-to-r from-neon-green to-emerald-400 flex items-center justify-center ${
                            isPending ? "opacity-80 cursor-not-allowed" : ""
                          }`}
                          disabled={
                            isPending ||
                            !publishReady.hasTitle ||
                            !publishReady.hasDescription ||
                            !publishReady.hasCategory ||
                            !publishReady.hasModules ||
                            !publishReady.hasThreeLessons ||
                            !publishReady.hasLessonTitles ||
                            !publishReady.hasThumbnail
                          }>
                          {isPending ? (
                            <>
                              <Spinner className="size-6 text-green-500" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publish Course
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Publishing Requirements Checklist */}
                  {currentStep === 4 && (
                    <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <h4 className="text-white font-semibold mb-3">
                        Publishing Checklist
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasTitle ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasTitle ? "✓" : "✗"} Course title
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasDescription ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasDescription ? "✓" : "✗"} Course
                          description
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasCategory ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasCategory ? "✓" : "✗"} Category
                          selected
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasModules ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasModules ? "✓" : "✗"} At least 1
                          module
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasThreeLessons ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasThreeLessons ? "✓" : "✗"} At least 3
                          lessons per module
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasLessonTitles ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasLessonTitles ? "✓" : "✗"} All lessons
                          have titles
                        </li>
                        <li
                          className={`flex items-center gap-2 ${publishReady.hasThumbnail ? "text-green-400" : "text-red-400"}`}>
                          {publishReady.hasThumbnail ? "✓" : "✗"} Course
                          thumbnail uploaded
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}
