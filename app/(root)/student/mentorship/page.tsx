import { auth } from "@/auth";
import MotionClient from "@/components/motion-client";
import { MentorshipSidebar } from "@/components/pages/student/student-mentorship-sidebar";
import { MentorshipStats } from "@/components/pages/student/student-mentorship-stats";
import { MentorshipTabs } from "@/components/pages/student/student-mentorship-tabs";
import { getAvailableMentors, getMentorshipStats, getPastSessions, getUpcomingSessions } from "@/data/studentmentorship";

export default async function StudentMentorshipPage() {
    const session = await auth()
    
    const user = session?.user;
    if (!user) throw new Error("User not authenticated")
    // Fetch all data in parallel
    const [upcomingSessions, pastSessions, availableMentors, stats] = await Promise.all([
        getUpcomingSessions(user.id),
        getPastSessions(user.id),
        getAvailableMentors(),
        getMentorshipStats(user.id),
    ]);

    return (
        <div className="min-h-screen bg-background">
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    
                    <MotionClient/>
                    {/* Stats Cards */}
                    <MentorshipStats stats={stats} />

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sessions and Mentors */}
                        <div className="lg:col-span-2">
                            <MentorshipTabs
                                upcomingSessions={upcomingSessions}
                                pastSessions={pastSessions}
                                availableMentors={availableMentors}
                                userId={user.id}
                            />
                        </div>

                        {/* Sidebar */}
                        <MentorshipSidebar userId={user.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
// "use client";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import type { UserRole } from "@/types/user";
// import { motion } from "framer-motion";
// import {
//   CalendarIcon,
//   CheckCircle,
//   Clock,
//   Filter,
//   MapPin,
//   MessageSquare,
//   Plus,
//   Search,
//   Star,
//   Users,
//   Video,
// } from "lucide-react";
// import { useState } from "react";

// export default function StudentMentorshipPage() {
//   const [userRole] = useState<UserRole>("STUDENT");
//   const [userName] = useState("Alex Johnson");
//   const [userAvatar] = useState("/placeholder.svg?height=40&width=40");
//   const [activeTab, setActiveTab] = useState("upcoming");
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(
//     new Date()
//   );

//   const upcomingSessions = [
//     {
//       id: 1,
//       mentor: {
//         name: "Sarah Chen",
//         title: "Senior React Developer",
//         company: "Meta",
//         avatar: "/placeholder.svg?height=40&width=40",
//         rating: 4.9,
//         expertise: ["React", "Next.js", "TypeScript"],
//       },
//       topic: "React Performance Optimization",
//       date: "2024-02-10",
//       time: "15:00",
//       duration: 60,
//       status: "confirmed",
//       meetingLink: "https://meet.google.com/abc-defg-hij",
//       notes: "Prepare questions about React.memo and useMemo",
//       price: 150,
//     },
//     {
//       id: 2,
//       mentor: {
//         name: "Mike Rodriguez",
//         title: "Full-Stack Engineer",
//         company: "Google",
//         avatar: "/placeholder.svg?height=40&width=40",
//         rating: 4.8,
//         expertise: ["Node.js", "Python", "System Design"],
//       },
//       topic: "API Design Best Practices",
//       date: "2024-02-12",
//       time: "10:00",
//       duration: 45,
//       status: "confirmed",
//       meetingLink: "https://zoom.us/j/123456789",
//       notes: "Review REST vs GraphQL approaches",
//       price: 120,
//     },
//   ];

//   const pastSessions = [
//     {
//       id: 3,
//       mentor: {
//         name: "Dr. Emily Watson",
//         title: "AI Research Scientist",
//         company: "OpenAI",
//         avatar: "/placeholder.svg?height=40&width=40",
//         rating: 5.0,
//         expertise: ["Machine Learning", "Python", "TensorFlow"],
//       },
//       topic: "Introduction to Machine Learning",
//       date: "2024-01-28",
//       time: "14:00",
//       duration: 90,
//       status: "completed",
//       rating: 5,
//       feedback:
//         "Excellent session! Emily explained complex concepts very clearly.",
//       price: 200,
//     },
//     {
//       id: 4,
//       mentor: {
//         name: "James Wilson",
//         title: "Mobile App Developer",
//         company: "Uber",
//         avatar: "/placeholder.svg?height=40&width=40",
//         rating: 4.7,
//         expertise: ["React Native", "iOS", "Android"],
//       },
//       topic: "Mobile App Architecture",
//       date: "2024-01-20",
//       time: "16:30",
//       duration: 60,
//       status: "completed",
//       rating: 4,
//       feedback: "Good insights on mobile development patterns.",
//       price: 130,
//     },
//   ];

//   const availableMentors = [
//     {
//       id: 1,
//       name: "David Kim",
//       title: "Senior Software Engineer",
//       company: "Netflix",
//       avatar: "/placeholder.svg?height=60&width=60",
//       rating: 4.9,
//       reviews: 127,
//       hourlyRate: 180,
//       expertise: ["React", "Node.js", "AWS", "Microservices"],
//       bio: "10+ years of experience building scalable web applications. Specialized in React ecosystem and cloud architecture.",
//       availability: "Available this week",
//       location: "San Francisco, CA",
//       languages: ["English", "Korean"],
//     },
//     {
//       id: 2,
//       name: "Lisa Anderson",
//       title: "UX Design Lead",
//       company: "Airbnb",
//       avatar: "/placeholder.svg?height=60&width=60",
//       rating: 4.8,
//       reviews: 89,
//       hourlyRate: 160,
//       expertise: ["UI/UX Design", "Figma", "User Research", "Design Systems"],
//       bio: "Design leader with expertise in creating user-centered digital experiences. Passionate about mentoring new designers.",
//       availability: "Available next week",
//       location: "New York, NY",
//       languages: ["English", "Spanish"],
//     },
//     {
//       id: 3,
//       name: "Alex Thompson",
//       title: "DevOps Engineer",
//       company: "Amazon",
//       avatar: "/placeholder.svg?height=60&width=60",
//       rating: 4.9,
//       reviews: 156,
//       hourlyRate: 200,
//       expertise: ["AWS", "Docker", "Kubernetes", "CI/CD"],
//       bio: "DevOps expert helping teams scale their infrastructure. Experience with cloud platforms and automation tools.",
//       availability: "Available today",
//       location: "Seattle, WA",
//       languages: ["English"],
//     },
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "confirmed":
//         return "bg-green-500/20 text-green-400 border-green-500/30";
//       case "pending":
//         return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
//       case "completed":
//         return "bg-blue-500/20 text-blue-400 border-blue-500/30";
//       case "cancelled":
//         return "bg-red-500/20 text-red-400 border-red-500/30";
//       default:
//         return "bg-gray-500/20 text-gray-400 border-gray-500/30";
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="pt-24 pb-12">
//         <div className="container mx-auto px-6">
//           {/* Header */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="text-center mb-12">
//             <h1 className="text-4xl md:text-5xl font-bold mb-4">
//               <span className="text-white">1-on-1</span>{" "}
//               <span className="text-gradient">Mentorship</span>
//             </h1>
//             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//               Get personalized guidance from industry experts at top tech
//               companies
//             </p>
//           </motion.div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.1 }}>
//               <Card className="glass-card border-white/10 hover-glow">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-3">
//                     <CalendarIcon className="w-6 h-6 text-white" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white">8</h3>
//                   <p className="text-gray-400 text-sm">Total Sessions</p>
//                 </CardContent>
//               </Card>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.2 }}>
//               <Card className="glass-card border-white/10 hover-glow">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
//                     <CheckCircle className="w-6 h-6 text-white" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white">6</h3>
//                   <p className="text-gray-400 text-sm">Completed</p>
//                 </CardContent>
//               </Card>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.3 }}>
//               <Card className="glass-card border-white/10 hover-glow">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-neon-orange to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
//                     <Clock className="w-6 h-6 text-white" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white">12</h3>
//                   <p className="text-gray-400 text-sm">Hours Mentored</p>
//                 </CardContent>
//               </Card>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.4 }}>
//               <Card className="glass-card border-white/10 hover-glow">
//                 <CardContent className="p-6 text-center">
//                   <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3">
//                     <Star className="w-6 h-6 text-white" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white">4.9</h3>
//                   <p className="text-gray-400 text-sm">Avg Rating</p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           </div>

//           {/* Main Content */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Sessions and Mentors */}
//             <div className="lg:col-span-2">
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.8, delay: 0.5 }}>
//                 <Card className="glass-card border-white/10">
//                   <CardContent className="p-0">
//                     <Tabs value={activeTab} onValueChange={setActiveTab}>
//                       <TabsList className="grid w-full grid-cols-3 bg-white/5 border-b border-white/10">
//                         <TabsTrigger value="upcoming">
//                           Upcoming ({upcomingSessions.length})
//                         </TabsTrigger>
//                         <TabsTrigger value="past">
//                           Past Sessions ({pastSessions.length})
//                         </TabsTrigger>
//                         <TabsTrigger value="browse">Browse Mentors</TabsTrigger>
//                       </TabsList>

//                       {/* Upcoming Sessions */}
//                       <TabsContent value="upcoming" className="p-6">
//                         <div className="space-y-6">
//                           {upcomingSessions.map((session, index) => (
//                             <motion.div
//                               key={session.id}
//                               initial={{ opacity: 0, y: 20 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.5, delay: index * 0.1 }}
//                               className="p-6 bg-white/5 rounded-lg border border-white/10">
//                               <div className="flex items-start justify-between mb-4">
//                                 <div className="flex items-center gap-4">
//                                   <Avatar className="w-16 h-16">
//                                     <AvatarImage
//                                       src={
//                                         session.mentor.avatar ||
//                                         "/placeholder.svg"
//                                       }
//                                     />
//                                     <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
//                                       {session.mentor.name
//                                         .split(" ")
//                                         .map((n) => n[0])
//                                         .join("")}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <div>
//                                     <h3 className="text-lg font-bold text-white">
//                                       {session.mentor.name}
//                                     </h3>
//                                     <p className="text-gray-300">
//                                       {session.mentor.title}
//                                     </p>
//                                     <p className="text-gray-400 text-sm">
//                                       {session.mentor.company}
//                                     </p>
//                                     <div className="flex items-center gap-1 mt-1">
//                                       <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                                       <span className="text-sm text-gray-300">
//                                         {session.mentor.rating}
//                                       </span>
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <Badge
//                                   className={getStatusColor(session.status)}>
//                                   {session.status}
//                                 </Badge>
//                               </div>

//                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                                 <div>
//                                   <h4 className="text-white font-semibold mb-2">
//                                     {session.topic}
//                                   </h4>
//                                   <div className="space-y-2 text-sm text-gray-400">
//                                     <div className="flex items-center gap-2">
//                                       <CalendarIcon className="w-4 h-4" />
//                                       <span>
//                                         {new Date(
//                                           session.date
//                                         ).toLocaleDateString()}
//                                       </span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                       <Clock className="w-4 h-4" />
//                                       <span>
//                                         {session.time} ({session.duration} min)
//                                       </span>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                       <Video className="w-4 h-4" />
//                                       <span>Video Call</span>
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <p className="text-sm text-gray-400 mb-2">
//                                     Session Notes
//                                   </p>
//                                   <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
//                                     {session.notes}
//                                   </p>
//                                 </div>
//                               </div>

//                               <div className="flex items-center justify-between pt-4 border-t border-white/10">
//                                 <span className="text-sm text-gray-400">
//                                   Price: ${session.price}
//                                 </span>
//                                 <div className="flex gap-2">
//                                   <Button
//                                     variant="outline"
//                                     size="sm"
//                                     className="border-white/20 text-white hover:bg-white/10 bg-transparent">
//                                     <MessageSquare className="w-4 h-4 mr-2" />
//                                     Message
//                                   </Button>
//                                   <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
//                                     <Video className="w-4 h-4 mr-2" />
//                                     Join Session
//                                   </Button>
//                                 </div>
//                               </div>
//                             </motion.div>
//                           ))}
//                         </div>
//                       </TabsContent>

//                       {/* Past Sessions */}
//                       <TabsContent value="past" className="p-6">
//                         <div className="space-y-6">
//                           {pastSessions.map((session, index) => (
//                             <motion.div
//                               key={session.id}
//                               initial={{ opacity: 0, y: 20 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.5, delay: index * 0.1 }}
//                               className="p-6 bg-white/5 rounded-lg border border-white/10">
//                               <div className="flex items-start justify-between mb-4">
//                                 <div className="flex items-center gap-4">
//                                   <Avatar className="w-16 h-16">
//                                     <AvatarImage
//                                       src={
//                                         session.mentor.avatar ||
//                                         "/placeholder.svg"
//                                       }
//                                     />
//                                     <AvatarFallback className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
//                                       {session.mentor.name
//                                         .split(" ")
//                                         .map((n) => n[0])
//                                         .join("")}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <div>
//                                     <h3 className="text-lg font-bold text-white">
//                                       {session.mentor.name}
//                                     </h3>
//                                     <p className="text-gray-300">
//                                       {session.mentor.title}
//                                     </p>
//                                     <p className="text-gray-400 text-sm">
//                                       {session.mentor.company}
//                                     </p>
//                                     <div className="flex items-center gap-1 mt-1">
//                                       <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                                       <span className="text-sm text-gray-300">
//                                         {session.mentor.rating}
//                                       </span>
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <Badge
//                                   className={getStatusColor(session.status)}>
//                                   <CheckCircle className="w-3 h-3 mr-1" />
//                                   {session.status}
//                                 </Badge>
//                               </div>

//                               <div className="mb-4">
//                                 <h4 className="text-white font-semibold mb-2">
//                                   {session.topic}
//                                 </h4>
//                                 <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
//                                   <span>
//                                     {new Date(
//                                       session.date
//                                     ).toLocaleDateString()}
//                                   </span>
//                                   <span>•</span>
//                                   <span>{session.duration} minutes</span>
//                                   <span>•</span>
//                                   <span>${session.price}</span>
//                                 </div>
//                                 <div className="flex items-center gap-2 mb-3">
//                                   <span className="text-sm text-gray-400">
//                                     Your Rating:
//                                   </span>
//                                   <div className="flex items-center gap-1">
//                                     {[...Array(5)].map((_, i) => (
//                                       <Star
//                                         key={i}
//                                         className={`w-4 h-4 ${
//                                           i < session.rating
//                                             ? "text-yellow-400 fill-current"
//                                             : "text-gray-600"
//                                         }`}
//                                       />
//                                     ))}
//                                   </div>
//                                 </div>
//                                 <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
//                                   {session.feedback}
//                                 </p>
//                               </div>

//                               <div className="flex items-center justify-between pt-4 border-t border-white/10">
//                                 <span className="text-sm text-gray-400">
//                                   Session completed
//                                 </span>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   className="border-white/20 text-white hover:bg-white/10 bg-transparent">
//                                   <Plus className="w-4 h-4 mr-2" />
//                                   Book Again
//                                 </Button>
//                               </div>
//                             </motion.div>
//                           ))}
//                         </div>
//                       </TabsContent>

//                       {/* Browse Mentors */}
//                       <TabsContent value="browse" className="p-6">
//                         <div className="mb-6">
//                           <div className="flex items-center gap-4 mb-4">
//                             <div className="flex-1 relative">
//                               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                               <input
//                                 type="text"
//                                 placeholder="Search mentors by expertise..."
//                                 className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-neon-blue"
//                               />
//                             </div>
//                             <Button
//                               variant="outline"
//                               className="border-white/20 text-white hover:bg-white/10 bg-transparent">
//                               <Filter className="w-4 h-4 mr-2" />
//                               Filters
//                             </Button>
//                           </div>
//                         </div>

//                         <div className="space-y-6">
//                           {availableMentors.map((mentor, index) => (
//                             <motion.div
//                               key={mentor.id}
//                               initial={{ opacity: 0, y: 20 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.5, delay: index * 0.1 }}
//                               className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
//                               <div className="flex items-start gap-6">
//                                 <Avatar className="w-20 h-20">
//                                   <AvatarImage
//                                     src={mentor.avatar || "/placeholder.svg"}
//                                   />
//                                   <AvatarFallback className="bg-gradient-to-r from-neon-purple to-pink-400 text-white text-lg">
//                                     {mentor.name
//                                       .split(" ")
//                                       .map((n) => n[0])
//                                       .join("")}
//                                   </AvatarFallback>
//                                 </Avatar>
//                                 <div className="flex-1">
//                                   <div className="flex items-start justify-between mb-3">
//                                     <div>
//                                       <h3 className="text-xl font-bold text-white">
//                                         {mentor.name}
//                                       </h3>
//                                       <p className="text-gray-300">
//                                         {mentor.title}
//                                       </p>
//                                       <p className="text-gray-400 text-sm">
//                                         {mentor.company}
//                                       </p>
//                                     </div>
//                                     <div className="text-right">
//                                       <div className="flex items-center gap-1 mb-1">
//                                         <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                                         <span className="text-white font-semibold">
//                                           {mentor.rating}
//                                         </span>
//                                         <span className="text-gray-400 text-sm">
//                                           ({mentor.reviews})
//                                         </span>
//                                       </div>
//                                       <p className="text-lg font-bold text-neon-blue">
//                                         ${mentor.hourlyRate}/hr
//                                       </p>
//                                     </div>
//                                   </div>

//                                   <p className="text-gray-300 mb-4">
//                                     {mentor.bio}
//                                   </p>

//                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                                     <div>
//                                       <p className="text-sm text-gray-400 mb-2">
//                                         Expertise
//                                       </p>
//                                       <div className="flex flex-wrap gap-2">
//                                         {mentor.expertise.map((skill) => (
//                                           <Badge
//                                             key={skill}
//                                             className="bg-neon-blue/20 text-neon-blue border-neon-blue/30 text-xs">
//                                             {skill}
//                                           </Badge>
//                                         ))}
//                                       </div>
//                                     </div>
//                                     <div>
//                                       <div className="space-y-2 text-sm text-gray-400">
//                                         <div className="flex items-center gap-2">
//                                           <MapPin className="w-4 h-4" />
//                                           <span>{mentor.location}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                           <Clock className="w-4 h-4" />
//                                           <span>{mentor.availability}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                           <Users className="w-4 h-4" />
//                                           <span>
//                                             {mentor.languages.join(", ")}
//                                           </span>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>

//                                   <div className="flex items-center justify-between pt-4 border-t border-white/10">
//                                     <span className="text-sm text-green-400">
//                                       {mentor.availability}
//                                     </span>
//                                     <div className="flex gap-2">
//                                       <Button
//                                         variant="outline"
//                                         size="sm"
//                                         className="border-white/20 text-white hover:bg-white/10 bg-transparent">
//                                         <MessageSquare className="w-4 h-4 mr-2" />
//                                         Message
//                                       </Button>
//                                       <Button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
//                                         <CalendarIcon className="w-4 h-4 mr-2" />
//                                         Book Session
//                                       </Button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </motion.div>
//                           ))}
//                         </div>
//                       </TabsContent>
//                     </Tabs>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>

//             {/* Sidebar - Calendar and Quick Actions */}
//             <div className="space-y-6">
//               {/* Calendar */}
//               <motion.div
//                 initial={{ opacity: 0, x: 50 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: 0.4 }}>
//                 <Card className="glass-card border-white/10">
//                   <CardHeader>
//                     <CardTitle className="text-white">Schedule</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <Calendar
//                       mode="single"
//                       selected={selectedDate}
//                       onSelect={setSelectedDate}
//                       className="rounded-md border-0"
//                     />
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Quick Actions */}
//               <motion.div
//                 initial={{ opacity: 0, x: 50 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: 0.5 }}>
//                 <Card className="glass-card border-white/10">
//                   <CardHeader>
//                     <CardTitle className="text-white">Quick Actions</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white">
//                       <Plus className="w-4 h-4 mr-2" />
//                       Book New Session
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">
//                       <Search className="w-4 h-4 mr-2" />
//                       Browse All Mentors
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">
//                       <MessageSquare className="w-4 h-4 mr-2" />
//                       Message History
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Mentor Recommendations */}
//               <motion.div
//                 initial={{ opacity: 0, x: 50 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.8, delay: 0.6 }}>
//                 <Card className="glass-card border-white/10">
//                   <CardHeader>
//                     <CardTitle className="text-white">
//                       Recommended for You
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="p-3 bg-white/5 rounded-lg">
//                       <div className="flex items-center gap-3 mb-2">
//                         <Avatar className="w-10 h-10">
//                           <AvatarImage src="/placeholder.svg?height=40&width=40" />
//                           <AvatarFallback className="bg-gradient-to-r from-neon-green to-emerald-400 text-white text-sm">
//                             RJ
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1">
//                           <h4 className="text-white font-medium text-sm">
//                             Robert Johnson
//                           </h4>
//                           <p className="text-gray-400 text-xs">
//                             Senior DevOps Engineer
//                           </p>
//                         </div>
//                       </div>
//                       <p className="text-xs text-gray-300 mb-2">
//                         Based on your React learning path
//                       </p>
//                       <Button
//                         size="sm"
//                         className="w-full bg-neon-green text-white text-xs">
//                         View Profile
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
