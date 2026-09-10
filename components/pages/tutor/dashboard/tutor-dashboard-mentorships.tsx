"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";

interface Mentorship {
  id: string | number;
  student: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  price: number;
}

export function TutorDashboardMentorships({
  mentorships,
}: {
  mentorships: Mentorship[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}>
      <Card className="glass-card border-white/10">
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-xl font-bold text-white">Upcoming Mentorships</h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          {mentorships.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No upcoming mentorship sessions.
            </p>
          ) : (
            mentorships.map((session) => (
              <div
                key={session.id}
                className="p-3.5 sm:p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                    {session.student}
                  </h4>
                  <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs shrink-0">
                    ${session.price}
                  </Badge>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm mb-2 line-clamp-2">
                  {session.topic}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {session.date} at {session.time}
                  </span>
                  <span>{session.duration} min</span>
                </div>
              </div>
            ))
          )}
          <Link href="/tutor/mentorship" className="block w-full">
            <Button className="w-full bg-gradient-to-r from-neon-purple to-pink-400 text-white text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Manage Schedule
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
