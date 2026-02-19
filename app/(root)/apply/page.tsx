"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Users,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Briefcase,
  Target,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const signedInEmail = session?.user?.email?.trim() ?? "";
  const signedInRole = session?.user?.role ?? "USER";
  const isStudentApplicant = signedInRole === "STUDENT";
  const shouldLockEmail = Boolean(signedInEmail) && !isStudentApplicant;

  const [applicationData, setApplicationData] = useState<ApplicationData>({
    applicationType: "",
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      timezone: "",
      linkedin: "",
      website: "",
      bio: "",
    },
    professional: {
      currentRole: "",
      company: "",
      experience: "",
      industry: "",
      skills: [],
      achievements: [],
      resume: null,
      resumeUrl: "",
      portfolio: "",
    },
    teaching: {
      subjects: [],
      experience: "",
      approach: "",
      availability: [],
      hourlyRate: 0,
      languages: [],
      certifications: [],
    },
    motivation: {
      why: "",
      goals: "",
      commitment: "",
      references: "",
    },
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!signedInEmail) return;
    setApplicationData((prev) => {
      if (shouldLockEmail) {
        if (prev.personalInfo.email === signedInEmail) return prev;
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            email: signedInEmail,
          },
        };
      }

      if (!prev.personalInfo.email) {
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            email: signedInEmail,
          },
        };
      }
      return prev;
    });
  }, [signedInEmail, shouldLockEmail]);

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Design",
    "Consulting",
    "Startup",
    "E-commerce",
    "Media",
  ];

  const subjects = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "UI/UX Design",
    "Digital Marketing",
    "Business Strategy",
    "Product Management",
    "Leadership",
    "Career Development",
  ];

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Portuguese",
    "Chinese",
    "Japanese",
    "Korean",
  ];

  const timezones = [
    "PST (Pacific)",
    "MST (Mountain)",
    "CST (Central)",
    "EST (Eastern)",
    "GMT (London)",
    "CET (Central Europe)",
    "JST (Japan)",
    "AEST (Australia)",
  ];

  const addSkill = () => {
    if (
      newSkill.trim() &&
      !applicationData.professional.skills.includes(newSkill.trim())
    ) {
      setApplicationData((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          skills: [...prev.professional.skills, newSkill.trim()],
        },
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setApplicationData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter(
          (skill) => skill !== skillToRemove,
        ),
      },
    }));
  };

  const addAchievement = () => {
    if (
      newAchievement.trim() &&
      !applicationData.professional.achievements.includes(newAchievement.trim())
    ) {
      setApplicationData((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          achievements: [
            ...prev.professional.achievements,
            newAchievement.trim(),
          ],
        },
      }));
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievementToRemove: string) => {
    setApplicationData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        achievements: prev.professional.achievements.filter(
          (achievement) => achievement !== achievementToRemove,
        ),
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      toast.error("Resume file is too large. Max size is 5MB.");
      event.target.value = "";
      return;
    }

    setIsUploadingResume(true);
    try {
      const signedUploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          visibility: "public",
        }),
      });

      const signedUploadData = await signedUploadRes.json().catch(() => null);
      if (
        !signedUploadRes.ok ||
        !signedUploadData?.success ||
        !signedUploadData?.url ||
        !signedUploadData?.fields?.key
      ) {
        throw new Error(
          signedUploadData?.error || "Failed to initialize upload",
        );
      }

      const uploadFormData = new FormData();
      Object.entries(signedUploadData.fields).forEach(([key, value]) => {
        uploadFormData.append(key, String(value));
      });
      uploadFormData.append("file", file);

      const uploadRes = await fetch(signedUploadData.url, {
        method: "POST",
        body: uploadFormData,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload resume");
      }

      const uploadUrl = String(signedUploadData.url);
      const objectKey = String(signedUploadData.fields.key);
      const separator = uploadUrl.endsWith("/") ? "" : "/";
      const resumeUrl = `${uploadUrl}${separator}${objectKey}`;

      setApplicationData((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          resume: file,
          resumeUrl,
        },
      }));
      toast.success("Resume uploaded successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload resume.",
      );
    } finally {
      setIsUploadingResume(false);
      event.target.value = "";
    }
  };

  const submitApplication = async () => {
    if (!applicationData.professional.resumeUrl) {
      toast.error("Please upload your resume before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...applicationData,
          professional: {
            ...applicationData.professional,
            resumeFileName: applicationData.professional.resume?.name ?? "",
            resumeUrl: applicationData.professional.resumeUrl,
            resumeMimeType: applicationData.professional.resume?.type ?? "",
            resumeFileSize: applicationData.professional.resume?.size ?? 0,
          },
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.errors) {
          result.errors.forEach((err: { message: string }) => {
            toast.error(err.message);
          });
        } else if (result?.error) {
          toast.error(result.error);
        } else {
          toast.error("Something went wrong.");
        }

        return;
      }

      toast.success(
        "Application submitted successfully! We'll review it within 48 hours.",
      );
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Choose Your Path
              </h2>
              <p className="text-gray-300">
                Select how you'd like to contribute to our learning community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className={`cursor-pointer ${
                  applicationData.applicationType === "tutor"
                    ? "ring-2 ring-neon-blue"
                    : ""
                }`}
                onClick={() =>
                  setApplicationData((prev) => ({
                    ...prev,
                    applicationType: "tutor",
                  }))
                }>
                <Card className="glass-card border-white/10 hover-glow h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Become a Tutor
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Create and sell courses, teach students, and build your
                      educational brand on our platform.
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Create unlimited courses
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Earn 70% revenue share
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Access to course creation tools
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Student analytics & insights
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className={`cursor-pointer ${
                  applicationData.applicationType === "mentor"
                    ? "ring-2 ring-neon-purple"
                    : ""
                }`}
                onClick={() =>
                  setApplicationData((prev) => ({
                    ...prev,
                    applicationType: "mentor",
                  }))
                }>
                <Card className="glass-card border-white/10 hover-glow h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-neon-purple to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Become a Mentor
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Provide 1-on-1 guidance, career coaching, and personalized
                      mentorship to help others grow.
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Set your own hourly rates
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Flexible scheduling
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Video call platform included
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        <span className="text-gray-300">
                          Global mentee network
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {applicationData.applicationType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center">
                <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-lg px-4 py-2">
                  {applicationData.applicationType === "tutor"
                    ? "Tutor"
                    : "Mentor"}{" "}
                  Application Selected
                </Badge>
              </motion.div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Personal Information
              </h2>
              <p className="text-gray-300">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <Label htmlFor="firstName" className="text-white">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={applicationData.personalInfo.firstName}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        firstName: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-white">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={applicationData.personalInfo.lastName}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        lastName: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationData.personalInfo.email}
                  disabled={shouldLockEmail}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        email: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
                {shouldLockEmail && (
                  <p className="text-xs text-gray-400 mt-1">
                    Email is locked to your signed-in account.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={applicationData.personalInfo.phone}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        phone: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-white">
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={applicationData.personalInfo.location}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        location: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Timezone *</Label>
                <Select
                  value={applicationData.personalInfo.timezone}
                  onValueChange={(value) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, timezone: value },
                    }))
                  }>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="linkedin" className="text-white">
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={applicationData.personalInfo.linkedin}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        linkedin: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="website" className="text-white">
                  Personal Website/Portfolio
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={applicationData.personalInfo.website}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo,
                        website: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <Label htmlFor="bio" className="text-white">
                Professional Bio *
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your background, expertise, and what makes you unique..."
                value={applicationData.personalInfo.bio}
                onChange={(e) =>
                  setApplicationData((prev) => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, bio: e.target.value },
                  }))
                }
                className="mt-1 bg-white/10 border-white/20 text-white min-h-[120px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Professional Background
              </h2>
              <p className="text-gray-300">
                Share your professional experience and expertise
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <Label htmlFor="currentRole" className="text-white">
                  Current Role *
                </Label>
                <Input
                  id="currentRole"
                  placeholder="e.g., Senior Software Engineer"
                  value={applicationData.professional.currentRole}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      professional: {
                        ...prev.professional,
                        currentRole: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-white">
                  Company *
                </Label>
                <Input
                  id="company"
                  placeholder="e.g., Google, Microsoft, Startup"
                  value={applicationData.professional.company}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      professional: {
                        ...prev.professional,
                        company: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="experience" className="text-white">
                  Years of Experience *
                </Label>
                <Select
                  value={applicationData.professional.experience}
                  onValueChange={(value) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      professional: { ...prev.professional, experience: value },
                    }))
                  }>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Industry *</Label>
                <Select
                  value={applicationData.professional.industry}
                  onValueChange={(value) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      professional: { ...prev.professional, industry: value },
                    }))
                  }>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <Label className="text-white">Skills & Expertise *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button
                    onClick={addSkill}
                    size="sm"
                    className="bg-neon-blue text-white">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {applicationData.professional.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-pointer bg-neon-blue/20 text-neon-blue border-neon-blue/30"
                      onClick={() => removeSkill(skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Key Achievements</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add an achievement"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addAchievement()}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button
                    onClick={addAchievement}
                    size="sm"
                    className="bg-neon-purple text-white">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {applicationData.professional.achievements.map(
                    (achievement) => (
                      <Badge
                        key={achievement}
                        variant="secondary"
                        className="cursor-pointer bg-neon-purple/20 text-neon-purple border-neon-purple/30"
                        onClick={() => removeAchievement(achievement)}>
                        {achievement} ×
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white">Resume/CV *</Label>
                <div className="mt-2 border-2 border-dashed border-white/20 rounded-lg p-6 text-center transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">
                    Upload your resume (PDF, DOC, DOCX)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: 5MB
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeUpload}
                    disabled={isUploadingResume}
                    className="mt-4 bg-white/10 border-white/20 text-white file:bg-neon-blue/20 file:text-neon-blue file:border-0"
                  />
                  {isUploadingResume && (
                    <p className="text-xs text-neon-blue mt-3">
                      Uploading resume...
                    </p>
                  )}
                  {!isUploadingResume &&
                    applicationData.professional.resume && (
                      <p className="text-xs text-neon-green mt-3">
                        Uploaded: {applicationData.professional.resume.name}
                      </p>
                    )}
                </div>
              </div>

              <div>
                <Label htmlFor="portfolio" className="text-white">
                  Portfolio/Work Samples
                </Label>
                <Input
                  id="portfolio"
                  placeholder="Link to your portfolio, GitHub, or work samples"
                  value={applicationData.professional.portfolio}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      professional: {
                        ...prev.professional,
                        portfolio: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {applicationData.applicationType === "tutor"
                  ? "Teaching"
                  : "Mentoring"}{" "}
                Experience
              </h2>
              <p className="text-gray-300">
                Tell us about your{" "}
                {applicationData.applicationType === "tutor"
                  ? "teaching"
                  : "mentoring"}{" "}
                background
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <Label className="text-white">
                  {applicationData.applicationType === "tutor"
                    ? "Subjects You Can Teach"
                    : "Areas You Can Mentor In"}{" "}
                  *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={applicationData.teaching.subjects.includes(
                          subject,
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setApplicationData((prev) => ({
                              ...prev,
                              teaching: {
                                ...prev.teaching,
                                subjects: [...prev.teaching.subjects, subject],
                              },
                            }));
                          } else {
                            setApplicationData((prev) => ({
                              ...prev,
                              teaching: {
                                ...prev.teaching,
                                subjects: prev.teaching.subjects.filter(
                                  (s) => s !== subject,
                                ),
                              },
                            }));
                          }
                        }}
                        className="border-white/20"
                      />
                      <Label htmlFor={subject} className="text-white text-sm">
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">
                  {applicationData.applicationType === "tutor"
                    ? "Teaching"
                    : "Mentoring"}{" "}
                  Experience
                </Label>
                <RadioGroup
                  value={applicationData.teaching.experience}
                  onValueChange={(value) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      teaching: { ...prev.teaching, experience: value },
                    }))
                  }
                  className="mt-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="none"
                      id="none"
                      className="border-white/20"
                    />
                    <Label htmlFor="none" className="text-white">
                      No formal experience (but eager to start!)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="some"
                      id="some"
                      className="border-white/20"
                    />
                    <Label htmlFor="some" className="text-white">
                      Some experience (1-2 years)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="experienced"
                      id="experienced"
                      className="border-white/20"
                    />
                    <Label htmlFor="experienced" className="text-white">
                      Experienced (3+ years)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="approach" className="text-white">
                  Your{" "}
                  {applicationData.applicationType === "tutor"
                    ? "Teaching"
                    : "Mentoring"}{" "}
                  Approach *
                </Label>
                <Textarea
                  id="approach"
                  placeholder={`Describe your ${
                    applicationData.applicationType === "tutor"
                      ? "teaching"
                      : "mentoring"
                  } philosophy and methods...`}
                  value={applicationData.teaching.approach}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      teaching: { ...prev.teaching, approach: e.target.value },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white">Availability *</Label>
                  <div className="space-y-2 mt-3">
                    {[
                      "Weekday Mornings",
                      "Weekday Afternoons",
                      "Weekday Evenings",
                      "Weekends",
                    ].map((time) => (
                      <div key={time} className="flex items-center space-x-2">
                        <Checkbox
                          id={time}
                          checked={applicationData.teaching.availability.includes(
                            time,
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setApplicationData((prev) => ({
                                ...prev,
                                teaching: {
                                  ...prev.teaching,
                                  availability: [
                                    ...prev.teaching.availability,
                                    time,
                                  ],
                                },
                              }));
                            } else {
                              setApplicationData((prev) => ({
                                ...prev,
                                teaching: {
                                  ...prev.teaching,
                                  availability:
                                    prev.teaching.availability.filter(
                                      (t) => t !== time,
                                    ),
                                },
                              }));
                            }
                          }}
                          className="border-white/20"
                        />
                        <Label htmlFor={time} className="text-white text-sm">
                          {time}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {applicationData.applicationType === "mentor" && (
                  <div>
                    <Label htmlFor="hourlyRate" className="text-white">
                      Desired Hourly Rate (NGN) *
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="e.g., 50"
                      value={applicationData.teaching.hourlyRate || ""}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          teaching: {
                            ...prev.teaching,
                            hourlyRate: Number.parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="mt-1 bg-white/10 border-white/20 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Platform takes 30% commission. You'll earn ₦
                      {(
                        (applicationData.teaching.hourlyRate || 0) * 0.7
                      ).toFixed(0)}
                      /hour
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-white">
                  Languages You Can Teach/Mentor In *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {languages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={applicationData.teaching.languages.includes(
                          language,
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setApplicationData((prev) => ({
                              ...prev,
                              teaching: {
                                ...prev.teaching,
                                languages: [
                                  ...prev.teaching.languages,
                                  language,
                                ],
                              },
                            }));
                          } else {
                            setApplicationData((prev) => ({
                              ...prev,
                              teaching: {
                                ...prev.teaching,
                                languages: prev.teaching.languages.filter(
                                  (l) => l !== language,
                                ),
                              },
                            }));
                          }
                        }}
                        className="border-white/20"
                      />
                      <Label htmlFor={language} className="text-white text-sm">
                        {language}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Final Steps
              </h2>
              <p className="text-gray-300">
                Tell us why you want to join our community
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <Label htmlFor="why" className="text-white">
                  Why do you want to become a {applicationData.applicationType}{" "}
                  on our platform? *
                </Label>
                <Textarea
                  id="why"
                  placeholder="Share your motivation and what drives you to teach/mentor others..."
                  value={applicationData.motivation.why}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      motivation: { ...prev.motivation, why: e.target.value },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="goals" className="text-white">
                  What are your goals as a {applicationData.applicationType}? *
                </Label>
                <Textarea
                  id="goals"
                  placeholder="Describe what you hope to achieve and how you plan to help students/mentees..."
                  value={applicationData.motivation.goals}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      motivation: { ...prev.motivation, goals: e.target.value },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="commitment" className="text-white">
                  How much time can you commit per week? *
                </Label>
                <Select
                  value={applicationData.motivation.commitment}
                  onValueChange={(value) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      motivation: { ...prev.motivation, commitment: value },
                    }))
                  }>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select time commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10">5-10 hours per week</SelectItem>
                    <SelectItem value="10-20">10-20 hours per week</SelectItem>
                    <SelectItem value="20-30">20-30 hours per week</SelectItem>
                    <SelectItem value="30+">30+ hours per week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="references" className="text-white">
                  Professional References (Optional)
                </Label>
                <Textarea
                  id="references"
                  placeholder="Provide contact information for 2-3 professional references who can vouch for your expertise..."
                  value={applicationData.motivation.references}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      motivation: {
                        ...prev.motivation,
                        references: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/10 border-white/20 text-white min-h-[100px]"
                />
              </div>

              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h3 className="text-white font-semibold mb-4">
                  Application Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Application Type:</span>
                    <span className="text-white ml-2 capitalize">
                      {applicationData.applicationType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">
                      {applicationData.personalInfo.firstName}{" "}
                      {applicationData.personalInfo.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Role:</span>
                    <span className="text-white ml-2">
                      {applicationData.professional.currentRole}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-white ml-2">
                      {applicationData.professional.experience}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Subjects:</span>
                    <span className="text-white ml-2">
                      {applicationData.teaching.subjects.length} selected
                    </span>
                  </div>
                  {applicationData.applicationType === "mentor" && (
                    <div>
                      <span className="text-gray-400">Hourly Rate:</span>
                      <span className="text-white ml-2">
                        ₦{applicationData.teaching.hourlyRate}/hour
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-medium">
                      What happens next?
                    </h4>
                    <ul className="text-gray-300 text-sm mt-2 space-y-1">
                      <li>• We'll review your application within 48 hours</li>
                      <li>• You may be invited for a brief video interview</li>
                      <li>
                        • Upon approval, you'll get access to our platform tools
                      </li>
                      <li>
                        • We'll help you set up your profile and get started
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Header */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Join Our <span className="text-gradient">Expert Community</span>
              </h1>
              <p className="text-xl text-gray-300">
                Share your knowledge and help others grow while building your
                personal brand
              </p>
            </motion.div>

            {/* Progress */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-gray-400 text-sm">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-4">
                {[
                  { step: 1, title: "Choose Path", icon: Target },
                  { step: 2, title: "Personal Info", icon: Users },
                  { step: 3, title: "Professional", icon: Briefcase },
                  { step: 4, title: "Teaching/Mentoring", icon: GraduationCap },
                  { step: 5, title: "Final Steps", icon: CheckCircle },
                ].map(({ step, title, icon: Icon }) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ₦{
                      currentStep === step
                        ? "bg-neon-blue text-white"
                        : currentStep > step
                        ? "bg-neon-green text-white"
                        : "bg-white/10 text-gray-400"
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm hidden md:block">
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-16">
          <div className="container mx-auto px-6">
            <Card className="glass-card border-white/10 max-w-6xl mx-auto">
              <CardContent className="p-8">{renderStepContent()}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 max-w-6xl mx-auto">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Need help?{" "}
                  <span className="text-neon-blue cursor-pointer hover:underline">
                    Contact Support
                  </span>
                </p>
              </div>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    !applicationData.applicationType && currentStep === 1
                  }
                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitApplication}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
