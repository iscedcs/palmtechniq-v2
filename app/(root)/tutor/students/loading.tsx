"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingStudents() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Skeleton */}
      <section className="pt-32 pb-8">
        <div className="container mx-auto px-6">
          <Skeleton className="h-16 w-64 mb-4" />
          <Skeleton className="h-8 w-96 mb-12" />

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card border-white/10">
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-8 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
