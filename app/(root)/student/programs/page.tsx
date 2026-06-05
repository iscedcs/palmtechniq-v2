import React from "react";
import { Metadata } from "next";
import StudentProgramEnrollments from "@/components/enrollment/student-program-enrollments";

export const metadata: Metadata = {
  title: "My Program Enrollments | PalmTechnIQ",
  description: "View and manage your professional program enrollments",
};

export default function StudentEnrollmentsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My Program Enrollments
          </h1>
          <p className="mt-2 text-gray-300 max-w-2xl">
            Track your enrolled programs, review remaining installment balances, and complete payments from your student dashboard.
          </p>
        </div>

        <StudentProgramEnrollments />
      </div>
    </div>
  );
}
