"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { generateRandomAvatar } from "@/lib/utils";
import { NairaSign } from "@/components/shared/naira-sign-icon";

interface Course {
  id: string | number;
  title: string;
  students: number;
  rating: number;
  earnings: number;
  status: string;
  thumbnail?: string | null;
  lastUpdated: string;
}

export function TutorDashboardCourses({ courses }: { courses: Course[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}>
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">My Courses</h3>
            <Link href="/tutor/courses/create">
              <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer">
              <Image
                src={course.thumbnail || generateRandomAvatar()}
                alt={course.title}
                width={80}
                height={60}
                className="w-20 h-14 object-cover rounded-lg"
              />
              <div className="flex-1">
                <Link href={`/tutor/courses/${course.id}/edit`}>
                  <h4 className="text-white font-semibold group-hover:text-gradient transition-colors">
                    {course.title}
                  </h4>
                </Link>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.students.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400" />
                    {course.rating}
                  </div>
                  <div className="flex items-center">
                    <NairaSign className="w-4 h-4 mr-1 text-green-400" />₦
                    {course.earnings.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  className={`${
                    course.status === "active"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}>
                  {course.status}
                </Badge>
                <p className="text-gray-400 text-xs mt-1">
                  Updated {course.lastUpdated}
                </p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
