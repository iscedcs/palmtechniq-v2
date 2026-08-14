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
      "PalmTechnIQ is a learning marketplace where anyone can learn a skill — from tailoring and auto repair to design, coding and AI — or teach what they know and earn from it.",
    email: "support@palmtechniq.com",
    sameAs: [
      "https://www.facebook.com/palmtechniq/",
      "https://www.instagram.com/palmtechniq",
      "https://www.linkedin.com/company/palmtechniq/",
      "https://www.youtube.com/@palmtechniq_official",
      "https://x.com/palmtechniq/",
    ],
    areaServed: "Worldwide",
    // Mirrors the real category list, which spans trades and creative skills
    // as well as technology. Declaring only "Tech Courses" told search engines
    // the catalogue was narrower than it is.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Courses & Skills",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "AI, Data Science & Machine Learning",
        },
        {
          "@type": "OfferCatalog",
          name: "Web, Mobile & Cloud Development",
        },
        {
          "@type": "OfferCatalog",
          name: "Cybersecurity",
        },
        {
          "@type": "OfferCatalog",
          name: "Design, Photography & Creative Skills",
        },
        {
          "@type": "OfferCatalog",
          name: "Business, Marketing & Entrepreneurship",
        },
        {
          "@type": "OfferCatalog",
          name: "Trades & Vocational Skills",
        },
        {
          "@type": "OfferCatalog",
          name: "Health, Lifestyle & Personal Development",
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
