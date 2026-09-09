"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

interface Project {
  id: string | number;
  title: string;
  student: string;
  course: string;
  submitted: string;
  dueDate: string;
}

export function TutorDashboardProjects({ projects }: { projects: Project[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}>
      <Card className="glass-card border-white/10">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Pending Projects</h3>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs shrink-0">
              {projects.length} awaiting review
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No pending projects to review.
            </p>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-semibold text-sm sm:text-base group-hover:text-gradient transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs sm:text-sm text-gray-400">
                      <span>by {project.student}</span>
                      <span>•</span>
                      <span className="truncate max-w-[150px] sm:max-w-none">{project.course}</span>
                      <span>•</span>
                      <span>Submitted {project.submitted}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 gap-1.5">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
                    Review
                  </Button>
                  <p className="text-gray-400 text-[11px] sm:text-xs">
                    Due {project.dueDate}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
