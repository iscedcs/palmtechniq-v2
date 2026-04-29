import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Find answers to frequently asked questions about PalmTechnIQ courses, enrollment, mentorship, payments, and platform features.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "Help Center | PalmTechnIQ",
    description:
      "FAQs and support for courses, enrollment, mentorship, payments, and platform features.",
    url: "https://palmtechniq.com/help",
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I enroll in a course?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To enroll in a course, browse our course catalog, select a course you're interested in, and click 'Enroll Now'. You'll be guided through the payment process if the course is paid.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get a refund?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your purchase, contact our support team for a full refund.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI coach work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI coach uses machine learning to provide personalized feedback on your assignments and quiz answers. It adapts to your learning style and provides targeted recommendations.",
      },
    },
    {
      "@type": "Question",
      name: "Can I schedule a mentorship session?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, browse our available mentors, check their availability, and book a session that works for your schedule. You can communicate directly with your mentor before the session.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer certificates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, upon completing a course with a passing grade, you'll receive a certificate of completion that you can share on LinkedIn and your resume.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to complete a course?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Course duration varies, but most courses can be completed in 4-12 weeks with 5-10 hours of study per week. You can learn at your own pace.",
      },
    },
  ],
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      {children}
    </>
  );
}
