import {
  getTutorStudents,
  getTutorStudentsWithTrends,
} from "@/actions/student";
import { TutorStudentsClient } from "@/components/pages/tutor/student/tutor-student-client";

export default async function TutorStudentsPage() {
  const { students, stats } = await getTutorStudents();
  const { trends } = await getTutorStudentsWithTrends();

  if (!students || !stats) {
    return (
      <div className="p-6 text-red-500">
        Unauthorized or failed to load data.
      </div>
    );
  }

  return (
    <TutorStudentsClient students={students} stats={stats} trends={trends} />
  );
}
