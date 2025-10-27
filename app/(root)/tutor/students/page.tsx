import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRole } from "@/types/user";
import { HeroSection } from "@/components/pages/tutor/student/hero-section";
import { StatsSection } from "@/components/pages/tutor/student/stats-section";
import { SearchFilterBar } from "@/components/pages/tutor/student/search-filter-bar";
import { StudentList } from "@/components/pages/tutor/student/student-list";
import { StudentDetailModal } from "@/components/pages/tutor/student/student-data-model";
import { getTutorStudents } from "@/actions/student";

export default async function TutorStudentsPage() {
  const { students, stats } = await getTutorStudents();
  // console.log("📊 Stats:", stats);
  // console.log("🎓 Students:", students);

  if (!students || !stats) {
    return (
      <div className="p-6 text-red-500">
        Unauthorized or failed to load data.
      </div>
    );
  }
  const studentCounts = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    completed: students.filter((s) =>
      s.coursesEnrolled.some((c: any) => c.status === "completed")
    ).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <StatsSection stats={stats} />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-6">
          <Card className="glass-card border-white/10">
            {/* Search and Filter Bar */}
            {/* <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              studentCounts={studentCounts}
            /> */}

            {/* Student List */}
            <CardContent className="p-6">
              {/* <StudentList
                students={sortedStudents}
                onSelectStudent={setSelectedStudent}
              /> */}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Student Detail Modal */}
      {/* <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      /> */}
    </div>
  );
}
