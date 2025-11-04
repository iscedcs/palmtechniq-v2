import { Card } from "@/components/ui/card";
import { useCourseCompletion } from "@/hooks/use-course-completion";
import { motion } from "framer-motion";

export function CourseCompletionTracker() {
  const { completion, stageHints } = useCourseCompletion();

  return (
    <Card className="fixed top-16 right-6 w-[280px] bg-white/5 border-white/10 backdrop-blur-md z-50 shadow-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-white text-sm font-semibold">Course Setup</h4>
        <span className="text-xs text-gray-300">{completion}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${
            completion < 40
              ? "bg-red-400"
              : completion < 70
              ? "bg-yellow-400"
              : "bg-neon-green"
          }`}
        />
      </div>
      {stageHints.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-gray-300">
          {stageHints.slice(0, 3).map((hint, i) => (
            <li key={i}>• {hint}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
