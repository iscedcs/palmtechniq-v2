import StudentProgress from "@/components/pages/student/progress/progress-comp";
import { getStudentProgressData } from "@/data/studentprogress";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const progressData = await getStudentProgressData();

  if ("error" in progressData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Error Loading Progress</h1>
        <p className="text-gray-600">{progressData.error}</p>
      </div>
    );
  }

  return (
    <div>
      <StudentProgress {...progressData} />
    </div>
  );
}
