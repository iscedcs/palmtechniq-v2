"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Play, ShoppingCart, Share2 } from "lucide-react";
import Link from "next/link";
import CourseCheckoutDetails from "../checkout/checkout-course";

export default function StickyPurchaseCard({
  currentPrice,
  originalPrice,
  discount,
  duration,
  lessons,
  level,
  language,
  certificate,
  isEnrolled,
  isInCart,
  courseId,
}: {
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  lessons: number;
  level: string;
  language: string;
  certificate: boolean;
  isEnrolled: boolean;
  isInCart: boolean;
  courseId: string;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="sticky top-24">
      <Card className="glass-card border-white/10 hover-glow">
        <CardContent className="p-6">
          {isEnrolled && (
            <div className="text-center mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">You're enrolled!</p>
            </div>
          )}

          {/* Pricing */}
          {!isEnrolled && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-white">
                  ₦{currentPrice.toLocaleString()}
                </span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ₦{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discount && discount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {discount}% OFF
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={() => console.log("Enroll clicked")}
              className="w-full text-white text-lg py-3 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 transition">
              {isEnrolled ? (
                
                <Link href={`/courses/${courseId}/learn`} className="flex items-center justify-center w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </Link>
              ) : isInCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Cart
                </>
              ) : (
                <Link
                  href={`/courses/${courseId}/checkout`}
                  className="flex mx-auto items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enroll Now
                </Link>
              )}
            </Button>

            {!isEnrolled && (
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                onClick={() => setIsWishlisted(!isWishlisted)}>
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    isWishlisted ? "fill-current text-red-400" : ""
                  }`}
                />
                {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              </Button>
            )}
          </div>

          {/* Course Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{duration}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Lessons</span>
              <span className="text-white">{lessons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Level</span>
              <span className="text-white">{level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Language</span>
              <span className="text-white">{language}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Certificate</span>
              <span className="text-white">{certificate ? "Yes" : "No"}</span>
            </div>
          </div>

          {/* Share Button */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Share2 className="w-4 h-4 mr-2" />
              Share Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
