"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TutorCourseStatusBadge } from "./shared/tutor-course-status-badge";
import { TutorCourseActionsMenu } from "./shared/tutor-course-actions-menu";
import { TutorCourseStatsRow } from "./shared/tutor-course-stats-row";
import { TutorCourseProgress } from "./shared/tutor-course-progress";
import Image from "next/image";
import { formatDurationMinutes, generateRandomAvatar } from "@/lib/utils";
import { motion } from "framer-motion";
import { LinkIcon, Check } from "lucide-react";
import { useState, useTransition } from "react";
import { getMyReferralCode } from "@/actions/tutor-actions";
import { toast } from "sonner";

interface TutorCourseCardProps {
  course: {
    id: string;
    title: string;
    thumbnail?: string | null;
    status: "draft" | "published";
    isPopular?: boolean;
    lessonsCount: number;
    duration: number;
    studentsCount: number;
    avgRating: number | null;
    earnings: number;
    growth: number;
    completionRate: number;
    updatedAt: string;
  };
}

export function TutorCourseCard({ course }: TutorCourseCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fallbackThumbnail = generateRandomAvatar();

  if (!course) return null;

  const handleCopyReferralLink = () => {
    startTransition(async () => {
      const res = await getMyReferralCode();
      if (res.error || !res.referralCode) {
        toast.error(res.error || "Could not generate referral link");
        return;
      }
      const referralUrl = `${window.location.origin}/courses/${course.id}?ref=${res.referralCode}`;
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied! Share to earn 50% on enrollments.");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5 }}>
      <Card className="relative glass-card border-white/10 hover:scale-105 transition-transform duration-300 overflow-hidden">
        {/* Thumbnail */}
        <Image
          src={course.thumbnail || fallbackThumbnail}
          width={100}
          height={100}
          alt={course.title}
          className="w-full h-40 object-cover"
        />

        {/* Status + Actions */}
        <div className="absolute top-2 left-2 flex gap-2">
          <TutorCourseStatusBadge
            status={course.status}
            isPopular={course.isPopular}
          />
        </div>
        <TutorCourseActionsMenu />

        {/* Content */}
        <div className="p-4">
          <Link href={`/tutor/courses/${course.id}/edit`}>
            <h3 className="text-lg font-semibold text-white hover:underline line-clamp-2">
              {course.title}
            </h3>
          </Link>

          <p className="text-sm text-gray-400 mt-1">
            📚 {course.lessonsCount} lessons • ⏱{" "}
            {formatDurationMinutes(course.duration)}
          </p>

          <TutorCourseStatsRow
            students={course.studentsCount}
            rating={course.avgRating}
            earnings={course.earnings}
            growth={course.growth}
          />

          <TutorCourseProgress
            completionRate={course.completionRate}
            updatedAt={course.updatedAt}
          />

          <div className="flex justify-between items-center mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleCopyReferralLink}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent text-xs">
              {copied ? (
                <Check className="w-3 h-3 mr-1 text-green-400" />
              ) : (
                <LinkIcon className="w-3 h-3 mr-1" />
              )}
              {copied ? "Copied!" : "Referral Link"}
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <Link href={`/tutor/courses/${course.id}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
