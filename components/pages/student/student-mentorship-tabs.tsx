"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { UpcomingSessions } from "./studentupcomingsession";
import { PastSessions } from "./student-mentorship-pastsession";
import { BrowseMentors } from "./student-mentorship-browsesessions";
import { MentorshipSession, AvailableMentor } from "@/data/studentmentorship";

interface MentorshipTabsProps {
  upcomingSessions: MentorshipSession[];
  pastSessions: MentorshipSession[];
  availableMentors: AvailableMentor[];
  userId: string;
}

export function MentorshipTabs({
  upcomingSessions,
  pastSessions,
  availableMentors,
  userId,
}: MentorshipTabsProps) {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="text-white data-[state=active]:text-white grid w-full grid-cols-3 bg-white/5 border-b border-white/10">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingSessions.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Sessions ({pastSessions.length})
              </TabsTrigger>
              <TabsTrigger value="browse">Browse Mentors</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="p-6">
              <UpcomingSessions 
                sessions={upcomingSessions} 
                userId={userId}
              />
            </TabsContent>

            <TabsContent value="past" className="p-6">
              <PastSessions 
                sessions={pastSessions}
                userId={userId}
              />
            </TabsContent>

            <TabsContent value="browse" className="p-6">
              <BrowseMentors 
                mentors={availableMentors}
                userId={userId}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}