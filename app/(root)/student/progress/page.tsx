import StudentProgress from "@/components/pages/student/progress/progress-comp";
import { getStudentProgressData } from "@/data/studentprogress";

export default async function ProgressPage() {
  const progressData = await getStudentProgressData();

  return (
    <div>
      <StudentProgress {...progressData} />
    </div>
  );
}
