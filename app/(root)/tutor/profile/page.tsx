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
  DollarSign,
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
} from "lucide-react";
import { generateRandomAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { defaultUserPreferences } from "@/lib/user-preferences";
import {
  getTutorProfileData,
  type TutorAvailability,
  type TutorAvailabilityDay,
  updateTutorProfile,
} from "../../../../actions/tutor-profile";
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
    updates: Partial<AvailabilityDay>
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
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.error || "Upload initialization failed.");
        return;
      }

      const uploadUrl = data.url;
      const fields = data.fields;
      const fileUrl = `${uploadUrl}${fields.key}`;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value as string)
      );
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        setProfileImage(fileUrl);
        toast.success("Profile photo updated.");
      } else {
        toast.error("Upload failed.");
      }
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
        hourlyRate: profile.hourlyRate
          ? Number(profile.hourlyRate)
          : undefined,
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

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      const data = await getTutorProfileData();
      if (!isMounted) return;

      if ("error" in data) {
        toast.error(data.error);
        setLoading(false);
        return;
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

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Profile <span className="text-gradient">Management</span>
                </h1>
                <p className="text-xl text-gray-300">
                  Customize your tutor profile and settings
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Eye className="w-4 h-4" />
                  Preview Profile
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className="gap-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-8">
              <TabsList className="grid w-full grid-cols-6 bg-white/5 backdrop-blur-sm border border-white/10">
                <TabsTrigger
                  value="basic"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <User className="w-4 h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="professional"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Briefcase className="w-4 h-4" />
                  Professional
                </TabsTrigger>
                <TabsTrigger
                  value="availability"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Clock className="w-4 h-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Globe className="w-4 h-4" />
                  Social
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Shield className="w-4 h-4" />
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
                      <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-2 gap-4">
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
                        <DollarSign className="w-5 h-5" />
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
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Bell className="w-5 h-5" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          key: "emailNotifications",
                          title: "Email Notifications",
                          desc: "Receive updates via email",
                        },
                        {
                          key: "courseReminders",
                          title: "New Student Enrollments",
                          desc: "Get notified of new enrollments",
                        },
                        {
                          key: "mentorshipAlerts",
                          title: "Mentorship Bookings",
                          desc: "Session booking notifications",
                        },
                        {
                          key: "weeklyProgress",
                          title: "Weekly Reports",
                          desc: "Performance summaries",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-300">{item.desc}</p>
                          </div>
                          <Switch
                            checked={
                              preferences[
                                item.key as keyof typeof preferences
                              ] || false
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
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Shield className="w-5 h-5" />
                        Privacy & Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            Profile Visibility
                          </p>
                          <p className="text-sm text-gray-300">
                            Show profile to students
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            Show Progress
                          </p>
                          <p className="text-sm text-gray-300">
                            Display progress stats on your profile
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            Show Achievements
                          </p>
                          <p className="text-sm text-gray-300">
                            Display badges and milestones
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-300">
                            Extra security for your account
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                          Enable
                        </Button>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                        Change Password
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
