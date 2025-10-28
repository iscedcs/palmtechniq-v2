"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MessageSquare,
  CalendarIcon,
} from "lucide-react";
import { useState } from "react";
// import { useRouter } from "next/router";


interface MentorshipSidebarProps {
  userId: string;
}

export function MentorshipSidebar({ userId }: MentorshipSidebarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
//    const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                //  onClick={() => router.push(`/mentorship`)}
                >
              <Plus className="w-4 h-4 mr-2" />
              Book New Session
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse All Mentors
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message History
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mentor Recommendations */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-gradient-to-r from-neon-green to-emerald-400 text-white text-sm">
                    RJ
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">
                    Robert Johnson
                  </h4>
                  <p className="text-gray-400 text-xs">
                    Senior DevOps Engineer
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Based on your React learning path
              </p>
              <Button
                size="sm"
                className="w-full bg-neon-green text-white text-xs"
              >
                View Profile
              </Button>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-gradient-to-r from-neon-purple to-pink-400 text-white text-sm">
                    SC
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">
                    Sarah Chen
                  </h4>
                  <p className="text-gray-400 text-xs">
                    Senior React Developer
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Expert in React performance optimization
              </p>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs"
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}