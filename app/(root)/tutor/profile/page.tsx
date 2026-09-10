"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Camera,
  Globe,
  Clock,
  Award,
  BookOpen,
  Plus,
  X,
  Save,
  Eye,
  Shield,
  Bell,
  Briefcase,
  LinkIcon,
  Youtube,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Loader2,
  ExternalLink,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { generateRandomAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { defaultUserPreferences } from "@/lib/user-preferences";
import {
  getTutorProfileData,
  type TutorAvailability,
  type TutorAvailabilityDay,
  updateTutorProfile,
} from "../../../../actions/tutor-profile";
import {
  getAccountSecurityStatus,
  savePreferences,
  type TwoFactorMethod,
} from "@/actions/account-security";
import { ChangePasswordDialog } from "@/components/pages/tutor/settings/change-password-dialog";
import { TwoFactorDialog } from "@/components/pages/tutor/settings/two-factor-dialog";
import ProfileLoading from "./loading";

type AvailabilityDay = TutorAvailabilityDay;
type Availability = TutorAvailability;

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const defaultAvailability: Availability = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

export default function TutorProfilePage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, startSaving] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fallbackAvatar] = useState(generateRandomAvatar());
  const [profileImage, setProfileImage] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    title: "",
    experience: 0,
    course: "",
    hourlyRate: "",
    location: "",
    timezone: "",
    language: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newEducation, setNewEducation] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    website: "",
    linkedin: "",
    twitter: "",
    github: "",
    youtube: "",
    instagram: "",
  });
  const [availability, setAvailability] =
    useState<Availability>(defaultAvailability);
  const [preferences, setPreferences] = useState(defaultUserPreferences);
  const [publicSlug, setPublicSlug] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Security & 2FA State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{
    hasPassword: boolean;
    twoFactorEnabled: boolean;
    twoFactorMethod: TwoFactorMethod | null;
    email: string;
  }>({
    hasPassword: true,
    twoFactorEnabled: false,
    twoFactorMethod: null,
    email: "",
  });
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [savingPrivacyPrefs, setSavingPrivacyPrefs] = useState(false);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const addEducation = () => {
    if (newEducation.trim() && !education.includes(newEducation.trim())) {
      setEducation([...education, newEducation.trim()]);
      setNewEducation("");
    }
  };

  const removeEducation = (item: string) => {
    setEducation(education.filter((entry) => entry !== item));
  };

  const addCertification = () => {
    if (
      newCertification.trim() &&
      !certifications.includes(newCertification.trim())
    ) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (item: string) => {
    setCertifications(certifications.filter((entry) => entry !== item));
  };

  const updateAvailability = (
    day: keyof Availability,
    updates: Partial<AvailabilityDay>,
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...updates,
      },
    }));
  };

  const handleProfileImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("contentType", file.type);
      formData.append("visibility", "public");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to upload image.");
        console.error("Upload error:", data.error);
        return;
      }

      if (!data.success || !data.fileUrl) {
        toast.error("Invalid upload response.");
        return;
      }

      console.log("✅ Profile photo uploaded:", {
        fileUrl: data.fileUrl,
        filename: file.name,
      });

      setProfileImage(data.fileUrl);
      toast.success("Profile photo updated.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSave = () => {
    startSaving(async () => {
      const result = await updateTutorProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        bio: profile.bio,
        title: profile.title,
        experience: profile.experience,
        course: profile.course,
        hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : undefined,
        location: profile.location,
        timezone: profile.timezone,
        language: profile.language,
        skills,
        education,
        certifications,
        socialLinks,
        availability,
        preferences,
        avatar: profileImage,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully.");
      }
    });
  };

  const refreshSecurityStatus = async () => {
    try {
      const secData = await getAccountSecurityStatus();
      if (secData.success && secData.data) {
        setSecurityStatus(secData.data);
      }
    } catch {
      // background error handled quietly
    }
  };

  const handleSaveNotificationPreferences = async () => {
    setSavingNotificationPrefs(true);
    try {
      const res = await savePreferences({
        emailNotifications: preferences.emailNotifications,
        courseReminders: preferences.courseReminders,
        mentorshipAlerts: preferences.mentorshipAlerts,
        weeklyProgress: preferences.weeklyProgress,
      });
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success("Notification preferences saved successfully.");
      }
    } catch {
      toast.error("Failed to save notification preferences.");
    } finally {
      setSavingNotificationPrefs(false);
    }
  };

  const handleSavePrivacyPreferences = async () => {
    setSavingPrivacyPrefs(true);
    try {
      const res = await savePreferences({
        publicProfile: preferences.publicProfile,
        showProgress: preferences.showProgress,
        showAchievements: preferences.showAchievements,
      });
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success("Privacy preferences saved successfully.");
      }
    } catch {
      toast.error("Failed to save privacy preferences.");
    } finally {
      setSavingPrivacyPrefs(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      const [data, secData] = await Promise.all([
        getTutorProfileData(),
        getAccountSecurityStatus(),
      ]);
      if (!isMounted) return;

      if ("error" in data) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (secData.success && secData.data) {
        setSecurityStatus(secData.data);
      }

      setProfile({
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        email: data.profile.email,
        phone: data.profile.phone,
        bio: data.profile.bio,
        title: data.profile.title,
        experience: data.profile.experience,
        course: data.profile.course,
        hourlyRate: data.profile.hourlyRate
          ? String(data.profile.hourlyRate)
          : "",
        location: data.profile.location,
        timezone: data.profile.timezone,
        language: data.profile.language,
      });
      setSkills(data.profile.skills);
      setEducation(data.profile.education);
      setCertifications(data.profile.certifications);
      setProfileImage(data.profile.avatar);
      setSocialLinks(data.socialLinks);
      setAvailability(data.availability);
      setPreferences(data.preferences);
      if ("publicSlug" in data && data.publicSlug) {
        setPublicSlug(data.publicSlug);
      } else if ("tutorId" in data && data.tutorId) {
        setPublicSlug(data.tutorId);
      }
      setLoading(false);
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <ProfileLoading />;
  }

  const initials =
    [profile.firstName, profile.lastName]
      .filter(Boolean)
      .map((name) => name[0]?.toUpperCase())
      .join("") || "TU";

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                  Profile <span className="text-gradient">Management</span>
                </h1>
                <p className="text-sm sm:text-base md:text-xl text-gray-300">
                  Customize your tutor profile and settings
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 border-white/20 text-white hover:bg-white/10 bg-transparent justify-center group">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-blue group-hover:scale-110 transition-transform" />
                  Preview Profile
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white justify-center shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all">
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6 sm:space-y-8">
              <TabsList className="flex w-full overflow-x-auto justify-start sm:grid sm:grid-cols-6 bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-xl h-auto gap-1 no-scrollbar">
                <TabsTrigger
                  value="basic"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="professional"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Professional
                </TabsTrigger>
                <TabsTrigger
                  value="availability"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <NairaSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Social
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex-shrink-0 gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <User className="w-5 h-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Image */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={profileImage || fallbackAvatar} />
                            <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            disabled={uploadingImage}
                            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-gradient-to-r from-neon-blue to-neon-purple"
                            onClick={() =>
                              document.getElementById("profile-upload")?.click()
                            }>
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </Button>
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileImageChange}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            Profile Photo
                          </h3>
                          <p className="text-sm text-gray-300">
                            Upload a professional photo
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG or GIF. Max size 5MB
                          </p>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-white">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            value={profile.firstName}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                firstName: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-white">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            value={profile.lastName}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                lastName: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            disabled
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                phone: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-white">
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={profile.location}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                location: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-white">
                            Timezone
                          </Label>
                          <Input
                            id="timezone"
                            value={profile.timezone}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                timezone: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-white">
                            Language
                          </Label>
                          <Input
                            id="language"
                            value={profile.language}
                            onChange={(event) =>
                              setProfile((prev) => ({
                                ...prev,
                                language: event.target.value,
                              }))
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-white">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell students about yourself, your experience, and teaching style..."
                          className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder-gray-400"
                          value={profile.bio}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              bio: event.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-gray-400">
                          {profile.bio.length}/500 characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Professional Tab */}
              <TabsContent value="professional" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skills & Expertise */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Award className="w-5 h-5" />
                        Skills & Expertise
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge
                            key={skill}
                            className="gap-1 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border-neon-blue/30">
                            {skill}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addSkill()}
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                        <Button
                          onClick={addSkill}
                          size="sm"
                          className="bg-gradient-to-r from-neon-blue to-neon-purple">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Briefcase className="w-5 h-5" />
                        Professional Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Professional Title</Label>
                        <Input
                          value={profile.title}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              title: event.target.value,
                            }))
                          }
                          placeholder="e.g. Senior Full-Stack Developer"
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">
                          Years of Experience
                        </Label>
                        <Input
                          type="number"
                          value={profile.experience}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              experience: Number(event.target.value),
                            }))
                          }
                          min={0}
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Primary Focus</Label>
                        <Input
                          value={profile.course}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              course: event.target.value,
                            }))
                          }
                          placeholder="e.g. Full-Stack Web Development"
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-white">Education</Label>
                        <div className="flex flex-wrap gap-2">
                          {education.map((item) => (
                            <Badge
                              key={item}
                              className="gap-1 bg-white/10 text-white border-white/20">
                              {item}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                                onClick={() => removeEducation(item)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add education..."
                            value={newEducation}
                            onChange={(event) =>
                              setNewEducation(event.target.value)
                            }
                            onKeyPress={(event) =>
                              event.key === "Enter" && addEducation()
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                          <Button
                            onClick={addEducation}
                            size="sm"
                            className="bg-gradient-to-r from-neon-blue to-neon-purple">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-white">Certifications</Label>
                        <div className="flex flex-wrap gap-2">
                          {certifications.map((item) => (
                            <Badge
                              key={item}
                              className="gap-1 bg-white/10 text-white border-white/20">
                              {item}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                                onClick={() => removeCertification(item)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add certification..."
                            value={newCertification}
                            onChange={(event) =>
                              setNewCertification(event.target.value)
                            }
                            onKeyPress={(event) =>
                              event.key === "Enter" && addCertification()
                            }
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                          <Button
                            onClick={addCertification}
                            size="sm"
                            className="bg-gradient-to-r from-neon-blue to-neon-purple">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Clock className="w-5 h-5" />
                        Weekly Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={availability[day]?.enabled ?? false}
                              onCheckedChange={(checked) =>
                                updateAvailability(day, { enabled: checked })
                              }
                            />
                            <span className="font-medium capitalize text-white w-20">
                              {day}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={availability[day]?.start ?? "09:00"}
                              onChange={(event) =>
                                updateAvailability(day, {
                                  start: event.target.value,
                                })
                              }
                              className="w-32 bg-white/5 border-white/10 text-white"
                            />
                            <span className="text-gray-400">to</span>
                            <Input
                              type="time"
                              value={availability[day]?.end ?? "17:00"}
                              onChange={(event) =>
                                updateAvailability(day, {
                                  end: event.target.value,
                                })
                              }
                              className="w-32 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <NairaSign className="w-5 h-5" />
                        Mentorship Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">
                          Hourly Mentorship Rate (₦)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="5000"
                          value={profile.hourlyRate}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              hourlyRate: event.target.value,
                            }))
                          }
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-400">
                          This rate is used for 1-on-1 mentorship sessions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <BookOpen className="w-5 h-5" />
                        Course Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 opacity-60">
                        <Label className="text-white">
                          Default Course Price
                        </Label>
                        <Input
                          type="number"
                          placeholder="99"
                          disabled
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2 opacity-60">
                        <Label className="text-white">
                          Discount Percentage
                        </Label>
                        <Input
                          type="number"
                          placeholder="20"
                          disabled
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="flex items-center justify-between opacity-60">
                        <Label className="text-white">
                          Enable Dynamic Pricing
                        </Label>
                        <Switch disabled />
                      </div>
                      <p className="text-xs text-gray-400">
                        Course pricing presets are coming soon.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Globe className="w-5 h-5" />
                        Social Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            key: "website",
                            icon: LinkIcon,
                            label: "Website",
                            placeholder: "https://yourwebsite.com",
                          },
                          {
                            key: "linkedin",
                            icon: Linkedin,
                            label: "LinkedIn",
                            placeholder: "https://linkedin.com/in/username",
                          },
                          {
                            key: "twitter",
                            icon: Twitter,
                            label: "Twitter",
                            placeholder: "https://twitter.com/username",
                          },
                          {
                            key: "github",
                            icon: Github,
                            label: "GitHub",
                            placeholder: "https://github.com/username",
                          },
                          {
                            key: "youtube",
                            icon: Youtube,
                            label: "YouTube",
                            placeholder: "https://youtube.com/@username",
                          },
                          {
                            key: "instagram",
                            icon: Instagram,
                            label: "Instagram",
                            placeholder: "https://instagram.com/username",
                          },
                        ].map((social) => (
                          <div key={social.key} className="space-y-2">
                            <Label className="flex items-center gap-2 text-white">
                              <social.icon className="w-4 h-4" />
                              {social.label}
                            </Label>
                            <Input
                              placeholder={social.placeholder}
                              value={
                                socialLinks[
                                  social.key as keyof typeof socialLinks
                                ] || ""
                              }
                              onChange={(event) =>
                                setSocialLinks((prev) => ({
                                  ...prev,
                                  [social.key]: event.target.value,
                                }))
                              }
                              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Notifications Card */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Bell className="w-5 h-5 text-neon-blue" />
                        Notifications
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        Choose how and when PalmTechnIQ notifies you about student activity.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {[
                        {
                          key: "emailNotifications",
                          title: "Email Notifications",
                          desc: "Receive platform alerts and updates via email",
                        },
                        {
                          key: "courseReminders",
                          title: "New Student Enrollments",
                          desc: "Get notified immediately when students enroll in your courses",
                        },
                        {
                          key: "mentorshipAlerts",
                          title: "Mentorship Bookings",
                          desc: "Receive booking confirmations and reminder alerts",
                        },
                        {
                          key: "weeklyProgress",
                          title: "Weekly Performance Digest",
                          desc: "A weekly summary of course completions and student engagement",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <p className="font-medium text-white text-sm">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                          </div>
                          <Switch
                            checked={
                              Boolean(
                                preferences[
                                  item.key as keyof typeof preferences
                                ]
                              )
                            }
                            onCheckedChange={(checked) =>
                              setPreferences((prev) => ({
                                ...prev,
                                [item.key]: checked,
                              }))
                            }
                          />
                        </div>
                      ))}

                      <div className="pt-3 border-t border-white/10">
                        <Button
                          type="button"
                          onClick={handleSaveNotificationPreferences}
                          disabled={savingNotificationPrefs}
                          className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-medium transition-all"
                        >
                          {savingNotificationPrefs ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Saving Preferences...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2 text-neon-blue" />
                              Save Notification Preferences
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Privacy & Security Card */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Shield className="w-5 h-5 text-neon-purple" />
                        Privacy & Security
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        Control public profile visibility and manage login authentication methods.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Privacy Toggles */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <p className="font-medium text-white text-sm">
                              Public Profile Visibility
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Allow students and visitors to discover your instructor profile
                            </p>
                          </div>
                          <Switch
                            checked={preferences.publicProfile}
                            onCheckedChange={(checked) =>
                              setPreferences((prev) => ({
                                ...prev,
                                publicProfile: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <p className="font-medium text-white text-sm">
                              Show Teaching Stats & Experience
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Display years of experience and teaching milestones publicly
                            </p>
                          </div>
                          <Switch
                            checked={preferences.showProgress}
                            onCheckedChange={(checked) =>
                              setPreferences((prev) => ({
                                ...prev,
                                showProgress: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 py-1">
                          <div>
                            <p className="font-medium text-white text-sm">
                              Show Certifications & Badges
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Showcase verified certificates and achievements on your page
                            </p>
                          </div>
                          <Switch
                            checked={preferences.showAchievements}
                            onCheckedChange={(checked) =>
                              setPreferences((prev) => ({
                                ...prev,
                                showAchievements: checked,
                              }))
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleSavePrivacyPreferences}
                          disabled={savingPrivacyPrefs}
                          className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-medium transition-all"
                        >
                          {savingPrivacyPrefs ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Saving Privacy Settings...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2 text-neon-purple" />
                              Save Privacy Settings
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Security Divider */}
                      <div className="border-t border-white/10 pt-4 space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Account Authentication & Protection
                        </div>

                        {/* Two-Factor Authentication Item */}
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white text-sm">
                                Two-Factor Authentication (2FA)
                              </p>
                              {securityStatus.twoFactorEnabled ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] gap-1 py-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {securityStatus.twoFactorMethod === "EMAIL"
                                    ? "Email OTP"
                                    : "Authenticator App"}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-white/15 text-gray-400 text-[11px] py-0.5"
                                >
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              Support for Google Authenticator and secure Email verification codes.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant={securityStatus.twoFactorEnabled ? "outline" : "default"}
                            size="sm"
                            onClick={() => setTwoFactorDialogOpen(true)}
                            className={
                              securityStatus.twoFactorEnabled
                                ? "border-white/20 text-white hover:bg-white/10 bg-transparent shrink-0"
                                : "bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white shrink-0 font-medium"
                            }
                          >
                            {securityStatus.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                          </Button>
                        </div>

                        {/* Change Password Item */}
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium text-white text-sm">
                              Account Password
                            </p>
                            <p className="text-xs text-gray-400">
                              {securityStatus.hasPassword
                                ? "Update your current password to keep your account safe."
                                : "You currently sign in via Google. Set a password for direct login."}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordDialogOpen(true)}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent shrink-0"
                          >
                            {securityStatus.hasPassword ? "Change Password" : "Set Password"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        hasPassword={securityStatus.hasPassword}
        onSuccess={refreshSecurityStatus}
      />

      {/* Two-Factor Authentication Dialog */}
      <TwoFactorDialog
        open={twoFactorDialogOpen}
        onOpenChange={setTwoFactorDialogOpen}
        enabled={securityStatus.twoFactorEnabled}
        currentMethod={securityStatus.twoFactorMethod}
        userEmail={securityStatus.email || profile.email}
        onStatusChange={(enabled, method) => {
          setSecurityStatus((prev) => ({
            ...prev,
            twoFactorEnabled: enabled,
            twoFactorMethod: method,
          }));
        }}
      />

      {/* Profile Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#070b14]/95 border-white/15 text-white backdrop-blur-xl p-0 sm:rounded-2xl no-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>Tutor Profile Preview</DialogTitle>
            <DialogDescription>Preview how your profile appears to students and visitors.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            {/* Header Banner */}
            <div className="h-28 sm:h-36 bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-pink/30 relative overflow-hidden flex items-end p-4 sm:p-6">
              <div className="absolute inset-0 cyber-grid opacity-30" />
              <div className="absolute top-3 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-neon-blue border border-white/10">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Draft Preview</span>
              </div>
            </div>

            {/* Profile Header Info */}
            <div className="px-4 sm:px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-6">
                <div className="flex items-end gap-3 sm:gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-[#070b14] shadow-2xl bg-[#0d121f]">
                      <AvatarImage src={profileImage || fallbackAvatar} alt="Tutor Avatar" />
                      <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-lg sm:text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#070b14]" title="Online / Active" />
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-2xl font-bold text-white">
                        {profile.firstName || profile.lastName
                          ? `${profile.firstName} ${profile.lastName}`.trim()
                          : "Your Name"}
                      </h2>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-neon-blue shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm text-neon-cyan font-medium">
                      {profile.title || "PalmTechnIQ Tutor / Instructor"}
                    </p>
                    {profile.course && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Specializes in <span className="text-gray-200">{profile.course}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const url = `/tutors/${publicSlug || "me"}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="gap-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs sm:text-sm h-9 shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all">
                    <ExternalLink className="w-4 h-4" />
                    Open Public Page
                  </Button>
                </div>
              </div>

              {/* Quick Key Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Hourly Rate</span>
                  <span className="text-sm sm:text-base font-bold text-white flex items-center gap-0.5 mt-0.5">
                    <NairaSign className="w-3.5 h-3.5 text-neon-green" />
                    {profile.hourlyRate ? Number(profile.hourlyRate).toLocaleString() : "0"}
                    <span className="text-xs font-normal text-gray-400">/hr</span>
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Experience</span>
                  <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">
                    {profile.experience ? `${profile.experience} yrs` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Location</span>
                  <span className="text-xs sm:text-sm font-medium text-white truncate mt-0.5 block">
                    {profile.location || "Remote / Global"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase tracking-wider">Language</span>
                  <span className="text-xs sm:text-sm font-medium text-white truncate mt-0.5 block">
                    {profile.language || "English"}
                  </span>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">About Me</h4>
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {profile.bio || "No bio added yet. Write a compelling summary to attract students."}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">Skills & Focus Areas</h4>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-neon-blue/10 border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 text-xs px-2.5 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No skills added yet.</p>
                )}
              </div>

              {/* Education & Certifications */}
              {(education.length > 0 || certifications.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {education.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <h5 className="text-xs uppercase tracking-wider font-semibold text-gray-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-neon-purple" />
                        Education
                      </h5>
                      <ul className="space-y-1 text-xs text-gray-300">
                        {education.map((item, idx) => (
                          <li key={idx} className="truncate">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {certifications.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <h5 className="text-xs uppercase tracking-wider font-semibold text-gray-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-neon-yellow" />
                        Certifications
                      </h5>
                      <ul className="space-y-1 text-xs text-gray-300">
                        {certifications.map((item, idx) => (
                          <li key={idx} className="truncate">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {Object.values(socialLinks).some(Boolean) && (
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">Connect</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Globe className="w-3.5 h-3.5 text-neon-blue" />
                        Website
                      </a>
                    )}
                    {socialLinks.github && (
                      <a
                        href={socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Github className="w-3.5 h-3.5 text-gray-200" />
                        GitHub
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                        LinkedIn
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Twitter className="w-3.5 h-3.5 text-cyan-400" />
                        Twitter / X
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        YouTube
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 mt-6">
                <p className="text-xs text-gray-400 text-center sm:text-left">
                  This preview reflects your current inputs. Changes must be saved to update your live public profile.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewOpen(false)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm border-white/20 text-white hover:bg-white/10 bg-transparent">
                    Close Preview
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const url = `/tutors/${publicSlug || "me"}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Live Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
