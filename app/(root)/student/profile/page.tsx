"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  studentProfileNotificationSettings,
  studentProfilePrivacySettings,
} from "@/lib/feature-settings-config";
import { generateRandomAvatar } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Camera,
  Clock,
  Edit,
  FlameIcon as Fire,
  Loader2,
  MapPin,
  Shield,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getStudentProgressData } from "@/data/studentprogress";
import {
  addStudentGoal,
  getStudentProfileData,
  updateStudentAvatar,
  updateStudentProfile,
} from "@/actions/student-profile";
import { updateUserPreferences } from "@/actions/user-preferences";
import {
  defaultUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    dateOfBirth: "",
    timezone: "Africa/Lagos",
    language: "English",
    occupation: "",
    company: "",
    website: "",
    github: "",
    linkedin: "",
    joinDate: "",
    avatar: "",
  });

  const [preferences, setPreferences] = useState<UserPreferences>(
    defaultUserPreferences
  );

  const [studentStats, setStudentStats] = useState({
    level: 0,
    xp: 0,
    xpToNext: 0,
    streak: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    totalHours: 0,
    achievements: 0,
    rank: "",
    averageScore: 0,
  });

  const [achievements, setAchievements] = useState<
    {
      id: string;
      title: string;
      description: string;
      icon: string;
      color: string;
      earned: string;
      rarity: string;
    }[]
  >([]);

  const [learningGoals, setLearningGoals] = useState<
    {
      id: string;
      title: string;
      progress: number;
      target: string;
      status: string;
    }[]
  >([]);

  const achievementIconMap = useMemo(
    () => ({
      Zap,
      Brain,
      Trophy,
      BookOpen,
      Star,
      Fire,
    }),
    []
  );

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [profileResult, progressResult] = await Promise.all([
        getStudentProfileData(),
        getStudentProgressData(),
      ]);

      if ("error" in profileResult) {
        const message = profileResult.error || "Unable to load profile.";
        setLoadError(message);
        toast.error(message);
        return;
      }

      setProfileData({
        ...profileResult.profile,
      });
      setPreferences(profileResult.preferences);
      const goals = profileResult.goals;
      setLearningGoals(
        goals.map((goal) => ({
          id: goal,
          title: goal,
          progress: 0,
          target: "Set a target date",
          status: "Planned",
        }))
      );
      setStudentStats((prev) => ({
        ...prev,
        rank: profileResult.rank || prev.rank,
        streak: profileResult.streak || prev.streak,
      }));

      setStudentStats((prev) => ({
        ...prev,
        level: progressResult.stats.level,
        xp: progressResult.stats.xp,
        xpToNext: progressResult.stats.xpToNext,
        coursesCompleted: progressResult.stats.coursesCompleted,
        coursesInProgress: progressResult.stats.coursesInProgress,
        totalHours: progressResult.stats.totalHours,
        achievements: progressResult.achievements.length,
        averageScore: progressResult.stats.averageScore,
        streak: progressResult.learningStreak.current,
        rank: progressResult.stats.rank,
      }));

      setAchievements(
        progressResult.achievements.map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          color: achievement.color,
          earned: achievement.unlockedAt,
          rarity: achievement.rarity,
        }))
      );
    } catch (error) {
      console.error("Failed to load student profile:", error);
      setLoadError("Failed to load profile data.");
      toast.error("Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    const result = await updateStudentProfile({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      location: profileData.location,
      bio: profileData.bio,
      dateOfBirth: profileData.dateOfBirth,
      timezone: profileData.timezone,
      language: profileData.language,
      occupation: profileData.occupation,
      company: profileData.company,
      website: profileData.website,
      github: profileData.github,
      linkedin: profileData.linkedin,
    });

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile updated");
    setIsEditing(false);
  };

  const handleAddGoal = () => {
    setGoalTitle("");
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async () => {
    const trimmedGoal = goalTitle.trim();
    if (!trimmedGoal) {
      toast.error("Please enter a goal.");
      return;
    }

    const result = await addStudentGoal(trimmedGoal);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (!("goals" in result)) return;
    const goals = result.goals ?? [];
    setLearningGoals(
      goals.map((goal) => ({
        id: goal,
        title: goal,
        progress: 0,
        target: "Set a target date",
        status: "Planned",
      }))
    );
    setGoalModalOpen(false);
  };

  const handlePreferenceChange = async (
    key: keyof UserPreferences,
    checked: boolean
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));
    const result = await updateUserPreferences({ [key]: checked });
    if ("error" in result && result.error) {
      toast.error(result.error);
      setPreferences((prev) => ({ ...prev, [key]: !checked }));
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      event.target.value = "";
      return;
    }

    setIsAvatarUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          visibility: "public",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to start upload.");
        return;
      }

      const uploadUrl = data.url;
      const fields = data.fields;
      const fileUrl = `${data.url}${data.fields.key}`;

      if (!uploadUrl || !fields) {
        toast.error("Invalid upload response.");
        return;
      }

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value as string)
      );
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        toast.error("Failed to upload image.");
        return;
      }

      const result = await updateStudentAvatar(fileUrl);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setProfileData((prev) => ({ ...prev, avatar: result.avatar }));
      toast.success("Profile image updated.");
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <motion.div whileHover={{ scale: 1.05 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold text-white mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-300 mt-1">{subtitle}</p>
              )}
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} p-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <section className="pt-32 pb-8">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="glass-card border-white/10">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <div className="flex-1 space-y-3 w-full">
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex flex-wrap gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="glass-card border-white/10">
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-white font-semibold">Unable to load profile</p>
            <p className="text-sm text-gray-400">{loadError}</p>
            <Button
              onClick={() => void loadProfile()}
              className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl"
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
            className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">My</span>{" "}
              <span className="text-gradient">Profile</span>
            </h1>
            <p className="text-xl text-gray-300">
              Manage your account and learning preferences
            </p>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-12">
            <Card className="glass-card border-white/10">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage
                        src={profileData.avatar || generateRandomAvatar()}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-2xl">
                        {profileData.firstName[0]}
                        {profileData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      type="button"
                      disabled={isAvatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple">
                      {isAvatarUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {profileData.firstName} {profileData.lastName}
                    </h2>
                    <p className="text-gray-300 mb-4">{profileData.bio}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profileData.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {profileData.joinDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span>{studentStats.rank || "Student"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={BookOpen}
              title="Courses Completed"
              value={studentStats.coursesCompleted}
              subtitle={`${studentStats.coursesInProgress} in progress`}
              color="from-neon-blue to-cyan-400"
            />
            <StatCard
              icon={Clock}
              title="Learning Hours"
              value={`${studentStats.totalHours}h`}
              subtitle="This month: 24h"
              color="from-neon-green to-emerald-400"
            />
            <StatCard
              icon={Trophy}
              title="Achievements"
              value={studentStats.achievements}
              subtitle="3 this week"
              color="from-neon-orange to-yellow-400"
            />
            <StatCard
              icon={Fire}
              title="Current Streak"
              value={`${studentStats.streak} days`}
              subtitle="Personal best: 12"
              color="from-neon-purple to-pink-400"
            />
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-foreground bg-white/10 border border-white/20 mb-8">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-blue data-[state=active]:to-neon-purple data-[state=active]:text-white">
                Personal Info
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green data-[state=active]:to-emerald-400 data-[state=active]:text-white">
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="goals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-orange data-[state=active]:to-yellow-400 data-[state=active]:text-white">
                Learning Goals
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple data-[state=active]:to-pink-400 data-[state=active]:text-white">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-8">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        disabled
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                      <p className="text-xs text-gray-500">
                        Email changes are managed by support for security.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-white">
                        Occupation
                      </Label>
                      <Input
                        id="occupation"
                        value={profileData.occupation}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            occupation: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>
                  {isEditing && (
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-8">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">
                    Achievements & Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((achievement, index) => {
                      const Icon =
                        achievementIconMap[
                          achievement.icon as keyof typeof achievementIconMap
                        ] || Trophy;
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4 mb-4">
                            <div
                              className={`w-16 h-16 rounded-full bg-gradient-to-r ${achievement.color} flex items-center justify-center`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-semibold">
                                {achievement.title}
                              </h4>
                              <Badge
                                className={`text-xs mt-1 ${
                                  achievement.rarity === "Legendary"
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                    : achievement.rarity === "Epic"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    : achievement.rarity === "Rare"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : achievement.rarity === "Uncommon"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                }`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Earned {achievement.earned}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-8">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-white">
                      Learning Goals
                    </CardTitle>
                    <Button
                      onClick={handleAddGoal}
                      className="bg-gradient-to-r from-neon-orange to-yellow-400 text-white">
                      <Target className="w-4 h-4 mr-2" />
                      Add Goal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {learningGoals.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No learning goals yet.
                    </div>
                  ) : (
                    learningGoals.map((goal, index) => (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="p-6 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-semibold text-lg">
                            {goal.title}
                          </h4>
                          <Badge
                            className={`${
                              goal.status === "In Progress"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : goal.status === "Started"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }`}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-neon-orange to-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{goal.target}</p>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {studentProfileNotificationSettings.map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between">
                        <Label htmlFor={setting.key} className="text-white">
                          {setting.label}
                        </Label>
                        <Switch
                          id={setting.key}
                          checked={
                            preferences[setting.key as keyof UserPreferences]
                          }
                          onCheckedChange={(checked) =>
                            handlePreferenceChange(
                              setting.key as keyof UserPreferences,
                              checked
                            )
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {studentProfilePrivacySettings.map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between">
                        <Label htmlFor={setting.key} className="text-white">
                          {setting.label}
                        </Label>
                        <Switch
                          id={setting.key}
                          checked={
                            preferences[setting.key as keyof UserPreferences]
                          }
                          onCheckedChange={(checked) =>
                            handlePreferenceChange(
                              setting.key as keyof UserPreferences,
                              checked
                            )
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-white">
                        Timezone
                      </Label>
                      <Select
                        value={profileData.timezone}
                        onValueChange={(value) =>
                          setProfileData({ ...profileData, timezone: value })
                        }
                        disabled={!isEditing}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-white">
                        Language
                      </Label>
                      <Select
                        value={profileData.language}
                        onValueChange={(value) =>
                          setProfileData({ ...profileData, language: value })
                        }
                        disabled={!isEditing}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="bg-dark-900/95 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add a learning goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle" className="text-white">
                Goal title
              </Label>
              <Input
                id="goalTitle"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Finish React Advanced course"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400">
              You can add details later from your learning goals list.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGoalModalOpen(false)}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSaveGoal}
              className="bg-gradient-to-r from-neon-orange to-yellow-400 text-white">
              Save Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
