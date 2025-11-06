"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TutorCoursesHeader } from "@/components/pages/tutor/tutor-courses-header";
import { TutorCourseCard } from "@/components/pages/tutor/tutor-course-card";
import { TutorCoursesFilters } from "@/components/pages/tutor/tutor-courses-filters";
import { TutorCoursesEmpty } from "@/components/pages/tutor/tutor-courses-empty";
import TutorCoursesStats from "@/components/pages/tutor/tutor-courses-stats";

export function TutorCoursesClient({ courses }: { courses: any[] }) {
  const [filteredCourses, setFilteredCourses] = useState(courses);

  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <TutorCoursesHeader />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <TutorCoursesStats courses={courses} />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}>
            <TutorCoursesFilters
              courses={courses}
              onFilter={setFilteredCourses}
            />
          </motion.div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}>
              {filteredCourses.map((course) => (
                <TutorCourseCard key={course.id} course={course} />
              ))}
            </motion.div>
          ) : (
            <TutorCoursesEmpty />
          )}
        </div>
      </section>
    </div>
  );
}
