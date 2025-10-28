"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Trophy,
  Clock,
  Star,
  BarChart3,
  Activity,
  Zap,
  FlameIcon as Fire,
  Brain,
  CheckCircle,
  PlayCircle,
  Users,
  Target,
} from "lucide-react";
import { generateRandomAvatar } from "@/lib/utils";

// In StudentProgressClient.tsx
interface CourseProgress {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar?: string | null;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  timeSpent: number;
  lastAccessed: string;
  nextLesson: string;
  thumbnail?: string | null;
  difficulty: string;
  rating: number;
  category: string;
  enrollmentId: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  rarity: string;
  progress?: number;
  maxProgress?: number;
}

interface LearningStreak {
  current: number;
  longest: number;
  thisWeek: number[];
}

interface StudentProgressClientProps {
  user: {
    name: string;
    avatar?: string | null;
    rank: string;
    level: number;
    xp: number;
    xpToNext: number;
  };
  stats: {
    totalHours: number;
    coursesCompleted: number;
    coursesInProgress: number;
    averageScore: number;
    rank: string;
    level: number;
    xp: number;
    xpToNext: number;
  };
  coursesProgress: CourseProgress[];
  achievements: Achievement[];
  learningStreak: LearningStreak;
  weeklyActivity: { [key: string]: number };
}

