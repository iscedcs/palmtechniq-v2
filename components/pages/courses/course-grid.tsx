"use client";

import { addToCart } from "@/actions/cart";
import {
  CoursePreviewModal,
  FlashSaleTimer,
} from "@/components/conversion-features";
import { DynamicPriceDisplay } from "@/components/dynamic-pricing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDurationMinutes, generateRandomAvatar } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Clock,
  Play,
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CoursesGrid({
  courses,
  categories,
}: {
  courses: CourseItem[];
  categories: { id: string; name: string }[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showGroupBuying, setShowGroupBuying] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    course: CourseItem | null;
  }>({ isOpen: false, course: null });

  const filteredCourses = courses
    .filter((course: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        (course.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(searchLower)
        ) ||
        (course.tutor?.user?.name || "").toLowerCase().includes(searchLower);
      const matchesCategory =
        selectedCategory === "all" ||
        (typeof course.category === "string" &&
          course.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.averageRating! - a.averageRating!;
        case "price-low":
          return (a.currentPrice ?? a.price) - (b.currentPrice ?? b.price);
        case "price-high":
          return (b.currentPrice ?? b.price) - (a.currentPrice ?? a.price);
        case "popular":
        default:
          return b.totalStudents! - a.totalStudents!;
      }
    });

  return (
    <div className="">
      <section className="min-h-screen bg-background">
        <section className="py-8 border-b border-white/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search courses, instructors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-card border-white/20 focus:border-neon-blue/50"
                />
              </div>

              <div className="flex gap-4">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 glass-card border-white/20">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 glass-card border-white/20">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">
                      Price: High → Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-16">
                No courses match your search/filter.
              </div>
            ) : (
              filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="group cursor-pointer">
                  <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                    <div className="relative">
                      <img
                        src={course.thumbnail || generateRandomAvatar()}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />

                      {/* Preview Button */}
                      {course.previewVideo && (
                        <motion.button
                          onClick={() =>
                            setPreviewModal({ isOpen: true, course })
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ scale: 1.1 }}>
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </motion.button>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="bg-gradient-to-r from-green-500 to-glass-light text-white border-none">
                          {course.level}
                        </Badge>

                        {course.demandLevel === "high" && (
                          <Badge className="bg-gradient-to-r from-red-500 to-orange-400 text-white border-none">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        {course.isFlashSale && course.flashSaleEnd && (
                          <FlashSaleTimer endTime={course.flashSaleEnd} />
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-all duration-300">
                        {course.title}
                      </h3>

                      <div className="flex items-center mb-4">
                        <Avatar className="w-8 h-8 mr-3">
                          <AvatarImage
                            src={
                              course.tutor?.user?.image ||
                              generateRandomAvatar()
                            }
                            alt={course.tutor?.user?.name || "Instructor"}
                          />
                          <AvatarFallback>
                            {course.tutor?.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-300 text-sm">
                          {course.tutor?.user?.name}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-4">
                        {course.description.slice(0, 120)}...
                      </p>

                      {/* Social Proof */}
                      <div className="flex items-center justify-between mb-4 text-sm">
                        <div className="flex items-center text-yellow-400">
                          <Star className="w-4 h-4 fill-current mr-1" />
                          {course.averageRating}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Users className="w-4 h-4 mr-1" />
                          {course.enrollments || 0}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDurationMinutes(course.duration!)}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.tags?.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs border-white/20 text-gray-300">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Pricing */}
                      <div className="mb-4">
                        <DynamicPriceDisplay
                          priceChangeIn={
                            course.flashSaleEnd
                              ? Math.max(
                                  0,
                                  (new Date(course.flashSaleEnd).getTime() -
                                    Date.now()) /
                                    60000
                                )
                              : 0
                          }
                          basePrice={course.basePrice}
                          currentPrice={course.currentPrice}
                          demandLevel={course.demandLevel}
                        />
                      </div>

                      {/* Group Buying Option */}
                      {course.groupBuyingEnabled && (
                        <div className="mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                            onClick={() =>
                              setShowGroupBuying(
                                showGroupBuying === course.id ? null : course.id
                              )
                            }>
                            <Users className="w-4 h-4 mr-2" />
                            Group Buying Available - Save up to 50%!
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 justify-between">
                        <Button
                          asChild
                          className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple text-white mr-2">
                          <Link href={`/courses/${course.id}`}>Enroll Now</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                          <Users className="w-4 h-4" />
                        </Button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={async () => {
                            if (status === "unauthenticated") {
                              toast(
                                "Please sign in to add items to your cart.",
                                {
                                  description:
                                    "Sign in or create an account to continue.",
                                }
                              );
                              router.push("/login");
                              return;
                            }

                            try {
                              const res = await addToCart(course.id);
                              if (res?.success) {
                                toast.success(
                                  `${course.title} added to your cart`,
                                  {
                                    description:
                                      "View cart or continue shopping.",
                                  }
                                );
                              } else {
                                toast.error(
                                  res?.message || "Failed to add to cart"
                                );
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error(
                                "Something went wrong while adding to cart"
                              );
                            }
                          }}
                          className=" border rounded-lg p-3 border-white/20 text-white bg-transparent hover:bg-white/10 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
      <CoursePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, course: null })}
        courseTitle={previewModal.course?.title || ""}
        previewUrl={previewModal.course?.previewVideo}
      />
    </div>
  );
}
