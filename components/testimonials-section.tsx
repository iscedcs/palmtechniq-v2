"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateRandomAvatar } from "@/lib/utils";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "AdTech Specialist at Google",
    company: "Google",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "PalmTechnIQ prepared me perfectly for my AdTech role. The hands-on projects and AI coach made all the difference in landing at Google.",
    course: "AdTech Fundamentals",
    gradient: "from-neon-blue to-cyan-400",
  },
  {
    name: "Marcus Johnson",
    role: "Performance Marketing Manager at Meta",
    company: "Meta",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "The program's focus on real-world AdTech tools and platform optimization helped me excel from day one in my role.",
    course: "Performance Marketing Mastery",
    gradient: "from-neon-purple to-pink-400",
  },
  {
    name: "Elena Rodriguez",
    role: "Data Analyst at The Trade Desk",
    company: "The Trade Desk",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "The advanced analytics curriculum and project-based learning gave me the exact skills I needed for my analytics role at The Trade Desk.",
    course: "AdTech Analytics Pro",
    gradient: "from-neon-green to-emerald-400",
  },
  {
    name: "David Kim",
    role: "Account Executive at AppNexus",
    company: "AppNexus",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "The mentorship from industry leaders helped me understand the AdTech ecosystem deeply. My career advancement has been incredible.",
    course: "AdTech Sales Mastery",
    gradient: "from-neon-orange to-yellow-400",
  },
  {
    name: "Priya Patel",
    role: "Product Manager at Criteo",
    company: "Criteo",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "The product management track for AdTech was incredibly comprehensive. It prepared me for all aspects of AdTech product development.",
    course: "AdTech Product Management",
    gradient: "from-red-400 to-pink-400",
  },
  {
    name: "Alex Thompson",
    role: "Engineer at PubMatic",
    company: "PubMatic",
    avatar: generateRandomAvatar(),
    rating: 5,
    text: "As an engineer, I appreciated the technical depth combined with real AdTech industry context. A game-changer for my career.",
    course: "AdTech Engineering Fundamentals",
    gradient: "from-indigo-400 to-purple-400",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <motion.div
        className="absolute bottom-0 left-1/3 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">Trusted by</span>{" "}
            <span className="text-white">Professionals</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join hundreds of successful alumni already working at top companies
            including Google, Meta, and The Trade Desk
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group">
              <Card className="glass-card hover-glow h-full border-white/10 overflow-hidden relative">
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <Quote className="w-8 h-8 text-neon-blue mb-4 opacity-50" />

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-300 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>

                  {/* Course Badge */}
                  <Badge
                    className={`bg-gradient-to-r ₦{testimonial.gradient} text-white border-none mb-6`}>
                    {testimonial.course}
                  </Badge>

                  {/* Author */}
                  <div className="flex items-center">
                    <Avatar className="w-12 h-12 mr-4">
                      <AvatarImage
                        src={testimonial.avatar || generateRandomAvatar()}
                        alt={testimonial.name}
                      />
                      <AvatarFallback
                        className={`bg-gradient-to-r ₦{testimonial.gradient} text-white`}>
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-white font-semibold">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  {/* Hover Gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ₦{testimonial.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
