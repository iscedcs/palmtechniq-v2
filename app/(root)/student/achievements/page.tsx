import AchievementsClient from "@/components/pages/student/achievements/achievements-comp";
import { getStudentAchievementsData } from "@/data/studentprogress";

export const dynamic = "force-dynamic";

export default async function StudentAchievementsPage() {
  const data = await getStudentAchievementsData();

  if ("error" in data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Error Loading Achievements</h1>
        <p className="text-gray-600">{data.error}</p>
      </div>
    );
  }

  return <AchievementsClient {...data} />;
}
