import { CourseCategoriesSection } from "@/components/course-categories";
import { DemoSection } from "@/components/demo-section";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { ProblemSolutionSection } from "@/components/problem-solution-section";
import { StatsSection } from "@/components/stats-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "PalmTechnIQ — Learn Any Skill, from Tailoring to AI",
  description:
    "Master a trade, a craft, or AI and technology — with practical courses, real projects and mentorship. Already skilled? Publish a course and get paid to your bank.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PalmTechnIQ — Learn Any Skill, from Tailoring to AI",
    description:
      "Practical courses, real projects and mentorship. Already skilled? Publish a course and get paid.",
    url: SITE_URL,
    type: "website",
  },
};

export default function HomePage() {
  // The organisation and website nodes live in the root layout, emitted once
  // for every page. They used to be duplicated here with a different shape,
  // which gave the homepage two disagreeing descriptions of the same entity.
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      {/* <TrustSignalsSection /> */}
      <TestimonialsSection />
      <StatsSection />
      <CourseCategoriesSection />
      <DemoSection />
      {/* <PricingSection /> */}
      <Footer />
    </div>
  );
}
