"use client";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShieldCheck,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  Check,
  Copy,
  Share2,
  QrCode,
  ArrowRight,
  LogIn,
  ThumbsUp,
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  Globe,
  Search,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import {
  createTutorDirectReview,
  deleteReview,
  updateReview,
} from "@/actions/review";
import { beginMentorshipCheckout } from "@/actions/mentorship-revenue";
import { CertificateQrModal } from "@/components/certificate/qr-code-modal";
import { formatDurationMinutes } from "@/lib/utils";

export interface TutorCourseItem {
  id: string;
  title: string;
  slug: string;
  category?: string;
  level?: string;
  thumbnail?: string | null;
  price?: number | null;
  duration?: number | null;
  studentsCount?: number;
  reviewsCount?: number;
}

export interface TutorProgramItem {
  id: string;
  name: string;
  slug: string;
  cohort: string;
}

export interface TutorPublicProfileData {
  id: string;
  userId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  title: string;
  expertise: string[];
  experience: number;
  totalReviews: number;
  averageRating: number;
  isVerified: boolean;
  referralCode: string | null;
  hourlyRate?: number | null;
  course?: string | null;
  education?: string[];
  certifications?: string[];
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  language?: string | null;
  courses: TutorCourseItem[];
  programs: TutorProgramItem[];
}

export interface StudentContextItem {
  type: "PROGRAM" | "COURSE" | "DIRECT";
  id: string;
  label: string;
  sublabel?: string;
}

export interface ExistingReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  communicationRating?: number | null;
  clarityRating?: number | null;
  expertiseRating?: number | null;
  reviewType: string;
  verifiedContext?: string | null;
  createdAt: Date | string;
  responseText?: string | null;
  user?: {
    name: string | null;
    image: string | null;
    avatar: string | null;
  };
}

interface TutorPublicProfileClientProps {
  tutor: TutorPublicProfileData;
  reviews: ExistingReviewItem[];
  userReview: ExistingReviewItem | null;
  studentContexts: StudentContextItem[];
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  currentPath: string;
  initialTab?: "courses" | "about" | "reviews";
}

const QUICK_TAGS = [
  "Clear & patient explanations",
  "Great real-world examples",
  "Always supportive in Q&A",
  "Practical code reviews",
  "Inspiring & motivating",
  "Deep industry expertise",
];

const packageOptions = [
  { label: "One-off session", value: "NONE" },
  { label: "Starter pack (3 sessions, 10% off)", value: "STARTER_3" },
  { label: "Growth pack (5 sessions, 18% off)", value: "GROWTH_5" },
] as const;

