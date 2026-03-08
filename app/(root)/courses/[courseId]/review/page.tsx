import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CourseReviewActions } from "@/components/course-review-actions";

export const dynamic = "force-dynamic";

export default async function CourseReviewPage(props: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const { courseId } = await props.params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      tutor: { select: { userId: true, user: { select: { name: true } } } },
      creator: { select: { name: true, email: true } },
      category: { select: { name: true } },
      modules: {
        include: {
          lessons: { select: { id: true, title: true, duration: true } },
        },
      },
      reviews: { take: 5, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
          modules: true,
        },
      },
    },
  });

  if (!course) {
    redirect("/admin/courses");
  }

  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "DRAFT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ARCHIVED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "SUSPENDED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Review Course Changes
          </h1>
          <p className="text-gray-400">
            Review pending changes made to this course before approval
          </p>
        </div>

        {/* Course Header */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-white">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-gray-400">{course.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <Badge
                  className={`mt-2 border ${getStatusColor(course.status)}`}
                >
                  {course.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Category</p>
                <p className="text-sm text-white mt-2">{course.category.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Price</p>
                <p className="text-sm text-white mt-2">
                  ₦{course.currentPrice || course.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Level</p>
                <p className="text-sm text-white mt-2">{course.level}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-gray-500 uppercase">Enrollments</p>
                <p className="text-lg font-semibold text-white mt-2">
                  {course._count.enrollments}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Modules</p>
                <p className="text-lg font-semibold text-white mt-2">
                  {course._count.modules}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Lessons</p>
                <p className="text-lg font-semibold text-white mt-2">
                  {totalLessons}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Reviews</p>
                <p className="text-lg font-semibold text-white mt-2">
                  {course._count.reviews}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs text-gray-500 uppercase">Instructor</p>
              <p className="text-sm text-white">
                {course.tutor.user.name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Course Overview */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Course Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">
                Description
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {course.description}
              </p>
            </div>

            {course.requirements && course.requirements.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">
                  Requirements
                </p>
                <ul className="space-y-1">
                  {course.requirements.map((req, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-neon-blue">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.outcomes && course.outcomes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">
                  Outcomes
                </p>
                <ul className="space-y-1">
                  {course.outcomes.map((outcome, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-neon-purple">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.targetAudience && course.targetAudience.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">
                  Target Audience
                </p>
                <ul className="space-y-1">
                  {course.targetAudience.map((audience, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-neon-green">•</span>
                      <span>{audience}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Curriculum */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Curriculum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.modules.map((module, idx) => (
              <div key={module.id} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">
                    Module {idx + 1}: {module.title}
                  </h4>
                  <Badge variant="outline" className="border-white/20">
                    {module.lessons.length} lessons
                  </Badge>
                </div>
                <div className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between text-sm text-gray-300 pl-4 py-2"
                    >
                      <span>• {lesson.title}</span>
                      {lesson.duration && (
                        <span className="text-xs text-gray-500">
                          {lesson.duration} min
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        {course.reviews && course.reviews.length > 0 && (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">
                          {review.studentName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        ★ {review.rating}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <CourseReviewActions courseId={courseId} />
      </div>
    </div>
  );
}
