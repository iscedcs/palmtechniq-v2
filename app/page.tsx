"use client";

import { CourseCategoriesSection } from "@/components/course-categories";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { InteractiveDemo } from "@/components/interactive-demo";
import { PricingSection } from "@/components/pricing-section";
import { StatsSection } from "@/components/stats-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ProblemSolutionSection } from "@/components/problem-solution-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { TrustSignalsSection } from "@/components/trust-signals-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TrustSignalsSection />
      <TestimonialsSection />
      <StatsSection />
      <CourseCategoriesSection />
      <InteractiveDemo />
      {/* <PricingSection /> */}
      <Footer />
    </div>
  );
}
