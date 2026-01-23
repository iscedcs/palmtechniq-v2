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
import { BookOpen, Eye, PlayCircle, Save, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import CourseBasicInfoForm from "./course-basic-info-form";
import CourseCurriculumBuilder from "./course-curriculum-builder";
import CoursePricingForm from "./course-pricing-form";
import CourseSettingsForm from "./course-settings-form";
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
      groupTiers: [],
    },
  });

  const onSubmit = async (
    values: z.infer<typeof courseSchema>,
    isPublished: boolean
  ) => {
    if (isPublished) {
      if (modules.length < 1 || modules.some((mod) => mod.lessons.length < 3)) {
        setError(
          "Course must have at least one module with 3 lessons to publish"
        );
        toast.error(
          "Course must have at least one module with 3 lessons to publish"
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
    startTransition(() => {
      console.log("Submitting modules:", modules);
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

                  {currentStep === 0 && (
                    <CourseBasicInfoForm
                      categories={categories}
                      levels={levels}
                    />
                  )}

                  {currentStep === 1 && (
                    <CourseCurriculumBuilder
                      form={form}
                      modules={modules}
                      setModules={setModules}
                    />
                  )}

                  {currentStep === 2 && <CoursePricingForm form={form} />}

                  {currentStep === 3 && (
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
                          form.handleSubmit((data) => onSubmit(data, false))()
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
                          className={`bg-gradient-to-r from-neon-green to-emerald-400 flex items-center justify-center ${
                            isPending ? "opacity-80 cursor-not-allowed" : ""
                          }`}
                          disabled={
                            isPending ||
                            !form.getValues("title") ||
                            !form.getValues("description") ||
                            modules.length === 0 ||
                            modules.some((mod) => mod.lessons.length < 3) ||
                            !form.getValues("thumbnail")
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
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}
