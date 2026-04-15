import { CourseCategoriesSection } from "@/components/course-categories";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { DemoSection } from "@/components/demo-section";
import { PricingSection } from "@/components/pricing-section";
import { StatsSection } from "@/components/stats-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ProblemSolutionSection } from "@/components/problem-solution-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { TrustSignalsSection } from "@/components/trust-signals-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PalmTechnIQ - Learn AI, Web Development & Data Science Online",
  description:
    "Master in-demand tech skills with PalmTechnIQ. Practical courses in AI, web development, data science, and more — with expert mentorship and real-world projects.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PalmTechnIQ - Learn AI, Web Development & Data Science Online",
    description:
      "Master in-demand tech skills with practical courses, expert mentorship, and real-world projects.",
    url: "https://palmtechniq.com",
    type: "website",
  },
};

export default function HomePage() {
  const educationalOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "PalmTechnIQ",
    url: "https://palmtechniq.com",
    logo: "https://palmtechniq.com/opengraph-image",
    description:
      "Advanced e-learning platform for AI, web development, data science, and career-focused technical skills.",
    email: "support@palmtechniq.com",
    sameAs: [
      "https://www.facebook.com/palmtechniq/",
      "https://www.instagram.com/palmtechniq",
      "https://www.linkedin.com/company/palmtechniq/",
      "https://www.youtube.com/@palmtechniq_official",
      "https://x.com/palmtechniq/",
    ],
    areaServed: "Worldwide",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Tech Courses",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "AI & Data Science Courses",
        },
        {
          "@type": "OfferCatalog",
          name: "Web Development Courses",
        },
        {
          "@type": "OfferCatalog",
          name: "Career-Focused Technical Skills",
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json">
        {JSON.stringify(educationalOrgJsonLd)}
      </script>
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
