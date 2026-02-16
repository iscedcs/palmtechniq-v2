"use client";

import { CourseCategoriesSection } from "@/components/course-categories";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { InteractiveDemo } from "@/components/interactive-demo";
import { PricingSection } from "@/components/pricing-section";
import { StatsSection } from "@/components/stats-section";
import { TestimonialsSection } from "@/components/testimonials-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CourseCategoriesSection />
      <InteractiveDemo />
      <TestimonialsSection />
      {/* <PricingSection /> */}
      <Footer />
    </div>
  );
}
