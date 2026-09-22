/**
 * Shared building blocks for the /learn topic hubs.
 *
 * These are deliberately server components with no framer-motion. The rest of
 * the marketing pages animate on entry, but these are long-form reading pages
 * whose whole job is to rank and be read — and the course page currently spends
 * ~1s of main-thread time booting client JavaScript. Matching the visual
 * language (cyber-grid, glass-card, text-gradient, gray-300 body) costs nothing;
 * matching the motion would cost the thing these pages exist for.
 *
 * Body text is text-gray-300 rather than text-muted-foreground: on this
 * dark-only theme `--muted-foreground` resolves to a dark colour and disappears
 * against the background.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Faq, GuideSection } from "@/data/learn/cybersecurity";

export function LearnHero({
  eyebrow,
  title,
  highlight,
  intro,
  meta,
}: {
  eyebrow: string;
  title: string;
  /** Rendered in the gradient, after `title`. */
  highlight?: string;
  intro: string;
  /** e.g. "Updated 22 September 2026 · 8 min read" */
  meta?: string;
}) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16">
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div
        aria-hidden
        className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-neon-purple/10 blur-3xl"
      />
      <div className="container relative z-10 mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <Badge className="mb-6 border-neon-purple/30 bg-neon-purple/20 text-neon-purple">
            {eyebrow}
          </Badge>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            <span className="text-white">{title}</span>
            {highlight ? <span className="text-gradient"> {highlight}</span> : null}
          </h1>
          <p className="text-lg text-gray-300 md:text-xl">{intro}</p>
          {meta ? <p className="mt-6 text-sm text-gray-400">{meta}</p> : null}
        </div>
      </div>
    </section>
  );
}

/** Long-form body copy. Kept to one column at a readable measure. */
export function LearnSections({ sections }: { sections: GuideSection[] }) {
  const written = sections.filter(
    (section) => section.body.length > 0 || section.bullets?.length,
  );
  if (written.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          {written.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="text-base leading-relaxed text-gray-300 md:text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-gray-300">
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neon-blue" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LearnFaqs({ faqs }: { faqs: Faq[] }) {
  const answered = faqs.filter((faq) => faq.answer.trim().length > 0);
  if (answered.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            Common questions
          </h2>
          <div className="space-y-4">
            {answered.map((faq) => (
              <Card key={faq.question} className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold text-white">
                    {faq.question}
                  </h3>
                  <p className="text-gray-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export type GuideLink = {
  slug: string;
  title: string;
  description: string;
};

export function GuideList({
  guides,
  basePath,
}: {
  guides: GuideLink[];
  basePath: string;
}) {
  if (guides.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            Guides
          </h2>
          <div className="grid gap-4">
            {guides.map((guide) => (
              <Card
                key={guide.slug}
                className="glass-card hover-glow border-white/10">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-semibold">
                    {/* The title is the link: descriptive anchor text is what a
                        crawler reads as the destination's subject. */}
                    <Link
                      href={`${basePath}/${guide.slug}`}
                      className="text-white transition-colors hover:text-neon-blue">
                      {guide.title}
                    </Link>
                  </h3>
                  <p className="text-gray-300">{guide.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export type RelatedCourse = {
  title: string;
  path: string;
  level?: string | null;
};

/** The conversion step: reading ends, the course is one click away. */
export function RelatedCourses({
  courses,
  heading = "Learn this with a tutor",
  blurb,
}: {
  courses: RelatedCourse[];
  heading?: string;
  blurb?: string;
}) {
  if (courses.length === 0) return null;

  return (
    <section className="pb-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <Card className="glass-card border-white/10">
            <CardContent className="p-8">
              <h2 className="mb-2 text-2xl font-bold text-white">{heading}</h2>
              {blurb ? <p className="mb-6 text-gray-300">{blurb}</p> : null}
              <div className="grid gap-3">
                {courses.map((course) => (
                  <Link
                    key={course.path}
                    href={course.path}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:border-neon-blue/40 hover:bg-white/10">
                    <span className="font-medium text-white">
                      {course.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm text-gray-400 transition-colors group-hover:text-neon-blue">
                      {course.level ? <span>{course.level}</span> : null}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
