"use client";

import { Button } from "@/components/ui/button";
import { Package, PlusCircle } from "lucide-react";
import Link from "next/link";

export function TutorCoursesHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Courses</h1>
        <p className="text-gray-400">
          Manage your courses, track performance, and create new ones.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Bundles live on their own page, but this is where a tutor looks
            for them. */}
        <Link href="/tutor/bundles">
          <Button variant="outline" className="border-white/20">
            <Package className="w-4 h-4 mr-2" />
            Bundles
          </Button>
        </Link>
        <Link href="/tutor/courses/create">
          <Button className="bg-gradient-to-r from-neon-blue to-neon-purple">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>
    </div>
  );
}
