"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  Star,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateRandomAvatar } from "@/lib/utils";

// AI Recommendations Widget
export function AIRecommendations() {
  const [recommendations] = useState([
    {
      id: 1,
      title: "Advanced React Patterns",
      instructor: "Sarah Chen",
      thumbnail: "/placeholder.svg?height=120&width=200",
      price: 79,
      rating: 4.9,
      students: 3240,
      duration: "12 hours",
      reason: "Based on your React course completion",
      confidence: 95,
      salaryIncrease: "45%",
    },
    {
      id: 2,
      title: "Node.js Backend Mastery",
      instructor: "Mike Johnson",
      thumbnail: "/placeholder.svg?height=120&width=200",
      price: 89,
      rating: 4.8,
      students: 5670,
      duration: "18 hours",
      reason: "Perfect next step for full-stack development",
      confidence: 88,
      salaryIncrease: "50%",
    },
    {
      id: 3,
      title: "System Design Interview Prep",
      instructor: "Alex Kim",
      thumbnail: "/placeholder.svg?height=120&width=200",
      price: 129,
      rating: 4.9,
      students: 2180,
      duration: "25 hours",
      reason: "High-demand skill for senior roles",
      confidence: 92,
      salaryIncrease: "60%",
    },
  ]);

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-neon-blue mr-3" />
            <h2 className="text-4xl font-bold">
              <span className="text-gradient">AI-Powered</span>{" "}
              <span className="text-white">Recommendations</span>
            </h2>
          </div>
          <p className="text-xl text-gray-300">
            Personalized course suggestions based on your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recommendations.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group">
              <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                {/* AI Confidence Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-neon-blue to-neon-purple text-white border-none">
                    <Brain className="w-3 h-3 mr-1" />
                    {course.confidence}% match
                  </Badge>
                </div>

                <div className="relative">
                  <img
                    src={course.thumbnail || generateRandomAvatar()}
                    alt={course.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gradient transition-all duration-300">
                    {course.title}
                  </h3>

                  <div className="flex items-center mb-3">
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {course.instructor.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-300 text-sm">
                      {course.instructor}
                    </span>
                  </div>

                  {/* AI Reason */}
                  <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center mb-1">
                      <Target className="w-4 h-4 text-neon-blue mr-2" />
                      <span className="text-neon-blue text-sm font-semibold">
                        Why this course?
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs">{course.reason}</p>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      {course.rating}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.students.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration}
                    </div>
                  </div>

                  {/* Salary Impact */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 text-sm font-semibold">
                        Potential Impact:
                      </span>
                      <span className="text-green-400 font-bold">
                        +{course.salaryIncrease} salary
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gradient">
                      ₦{course.price}
                    </span>
                    <Button className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                      Enroll Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Learning Path Recommendations
export function LearningPathRecommendations() {
  const paths = [
    {
      id: 1,
      title: "Full-Stack Developer Path",
      description: "Complete journey from frontend to backend mastery",
      courses: 6,
      duration: "8 months",
      difficulty: "Beginner to Advanced",
      salaryRange: "₦70k - ₦120k",
      icon: Zap,
      color: "from-blue-500 to-cyan-400",
      completion: 33,
    },
    {
      id: 2,
      title: "AI/ML Engineer Path",
      description: "Master artificial intelligence and machine learning",
      courses: 8,
      duration: "10 months",
      difficulty: "Intermediate to Expert",
      salaryRange: "₦90k - ₦150k",
      icon: Brain,
      color: "from-purple-500 to-pink-400",
      completion: 0,
    },
    {
      id: 3,
      title: "DevOps Specialist Path",
      description: "Learn cloud infrastructure and deployment automation",
      courses: 5,
      duration: "6 months",
      difficulty: "Intermediate",
      salaryRange: "₦80k - ₦130k",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-400",
      completion: 0,
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-neon-blue/5 via-transparent to-neon-purple/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-white">Recommended</span>{" "}
            <span className="text-gradient">Learning Paths</span>
          </h2>
          <p className="text-xl text-gray-300">
            Structured journeys to your dream career
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {paths.map((path, index) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="group">
              <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                <CardHeader className="pb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ₦{path.color} p-4 mb-4`}>
                    <path.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-gradient transition-all duration-300">
                    {path.title}
                  </h3>
                  <p className="text-gray-400">{path.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Courses:</span>
                      <span className="text-white">{path.courses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{path.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Level:</span>
                      <span className="text-white">{path.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Salary Range:</span>
                      <span className="text-green-400 font-semibold">
                        {path.salaryRange}
                      </span>
                    </div>
                  </div>

                  {path.completion > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-neon-blue">
                          {path.completion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ₦{path.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `₦{path.completion}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className={`w-full bg-gradient-to-r ₦{path.color} hover:opacity-80 text-white`}
                    disabled={path.completion > 0}>
                    {path.completion > 0 ? "Continue Path" : "Start Path"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