export default function StudentProgressClient({
  user,
  stats,
  coursesProgress,
  achievements,
  learningStreak,
  weeklyActivity
}: StudentProgressClientProps) {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "text-green-400 border-green-400";
      case "INTERMEDIATE":
        return "text-yellow-400 border-yellow-400";
      case "ADVANCED":
        return "text-red-400 border-red-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-400 border-gray-400";
      case "Uncommon":
        return "text-green-400 border-green-400";
      case "Rare":
        return "text-blue-400 border-blue-400";
      case "Epic":
        return "text-purple-400 border-purple-400";
      case "Legendary":
        return "text-orange-400 border-orange-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      "⚡": Zap,
      "🧠": Brain,
      "🏆": Trophy,
      "🎯": Target,
    };
    return iconMap[iconName] || Trophy;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"
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
              <span className="text-white">Learning</span>{" "}
              <span className="text-gradient">Progress</span>
            </h1>
            <p className="text-xl text-gray-300">
              Track your journey to mastery, {user.name}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={Clock}
              title="Total Hours"
              value={`${stats.totalHours}h`}
              subtitle="Lifetime learning"
              color="from-neon-blue to-cyan-400"
            />
            <StatCard
              icon={BookOpen}
              title="Courses"
              value={stats.coursesCompleted}
              subtitle={`${stats.coursesInProgress} in progress`}
              color="from-neon-green to-emerald-400"
            />
            <StatCard
              icon={Trophy}
              title="Average Score"
              value={`${stats.averageScore}%`}
              subtitle="Quiz performance"
              color="from-neon-orange to-yellow-400"
            />
            <StatCard
              icon={Fire}
              title="Current Streak"
              value={`${learningStreak.current} days`}
              subtitle={`Best: ${learningStreak.longest} days`}
              color="from-neon-purple to-pink-400"
            />
          </div>

          {/* Learning Streak */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-12">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <Fire className="w-8 h-8 text-orange-400" />
                  Learning Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold text-gradient mb-2">
                        {learningStreak.current}
                      </div>
                      <p className="text-gray-300">Days in a row</p>
                    </div>
                    <div className="flex justify-center gap-2">
                      {weekDays.map((day, index) => (
                        <div key={day} className="text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                              learningStreak.thisWeek[index]
                                ? "bg-gradient-to-r from-neon-orange to-yellow-400 text-white"
                                : "bg-white/10 text-gray-400"
                            }`}>
                            {learningStreak.thisWeek[index] ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <div className="w-2 h-2 bg-current rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{day}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-orange-500/20 to-yellow-400/20 rounded-lg border border-orange-500/30">
                      <h4 className="text-orange-400 font-semibold mb-2">
                        {learningStreak.current > 0 ? "Keep it up!" : "Start your streak!"}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {learningStreak.current > 0 
                          ? `You're on a ${learningStreak.current}-day streak! Complete a lesson today to keep it going.`
                          : "Complete a lesson today to start your learning streak!"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-white">
                          {learningStreak.longest}
                        </p>
                        <p className="text-sm text-gray-400">Longest Streak</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-white">
                          {learningStreak.thisWeek.reduce((a, b) => a + b, 0)}
                        </p>
                        <p className="text-sm text-gray-400">This Week</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Tabs */}
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-foreground bg-white/10 border border-white/20 mb-8">
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-blue data-[state=active]:to-neon-purple data-[state=active]:text-white">
                Course Progress ({coursesProgress.length})
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-green data-[state=active]:to-emerald-400 data-[state=active]:text-white">
                Achievements ({achievements.length})
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-orange data-[state=active]:to-yellow-400 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              {coursesProgress.length === 0 ? (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
                    <p className="text-gray-400 mb-6">Enroll in courses to start tracking your progress</p>
                    <Button className="bg-gradient-to-r from-neon-blue to-neon-purple" asChild>
                      <a href="/courses">Browse Courses</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {coursesProgress.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}>
                      <Card className="glass-card border-white/10 hover-glow group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <img
                              src={course.thumbnail || generateRandomAvatar()}
                              alt={course.title}
                              className="w-16 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {course.instructor}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getDifficultyColor(
                                    course.difficulty
                                  )}`}>
                                  {course.difficulty}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-400">
                                    {course.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-white">
                                  {course.progress}%
                                </span>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Lessons</p>
                                <p className="text-white font-medium">
                                  {course.completedLessons}/{course.totalLessons}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Time Spent</p>
                                <p className="text-white font-medium">
                                  {course.timeSpent}h
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <p className="text-sm text-gray-400 mb-2">
                                Next Lesson:
                              </p>
                              <p className="text-white font-medium text-sm truncate">
                                {course.nextLesson}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Last accessed {course.lastAccessed}
                              </p>
                            </div>

                            <Button 
                              className="w-full bg-gradient-to-r from-neon-blue to-neon-purple group-hover:scale-105 transition-transform"
                              asChild
                            >
                              <a href={`/courses/${course.id}/learn`}>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                {course.progress === 100 ? "Review Course" : "Continue Learning"}
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              {achievements.length === 0 ? (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No achievements yet</h3>
                    <p className="text-gray-400">Complete courses and lessons to earn achievements</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement, index) => {
                    const IconComponent = getIconComponent(achievement.icon);
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}>
                        <Card
                          className={`glass-card border-white/10 hover-glow ${
                            achievement.unlockedAt !== "Not unlocked yet" ? "opacity-100" : "opacity-60"
                          }`}>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div
                                className={`w-16 h-16 rounded-full bg-gradient-to-r ${achievement.color} flex items-center justify-center`}>
                                {IconComponent ? (
                                  <IconComponent className="w-8 h-8 text-white" />
                                ) : (
                                  <span className="text-2xl">{achievement.icon}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-semibold">
                                  {achievement.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs mt-1 ${getRarityColor(
                                    achievement.rarity
                                  )}`}>
                                  {achievement.rarity}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-gray-300 text-sm mb-4">
                              {achievement.description}
                            </p>

                            {achievement.progress !== undefined &&
                              achievement.maxProgress && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="text-white">
                                      {achievement.progress}/
                                      {achievement.maxProgress}
                                    </span>
                                  </div>
                                  <Progress
                                    value={
                                      (achievement.progress /
                                        achievement.maxProgress) *
                                      100
                                    }
                                    className="h-2"
                                  />
                                </div>
                              )}

                            <p className="text-gray-400 text-xs">
                              {achievement.unlockedAt}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Learning Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                          <div className="text-2xl font-bold text-neon-blue mb-1">
                            {stats.level}
                          </div>
                          <div className="text-sm text-gray-400">
                            Current Level
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-lg">
                          <div className="text-2xl font-bold text-neon-green mb-1">
                            {stats.xp}
                          </div>
                          <div className="text-sm text-gray-400">Total XP</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">
                            XP to Next Level
                          </span>
                          <span className="text-white">
                            {stats.xp}/{stats.xpToNext}
                          </span>
                        </div>
                        <Progress
                          value={(stats.xp / stats.xpToNext) * 100}
                          className="h-3"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            Study Time This Week
                          </span>
                          <span className="text-white font-semibold">
                            {Object.values(weeklyActivity).reduce((a, b) => a + b, 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            Lessons Completed
                          </span>
                          <span className="text-white font-semibold">
                            {coursesProgress.reduce((sum, course) => sum + course.completedLessons, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Quiz Average</span>
                          <span className="text-white font-semibold">
                            {stats.averageScore}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Current Rank</span>
                          <Badge className="bg-gradient-to-r from-neon-purple to-pink-400 text-white">
                            {stats.rank}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Weekly Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                          <div key={day} className="text-center">
                            <div className="text-xs text-gray-400 mb-2">
                              {day}
                            </div>
                            <div
                              className={`h-20 rounded-lg flex items-end justify-center p-2 ${
                                weeklyActivity[day] > 0
                                  ? "bg-gradient-to-t from-neon-blue to-neon-purple"
                                  : "bg-white/10"
                              }`}>
                              <div className="text-xs text-white font-medium">
                                {weeklyActivity[day] > 0
                                  ? `${weeklyActivity[day].toFixed(1)}h`
                                  : "0h"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-white font-semibold mb-3">
                          Recent Milestones
                        </h4>
                        <div className="space-y-2">
                          {achievements.slice(0, 3).map((achievement) => (
                            <div key={achievement.id} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-gray-300 flex-1">
                                {achievement.title}
                              </span>
                              <span className="text-xs text-gray-500">
                                {achievement.unlockedAt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}