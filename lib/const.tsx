import {
  BookOpen,
  Brain,
  Calendar,
  Home,
  MessageSquare,
  Settings,
  ShoppingCart,
  Trophy,
  User,
  Users,
  Shield,
  Star,
  Wallet,
  Zap,
  Target,
  Crown,
  Flame,
} from "lucide-react";

export const courseTypes = [
  {
    id: "all",
    name: "All Courses",
    icon: BookOpen,
    color: "from-gray-400 to-gray-600",
  },
  {
    id: "crash",
    name: "Crash Courses",
    icon: Zap,
    color: "from-red-500 to-orange-400",
  },
  {
    id: "beginner",
    name: "Beginner",
    icon: Target,
    color: "from-green-500 to-emerald-400",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    icon: Trophy,
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "advanced",
    name: "Advanced",
    icon: Crown,
    color: "from-purple-500 to-pink-400",
  },
  {
    id: "masterclass",
    name: "Masterclass",
    icon: Flame,
    color: "from-yellow-500 to-red-400",
  },
];

export const roleNavItems = {
  USER: [
    { icon: Home, label: "Home", href: "/" },
    { icon: BookOpen, label: "Courses", href: "/courses" },
    { icon: ShoppingCart, label: "Cart", href: "/cart" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Shield, label: "Mentorship", href: "/mentorship" },
  ],
  STUDENT: [
    { icon: Home, label: "Dashboard", href: "/student" },
    { icon: BookOpen, label: "My Courses", href: "/student/courses" },
    { icon: Trophy, label: "Progress", href: "/student/progress" },
    { icon: Calendar, label: "Mentorship", href: "/student/mentorship" },
    { icon: Brain, label: "AI Interview", href: "/student/ai-interview" },
    { icon: MessageSquare, label: "Projects", href: "/student/assignments" },
  ],
  TUTOR: [
    { icon: Home, label: "Dashboard", href: "/tutor" },
    { icon: BookOpen, label: "My Courses", href: "/tutor/courses" },
    { icon: Users, label: "Students", href: "/tutor/students" },
    { icon: Calendar, label: "Schedule", href: "/tutor/mentorship" },
    { icon: MessageSquare, label: "Projects", href: "/tutor/projects" },
    { icon: MessageSquare, label: "Messages", href: "/tutor/reviews" },
  ],
  ADMIN: [
    { icon: Home, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: BookOpen, label: "Courses", href: "/admin/courses" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ],
};

export const roleMenuItems = {
  USER: [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: BookOpen, label: "My Courses", href: "/courses" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ],
  STUDENT: [
    { icon: User, label: "Profile", href: "/student/profile" },
    { icon: BookOpen, label: "My Courses", href: "/student/courses" },
    { icon: Trophy, label: "Progress", href: "/student/progress" },
    { icon: Calendar, label: "Mentorship", href: "/student/mentorship" },
    { icon: MessageSquare, label: "Projects", href: "/student/projects" },
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ],
  TUTOR: [
    { icon: User, label: "Profile", href: "/tutor/profile" },
    { icon: BookOpen, label: "My Courses", href: "/tutor/courses" },
    { icon: Users, label: "Students", href: "/tutor/students" },
    { icon: Wallet, label: "Earnings", href: "/tutor/wallet" },
    { icon: Star, label: "Reviews", href: "/tutor/reviews" },
    { icon: Calendar, label: "Schedule", href: "/tutor/schedule" },
    { icon: Settings, label: "Settings", href: "/tutor/settings" },
  ],
  ADMIN: [
    { icon: Shield, label: "Admin Panel", href: "/admin" },
    { icon: Users, label: "User Management", href: "/admin/users" },
    { icon: BookOpen, label: "Course Management", href: "/admin/courses" },
    { icon: Wallet, label: "Financial Reports", href: "/admin/finance" },
    { icon: Settings, label: "System Settings", href: "/admin/settings" },
  ],
};

export const roleStats = {
  STUDENT: [
    { label: "Courses Enrolled", value: "12", icon: BookOpen },
    { label: "Completed", value: "8", icon: Trophy },
    { label: "Certificates", value: "5", icon: Star },
  ],
  TUTOR: [
    { label: "Total Students", value: "247", icon: Users },
    { label: "Courses Created", value: "15", icon: BookOpen },
    { label: "Rating", value: "4.9", icon: Star },
  ],
  ADMIN: [
    { label: "Total Users", value: "12.5K", icon: Users },
    { label: "Active Courses", value: "450", icon: BookOpen },
    { label: "Revenue", value: "₦125K", icon: Wallet },
  ],
};
