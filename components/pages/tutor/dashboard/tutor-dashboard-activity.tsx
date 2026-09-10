"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Activity {
  type: "enrollment" | "review" | "mentorship" | "project";
  message: string;
  time: string;
}

export function TutorDashboardActivity({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}>
      <Card className="glass-card border-white/10">
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    activity.type === "enrollment"
                      ? "bg-green-400"
                      : activity.type === "review"
                      ? "bg-yellow-400"
                      : activity.type === "mentorship"
                      ? "bg-blue-400"
                      : "bg-purple-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs sm:text-sm break-words">{activity.message}</p>
                  <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