export function TutorPublicProfileClient({
  tutor,
  reviews,
  userReview: initialUserReview,
  studentContexts,
  isOwnProfile,
  isLoggedIn,
  currentUserId,
  currentUserRole,
  currentPath,
  initialTab = "courses",
}: TutorPublicProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isPending, startTransition] = useTransition();

  // Course catalog filtering
  const [courseSearch, setCourseSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Review Form States
  const [userReview, setUserReview] = useState<ExistingReviewItem | null>(
    initialUserReview,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(initialUserReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(
    initialUserReview?.comment || "",
  );
  const [selectedContextId, setSelectedContextId] = useState<string>(
    studentContexts[0]?.id || "general",
  );

  // Criteria ratings
  const [communicationRating, setCommunicationRating] = useState<number>(
    initialUserReview?.communicationRating || 5,
  );
  const [clarityRating, setClarityRating] = useState<number>(
    initialUserReview?.clarityRating || 5,
  );
  const [expertiseRating, setExpertiseRating] = useState<number>(
    initialUserReview?.expertiseRating || 5,
  );

  // Share & QR Modal States
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Mentorship Booking Dialog
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [topic, setTopic] = useState("1-on-1 Code Review & Mentorship");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [packageCode, setPackageCode] = useState<
    "NONE" | "STARTER_3" | "GROWTH_5"
  >("NONE");
  const [bookingMode, setBookingMode] = useState<"INSTANT" | "REQUEST">(
    "INSTANT",
  );
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const fullShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tutors/${tutor.referralCode || tutor.username || tutor.id}`
      : `https://www.palmtechniq.com/tutors/${tutor.referralCode || tutor.username || tutor.id}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedContext = studentContexts.find(
    (c) => c.id === selectedContextId,
  );

  // Filtered courses for Coursera-style catalog
  const filteredCourses = useMemo(() => {
    return tutor.courses.filter((course) => {
      const matchesSearch =
        !courseSearch.trim() ||
        course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (course.category &&
          course.category.toLowerCase().includes(courseSearch.toLowerCase()));
      const matchesLevel =
        levelFilter === "ALL" ||
        (course.level &&
          course.level.toUpperCase() === levelFilter.toUpperCase());
      return matchesSearch && matchesLevel;
    });
  }, [tutor.courses, courseSearch, levelFilter]);

  const totalStudentsTaught = useMemo(() => {
    return tutor.courses.reduce(
      (acc, curr) => acc + (curr.studentsCount || 0),
      0,
    );
  }, [tutor.courses]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1) {
      toast.error("Please select a rating star (1 to 5).");
      return;
    }

    if (comment.trim().length < 3) {
      toast.error(
        "Please provide a short feedback comment (at least 3 characters).",
      );
      return;
    }

    startTransition(async () => {
      let programId: string | undefined = undefined;
      let courseId: string | undefined = undefined;
      let reviewType: "COURSE" | "PROGRAM" | "DIRECT" = "DIRECT";

      if (selectedContext?.type === "PROGRAM") {
        programId = selectedContext.id;
        reviewType = "PROGRAM";
      } else if (selectedContext?.type === "COURSE") {
        courseId = selectedContext.id;
        reviewType = "COURSE";
      }

      const res = await createTutorDirectReview({
        tutorId: tutor.id,
        courseId,
        programId,
        reviewType,
        rating,
        comment: comment.trim(),
        communicationRating,
        clarityRating,
        expertiseRating,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }

      if (res.success && res.review) {
        toast.success("Thank you! Your verified review has been published.");
        setUserReview(res.review as any);
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDeleteReview = () => {
    if (!userReview?.id) return;
    startTransition(async () => {
      const res = await deleteReview(userReview.id);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Your review was deleted.");
      setUserReview(null);
      setRating(5);
      setComment("");
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleBookingCheckout = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to book a mentorship session.");
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const res = await beginMentorshipCheckout({
        tutorUserId: tutor.userId,
        topic,
        description: notes,
        scheduledAtIso: scheduledDate
          ? new Date(scheduledDate).toISOString()
          : new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: Number(duration) || 60,
        bookingMode,
        packageCode,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }

      if ("checkoutUrl" in res && typeof res.checkoutUrl === "string") {
        window.location.href = res.checkoutUrl;
      } else {
        toast.success(
          "Mentorship session requested successfully! The instructor will confirm.",
        );
        setBookModalOpen(false);
      }
    } catch (err) {
      toast.error("An unexpected error occurred while initiating checkout.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const addQuickTag = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ============================================================ */}
        {/* 1. TUTOR PROFILE HERO BANNER */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-card border border-white/10 bg-gradient-to-br from-white/[0.04] via-background to-neon-purple/[0.08]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              <div className="relative shrink-0">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-neon-blue/40 shadow-xl shadow-neon-blue/10 bg-[#0d121f]">
                  <AvatarImage
                    src={tutor.avatar || undefined}
                    alt={tutor.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-neon-blue to-neon-purple text-white">
                    {tutor.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {tutor.isVerified && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full shadow-lg"
                    title="Verified PalmTechnIQ Instructor">
                    <ShieldCheck className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {tutor.name}
                  </h1>
                  {tutor.isVerified && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] py-0.5">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified Instructor
                    </Badge>
                  )}
                </div>

                <p className="text-neon-blue text-sm sm:text-base font-medium">
                  {tutor.title || "Senior Tech Instructor & Mentor"}
                </p>

                {tutor.course && (
                  <p className="text-xs text-gray-400">
                    Lead Specialty:{" "}
                    <span className="text-gray-200">{tutor.course}</span>
                  </p>
                )}

                {/* Authority Stats Pills */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs pt-1.5 text-gray-300">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-white">
                      {tutor.averageRating > 0
                        ? tutor.averageRating.toFixed(1)
                        : "5.0"}
                    </span>
                    <span className="text-gray-400 font-normal">
                      ({tutor.totalReviews}{" "}
                      {tutor.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </button>

                  <span className="text-white/20">•</span>

                  <div className="flex items-center gap-1 text-gray-300">
                    <Clock className="w-3.5 h-3.5 text-neon-blue" />
                    <span>{tutor.experience} Yrs Experience</span>
                  </div>

                  <span className="text-white/20">•</span>

                  <button
                    type="button"
                    onClick={() => setActiveTab("courses")}
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
                    <BookOpen className="w-3.5 h-3.5 text-neon-purple" />
                    <span>
                      {tutor.courses.length}{" "}
                      {tutor.courses.length === 1 ? "Course" : "Courses"}
                    </span>
                  </button>

                  {tutor.hourlyRate ? (
                    <>
                      <span className="text-white/20">•</span>
                      <div className="flex items-center gap-0.5 text-white font-semibold">
                        <NairaSign className="w-3 h-3 text-neon-blue" />
                        <span>{tutor.hourlyRate.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-normal">
                          /hr
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              <Button
                type="button"
                onClick={() => setBookModalOpen(true)}
                className="flex-1 lg:flex-none gap-2 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs sm:text-sm h-10 px-5 shadow-lg shadow-neon-blue/20">
                <Calendar className="w-4 h-4" />
                Book 1-on-1 Mentorship
              </Button>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyShareLink}
                  className="flex-1 border-white/20 text-gray-200 hover:text-white hover:bg-white/10 text-xs h-9">
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 mr-1.5 text-neon-blue" />
                  )}
                  {copiedLink ? "Copied!" : "Share Profile"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQrOpen(true)}
                  className="flex-1 border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 text-xs h-9">
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  QR Card
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* 2. OWN PROFILE ALERT FOR TUTOR */}
        {/* ============================================================ */}
        {isOwnProfile && (
          <div className="p-4 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold">
                  You are viewing your public instructor profile
                </p>
                <p className="text-xs text-gray-300">
                  Students see your courses, background, and reviews here. Share
                  this link to attract learners.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleCopyShareLink}
              size="sm"
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-semibold text-xs shrink-0">
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Profile Link
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MAIN TABBED CONTENT (COURSERA CATALOG + REVIEWS + BIO) */}
        {/* ============================================================ */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto justify-start sm:grid sm:grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-xl h-auto gap-1 no-scrollbar">
            <TabsTrigger
              value="courses"
              className="flex-1 gap-2 text-xs sm:text-sm px-4 py-2.5 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue font-medium">
              <BookOpen className="w-4 h-4" />
              Courses & Bootcamps ({tutor.courses.length})
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="flex-1 gap-2 text-xs sm:text-sm px-4 py-2.5 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue font-medium">
              <User className="w-4 h-4" />
              About & Credentials
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 gap-2 text-xs sm:text-sm px-4 py-2.5 text-white data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue font-medium">
              <Star className="w-4 h-4" />
              Verified Reviews ({tutor.totalReviews})
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------------ */}
          {/* TAB 1: COURSES & BOOTCAMPS (COURSERA CATALOG STYLE) */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Courses by {tutor.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Comprehensive tech courses and live cohort bootcamps taught by
                  this instructor.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/5 border-white/10 text-white text-xs placeholder:text-gray-500"
                  />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32 h-9 bg-white/5 border-white/10 text-white text-xs">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white text-xs">
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center rounded-3xl glass-card border border-white/10 text-gray-400 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-gray-600" />
                <p className="text-base font-semibold text-gray-300">
                  No courses found
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {tutor.name} has not published any courses matching your
                  search filter yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="group glass-card border-white/10 overflow-hidden hover:border-neon-blue/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Course Thumbnail */}
                      <div className="relative h-44 w-full bg-white/5 overflow-hidden">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 text-neon-blue">
                            <BookOpen className="w-12 h-12 opacity-40" />
                          </div>
                        )}
                        {course.level && (
                          <Badge className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white border-white/20 text-[10px] font-semibold">
                            {course.level}
                          </Badge>
                        )}
                        {course.category && (
                          <Badge className="absolute top-3 right-3 bg-neon-blue/20 backdrop-blur-md text-neon-blue border-neon-blue/30 text-[10px]">
                            {course.category}
                          </Badge>
                        )}
                      </div>

                      {/* Course Details */}
                      <CardContent className="p-5 space-y-3">
                        <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-neon-blue transition-colors">
                          {course.title}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          {course.duration ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>
                                {formatDurationMinutes(course.duration)}
                              </span>
                            </div>
                          ) : (
                            <span>Self-paced</span>
                          )}

                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span>{course.studentsCount || 0} students</span>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Bottom Price & Link */}
                    <div className="p-5 pt-0 flex items-center justify-between border-t border-white/5 mt-2">
                      <div className="flex items-center text-lg font-bold text-white">
                        <NairaSign className="w-4 h-4 text-neon-blue" />
                        {course.price ? course.price.toLocaleString() : "Free"}
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white text-xs h-8">
                        <Link href={`/courses/${course.id}`}>
                          View Course
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Live Cohort Bootcamps Section */}
            {tutor.programs && tutor.programs.length > 0 && (
              <div className="pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-neon-purple" />
                  Live Cohort Bootcamps Led by {tutor.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tutor.programs.map((prog) => (
                    <div
                      key={prog.id}
                      className="p-5 rounded-2xl glass-card border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 text-[10px]">
                          Cohort: {prog.cohort}
                        </Badge>
                        <h4 className="font-semibold text-white text-sm">
                          {prog.name}
                        </h4>
                        <p className="text-xs text-gray-400">
                          Interactive live classes & group capstone projects
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 text-xs shrink-0">
                        <Link href={`https://bootcamp.palmtechniq.com`}>
                          View Bootcamp
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------ */}
          {/* TAB 2: ABOUT & CREDENTIALS */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bio & Philosophy (Left 2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-neon-blue" />
                      About {tutor.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {tutor.bio ||
                      `${tutor.name} is an experienced instructor and technology professional dedicated to delivering practical, industry-aligned tech education on PalmTechnIQ.`}
                  </CardContent>
                </Card>

                {/* Skills & Focus Areas */}
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-neon-purple" />
                      Skills & Tech Stack
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tutor.expertise && tutor.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tutor.expertise.map((skill, idx) => (
                          <Badge
                            key={idx}
                            className="bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-xs px-3 py-1.5 font-medium">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        No specific skills listed.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Education & Certifications */}
                {((tutor.education && tutor.education.length > 0) ||
                  (tutor.certifications &&
                    tutor.certifications.length > 0)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tutor.education && tutor.education.length > 0 && (
                      <Card className="glass-card border-white/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-neon-purple" />
                            Education
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-gray-300">
                          {tutor.education.map((edu, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-neon-purple">•</span>
                              <span>{edu}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {tutor.certifications &&
                      tutor.certifications.length > 0 && (
                        <Card className="glass-card border-white/10">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                              <Award className="w-4 h-4 text-emerald-400" />
                              Certifications
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-xs text-gray-300">
                            {tutor.certifications.map((cert, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400">•</span>
                                <span>{cert}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}
              </div>

              {/* Sidebar Quick Info & Mentorship Callout (Right Col) */}
              <div className="space-y-6">
                <Card className="glass-card border-white/10 bg-gradient-to-b from-neon-blue/10 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-white">
                      Instructor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <span className="text-gray-400">Experience</span>
                      <span className="font-semibold text-white">
                        {tutor.experience} Years
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <span className="text-gray-400">Hourly Rate</span>
                      <span className="font-semibold text-white flex items-center gap-0.5">
                        <NairaSign className="w-3 h-3 text-neon-blue" />
                        {tutor.hourlyRate
                          ? tutor.hourlyRate.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>

                    {tutor.location && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <span className="text-gray-400">Location</span>
                        <span className="font-semibold text-white">
                          {tutor.location}
                        </span>
                      </div>
                    )}

                    {tutor.timezone && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <span className="text-gray-400">Timezone</span>
                        <span className="font-semibold text-white">
                          {tutor.timezone}
                        </span>
                      </div>
                    )}

                    {tutor.language && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <span className="text-gray-400">Language</span>
                        <span className="font-semibold text-white">
                          {tutor.language}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={() => setBookModalOpen(true)}
                        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs h-9">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Book Mentorship Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ------------------------------------------------------------ */}
          {/* TAB 3: VERIFIED REVIEWS & RATINGS */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Review Submission Section */}
            {!isOwnProfile && (
              <div>
                {!isLoggedIn ? (
                  <Card className="glass-card border-white/10 bg-white/[0.02] p-8 text-center rounded-3xl space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
                      <Star className="w-7 h-7 fill-neon-blue" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-xl font-bold text-white">
                        Share Your Feedback for {tutor.name}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Sign in as a student to rate your learning experience,
                        course delivery, and mentorship.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold h-11 px-8 rounded-xl shadow-lg shadow-neon-blue/20">
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(currentPath)}`}>
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In to Leave a Review
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ) : userReview && !isEditing ? (
                  <Card className="glass-card border-emerald-500/30 bg-emerald-500/[0.03] rounded-3xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-white">
                              Your Review is Published
                            </CardTitle>
                            <p className="text-xs text-gray-400">
                              Thank you for sharing your experience with{" "}
                              {tutor.name}.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="border-white/20 text-gray-300 hover:text-white text-xs h-8">
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteReview}
                            disabled={isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8">
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= userReview.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-white">
                          {userReview.rating}.0 / 5.0
                        </span>
                      </div>
                      {userReview.comment && (
                        <p className="text-sm text-gray-300 italic">
                          &ldquo;{userReview.comment}&rdquo;
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card border-white/10 bg-white/[0.02] rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-white/10 pb-4">
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        {isEditing
                          ? "Edit Your Review"
                          : `Leave a Review for ${tutor.name}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        {/* Student Context Selection */}
                        {studentContexts.length > 1 && (
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                              What are you reviewing this tutor for?
                            </label>
                            <Select
                              value={selectedContextId}
                              onValueChange={setSelectedContextId}>
                              <SelectTrigger className="w-full bg-white/5 border-white/20 text-white text-xs">
                                <SelectValue placeholder="Select course or program" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/10 text-white text-xs">
                                {studentContexts.map((ctx) => (
                                  <SelectItem key={ctx.id} value={ctx.id}>
                                    {ctx.label}{" "}
                                    {ctx.sublabel ? `(${ctx.sublabel})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Overall Star Rating */}
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                            Overall Rating
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 focus:outline-none">
                                <Star
                                  className={`w-7 h-7 transition-colors ${
                                    star <= (hoverRating || rating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-600 hover:text-gray-400"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs text-gray-400 ml-2">
                              {rating} out of 5 stars
                            </span>
                          </div>
                        </div>

                        {/* Criteria Sub-Ratings */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                            <span className="text-xs text-gray-300 font-medium block">
                              Communication
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setCommunicationRating(s)}
                                  className="p-0.5 focus:outline-none">
                                  <Star
                                    className={`w-4 h-4 ${
                                      s <= communicationRating
                                        ? "fill-neon-blue text-neon-blue"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                            <span className="text-xs text-gray-300 font-medium block">
                              Teaching Clarity
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setClarityRating(s)}
                                  className="p-0.5 focus:outline-none">
                                  <Star
                                    className={`w-4 h-4 ${
                                      s <= clarityRating
                                        ? "fill-neon-purple text-neon-purple"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                            <span className="text-xs text-gray-300 font-medium block">
                              Subject Expertise
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setExpertiseRating(s)}
                                  className="p-0.5 focus:outline-none">
                                  <Star
                                    className={`w-4 h-4 ${
                                      s <= expertiseRating
                                        ? "fill-emerald-400 text-emerald-400"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Written Feedback Box */}
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                            <span>Your Feedback & Experience</span>
                            <span className="text-[11px] text-gray-500 font-normal">
                              Min 3 characters
                            </span>
                          </label>
                          <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={`Share your experience learning with ${tutor.name}. Mention teaching style, mentorship, coding exercises, or practical feedback...`}
                            rows={4}
                            className="glass-card border-white/20 text-white placeholder:text-gray-500 text-sm"
                            required
                          />

                          {/* Quick Tag Prompts */}
                          <div className="pt-1">
                            <span className="text-[11px] text-gray-400 block mb-1.5 font-medium">
                              Quick tags (click to add):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_TAGS.map((tag, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => addQuickTag(tag)}
                                  className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors">
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isPending}
                          className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white font-semibold h-11 rounded-xl shadow-lg shadow-neon-blue/20">
                          {isPending
                            ? "Submitting..."
                            : isEditing
                              ? "Update Review"
                              : "Publish Verified Review"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Recent Verified Reviews List */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-neon-blue" />
                  Verified Student Reviews ({reviews.length})
                </h3>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center rounded-2xl glass-card border-white/10 text-gray-400">
                  <Star className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-gray-300">
                    No reviews yet for {tutor.name}.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Be the first verified student to share your experience!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl glass-card border border-white/10 bg-white/[0.01] space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-white/10">
                            <AvatarImage
                              src={
                                rev.user?.avatar || rev.user?.image || undefined
                              }
                            />
                            <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                              {rev.user?.name?.slice(0, 2).toUpperCase() ||
                                "ST"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {rev.user?.name || "Student"}
                              </span>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                                Verified
                              </Badge>
                            </div>
                            {rev.verifiedContext && (
                              <p className="text-[11px] text-gray-400">
                                {rev.verifiedContext}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {rev.comment}
                        </p>
                      )}

                      {/* Tutor Reply */}
                      {rev.responseText && (
                        <div className="p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/20 space-y-1 ml-4 sm:ml-8">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neon-purple">
                            <Award className="w-3.5 h-3.5" />
                            <span>Response from {tutor.name}</span>
                          </div>
                          <p className="text-xs text-gray-300 italic">
                            &ldquo;{rev.responseText}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ============================================================ */}
        {/* 4. BOOK 1-ON-1 MENTORSHIP DIALOG */}
        {/* ============================================================ */}
        <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
          <DialogContent className="max-w-xl bg-gray-950 border-white/20 text-white backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neon-blue" />
                Book Mentorship with {tutor.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400">Hourly Rate</span>
                <span className="text-base font-bold text-white flex items-center gap-0.5">
                  <NairaSign className="w-3.5 h-3.5 text-neon-blue" />
                  {tutor.hourlyRate
                    ? tutor.hourlyRate.toLocaleString()
                    : "10,000"}
                  <span className="text-xs text-gray-400 font-normal">/hr</span>
                </span>
              </div>

              <div>
                <Label className="text-xs text-gray-300">Topic / Focus</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 bg-white/5 border-white/20 text-white text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300">
                  Preferred Date & Time
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1 bg-white/5 border-white/20 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-300">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={30}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 bg-white/5 border-white/20 text-white text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-300">Package</Label>
                  <select
                    value={packageCode}
                    onChange={(e) => setPackageCode(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-white/20 bg-gray-900 px-3 py-2 text-white text-xs">
                    {packageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-300">Booking Mode</Label>
                <select
                  value={bookingMode}
                  onChange={(e) => setBookingMode(e.target.value as any)}
                  className="mt-1 w-full rounded-md border border-white/20 bg-gray-900 px-3 py-2 text-white text-xs">
                  <option value="INSTANT">Instant pay-and-book</option>
                  <option value="REQUEST">
                    Request first (mentor confirms)
                  </option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-gray-300">
                  Notes & Questions for Tutor
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Code review for my portfolio project, interview prep..."
                  className="mt-1 bg-white/5 border-white/20 text-white text-xs"
                />
              </div>

              <Button
                disabled={isSubmittingBooking}
                onClick={handleBookingCheckout}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold h-10 mt-2 shadow-lg shadow-neon-blue/20">
                {isSubmittingBooking
                  ? "Connecting to Paystack..."
                  : "Proceed to Book Session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* 5. QR CODE MODAL FOR TUTOR */}
        {/* ============================================================ */}
        <CertificateQrModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          credentialId={`tutor/${tutor.referralCode || tutor.username || tutor.id}`}
          studentName={tutor.name}
          certificateTitle={`PalmTechnIQ Instructor · ${tutor.title}`}
        />
      </div>
    </div>
  );
}
