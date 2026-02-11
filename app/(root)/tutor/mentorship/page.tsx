"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Video,
  MessageCircle,
  Star,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Timer,
  TrendingUp,
} from "lucide-react";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/types/user";
import { generateRandomAvatar } from "@/lib/utils";

export default function TutorMentorshipPage() {
  const [userRole] = useState<UserRole>("TUTOR");
  const [userName] = useState("Sarah Chen");
  const [userAvatar] = useState(generateRandomAvatar());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock mentorship data
  const mentorshipStats = {
    totalSessions: 234,
    completedSessions: 198,
    upcomingSessions: 12,
    totalEarnings: 18750,
    monthlyEarnings: 2340,
    averageRating: 4.9,
    responseTime: "< 2 hours",
  };

  const upcomingSessions = [
    {
      id: 1,
      student: {
        name: "John Doe",
        avatar: generateRandomAvatar(),
        email: "john@example.com",
      },
      topic: "React Hooks Deep Dive",
      date: "Today",
      time: "2:00 PM",
      duration: 60,
      price: 89,
      status: "confirmed",
      meetingLink: "https://meet.google.com/abc-def-ghi",
      notes: "Student wants to focus on useEffect and custom hooks",
      sessionType: "video",
    },
    {
      id: 2,
      student: {
        name: "Maria Garcia",
        avatar: generateRandomAvatar(),
        email: "maria@example.com",
      },
      topic: "Code Review Session",
      date: "Tomorrow",
      time: "10:00 AM",
      duration: 45,
      price: 69,
      status: "pending",
      meetingLink: "",
      notes: "Portfolio project review and optimization suggestions",
      sessionType: "video",
    },
    {
      id: 3,
      student: {
        name: "Alex Kim",
        avatar: generateRandomAvatar(),
        email: "alex@example.com",
      },
      topic: "Career Guidance",
      date: "Dec 20",
      time: "3:00 PM",
      duration: 90,
      price: 129,
      status: "confirmed",
      meetingLink: "https://meet.google.com/xyz-abc-def",
      notes: "Transitioning from junior to senior developer role",
      sessionType: "video",
    },
  ];

  const completedSessions = [
    {
      id: 4,
      student: {
        name: "Emma Wilson",
        avatar: generateRandomAvatar(),
        email: "emma@example.com",
      },
      topic: "JavaScript Fundamentals",
      date: "Yesterday",
      time: "4:00 PM",
      duration: 60,
      price: 89,
      status: "completed",
      rating: 5,
      feedback:
        "Excellent session! Sarah explained complex concepts very clearly.",
      sessionType: "video",
    },
    {
      id: 5,
      student: {
        name: "David Brown",
        avatar: generateRandomAvatar(),
        email: "david@example.com",
      },
      topic: "React Performance",
      date: "2 days ago",
      time: "1:00 PM",
      duration: 45,
      price: 69,
      status: "completed",
      rating: 5,
      feedback: "Great insights on optimization techniques!",
      sessionType: "video",
    },
  ];

  const availableTopics = [
    {
      id: 1,
      title: "React Hooks Deep Dive",
      description: "Master useState, useEffect, and custom hooks",
      duration: 60,
      price: 89,
      isActive: true,
      bookings: 45,
    },
    {
      id: 2,
      title: "Code Review Session",
      description: "Get feedback on your projects and code quality",
      duration: 45,
      price: 69,
      isActive: true,
      bookings: 32,
    },
    {
      id: 3,
      title: "Career Guidance",
      description: "Navigate your developer career path",
      duration: 90,
      price: 129,
      isActive: true,
      bookings: 28,
    },
    {
      id: 4,
      title: "JavaScript Fundamentals",
      description: "Solid foundation in core JavaScript concepts",
      duration: 60,
      price: 89,
      isActive: false,
      bookings: 15,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const SessionCard = ({
    session,
    type,
  }: {
    session: any;
    type: "upcoming" | "completed";
  }) => (
    <Card className="glass-card border-white/10 hover-glow group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={session.student.avatar || generateRandomAvatar()}
              />
              <AvatarFallback>
                {session.student.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">
                {session.student.name}
              </h4>
              <p className="text-neon-blue font-medium mb-2">{session.topic}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{session.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Timer className="w-4 h-4" />
                  <span>{session.duration} min</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white mb-1">
              ₦{session.price}
            </div>
            <Badge className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </div>
        </div>

        {session.notes && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <p className="text-gray-300 text-sm">{session.notes}</p>
          </div>
        )}

        {type === "completed" && session.rating && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ₦{
                      i < session.rating ? "fill-current" : ""
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold">
                {session.rating}/5
              </span>
            </div>
            {session.feedback && (
              <p className="text-gray-300 text-sm italic">
                "{session.feedback}"
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Video className="w-4 h-4" />
            <span>Video Session</span>
          </div>
          <div className="flex items-center space-x-2">
            {type === "upcoming" && (
              <>
                {session.meetingLink && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-black/90 backdrop-blur-sm border-white/10">
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <Edit className="w-4 h-4 mr-2" />
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Student
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {type === "completed" && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Student
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TopicCard = ({ topic }: { topic: any }) => (
    <Card className="glass-card border-white/10 hover-glow group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2 group-hover:text-gradient transition-colors">
              {topic.title}
            </h4>
            <p className="text-gray-300 text-sm mb-3">{topic.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Timer className="w-4 h-4" />
                <span>{topic.duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{topic.bookings} bookings</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white mb-2">
              ₦{topic.price}
            </div>
            <Badge
              className={
                topic.isActive
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }>
              {topic.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">Popular mentorship topic</div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 backdrop-blur-sm border-white/10">
                <DropdownMenuItem className="text-white hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  View Bookings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10">
                  {topic.isActive ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
              className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Mentorship Hub
                </h1>
                <p className="text-xl text-gray-300">
                  Manage your 1-on-1 sessions and help students grow
                </p>
              </div>
              <Button className="bg-gradient-to-r from-neon-purple to-pink-400 text-white text-lg px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Add Topic
              </Button>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {mentorshipStats.totalSessions}
                  </div>
                  <div className="text-gray-400 text-sm">Total Sessions</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-neon-green mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {mentorshipStats.upcomingSessions}
                  </div>
                  <div className="text-gray-400 text-sm">Upcoming</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <NairaSign className="w-8 h-8 text-neon-orange mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    ₦{mentorshipStats.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">Total Earnings</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {mentorshipStats.averageRating}
                  </div>
                  <div className="text-gray-400 text-sm">Avg Rating</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm mb-8">
                <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
                <TabsTrigger value="completed">Session History</TabsTrigger>
                <TabsTrigger value="topics">My Topics</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Upcoming Sessions ({upcomingSessions.length})
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search sessions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          type="upcoming"
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card border-white/10 text-center">
                      <CardContent className="p-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">
                          No upcoming sessions
                        </h4>
                        <p className="text-gray-400">
                          Your schedule is clear! Students can book sessions
                          with you anytime.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="completed">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Session History ({completedSessions.length})
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search sessions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {completedSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        type="completed"
                      />
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="topics">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Mentorship Topics ({availableTopics.length})
                    </h3>
                    <Button className="bg-gradient-to-r from-neon-purple to-pink-400 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Topic
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableTopics.map((topic) => (
                      <TopicCard key={topic.id} topic={topic} />
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
