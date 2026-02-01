"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSection } from "./hero-section";
import { StatsSection } from "./stats-section";
import { SearchFilterBar } from "./search-filter-bar";
import { StudentList } from "./student-list";
import { StudentDetailModal } from "./student-data-model";

export function TutorStudentsClient({ students, stats, trends }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "recent">(
    "recent"
  );
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (searchTerm.trim()) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      list = list.filter((s) => s.status === filterStatus);
    }

    if (sortBy === "progress") {
      list.sort((a, b) => b.totalProgress - a.totalProgress);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "recent") {
      list.sort(
        (a, b) =>
          new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      );
    }

    return list;
  }, [students, searchTerm, filterStatus, sortBy]);

  const studentCounts = {
    total: students.length,
    active: students.filter((s: any) => s.status === "active").length,
    completed: students.filter((s: any) =>
      s.coursesEnrolled.some((c: any) => c.status === "completed")
    ).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <section className="py-8">
        <div className="container mx-auto px-6">
          <StatsSection stats={stats} trends={trends} />
        </div>
      </section>

      <section className="py-8 pb-16">
        <div className="container mx-auto px-6">
          <Card className="glass-card border-white/10">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              studentCounts={studentCounts}
            />
            <CardContent className="p-6">
              <StudentList
                students={filteredStudents}
                onSelectStudent={setSelectedStudent}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
