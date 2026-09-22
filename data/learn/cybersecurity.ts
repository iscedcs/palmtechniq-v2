/**
 * Content for the /learn/cybersecurity topic hub.
 *
 * WHY THIS EXISTS
 *
 * Of the site's 69 indexed URLs, roughly 50 are "buy now" pages — course
 * detail and enrolment. Nothing answers the questions someone asks *before*
 * they are ready to enrol ("is cybersecurity a good career here", "do I need a
 * degree"). Those searches are where the volume is, and where a small site can
 * still rank, so this hub targets them and links through to the courses.
 *
 * HOW TO EDIT
 *
 * Copy lives here, not in the components, so changing words never means
 * touching JSX. A guide with `status: "draft"` renders for preview but is kept
 * out of the sitemap and marked noindex — thin pages do not just fail to rank,
 * they drag down the pages around them. Flip to "published" once the body is
 * genuinely written, and the sitemap picks it up on the next deploy.
 *
 * Do not invent figures. Salary ranges, employer names and statistics must be
 * ones PalmTechnIQ can stand behind, with the source noted in `sources`.
 */

export type GuideStatus = "published" | "draft";

export type GuideSection = {
  heading: string;
  /** Each string is one paragraph. */
  body: string[];
  bullets?: string[];
};

export type Faq = { question: string; answer: string };

export type Guide = {
  slug: string;
  /** The <h1>. Phrase it as the reader's question where that reads naturally. */
  title: string;
  /** Meta title. Keep under ~60 characters; the layout appends "| PalmTechnIQ". */
  metaTitle: string;
  /** Meta description, ~150 characters. This is the text shown in results. */
  description: string;
  /** The search this page is written for. One per page — two means two pages. */
  targetQuery: string;
  /** ISO date. Shown to readers and emitted as dateModified. */
  updated: string;
  /** One or two sentences under the title. */
  intro: string;
  sections: GuideSection[];
  faqs?: Faq[];
  /** Paths of courses this guide should send readers to. */
  relatedCoursePaths?: string[];
  /** Citations for any figure or claim a reader could challenge. */
  sources?: { label: string; url: string }[];
  status: GuideStatus;
};

export const CYBERSECURITY_HUB = {
  slug: "cybersecurity",
  title: "Learn Cybersecurity",
  metaTitle: "Learn Cybersecurity — Guides, Paths and Courses",
  description:
    "Plain-English guides to starting in cybersecurity: what the work involves, which route suits you, what to learn first, and where certifications fit.",
  intro:
    "Everything here is written for people deciding whether cybersecurity is for them, and what to do first. No jargon, no prerequisites assumed.",
  /** Shown on the hub above the guide list. Factual, no invented numbers. */
  sections: [
    {
      heading: "What cybersecurity work actually involves",
      body: [
        "Cybersecurity is less about breaking into systems than most people expect. The everyday work is closer to defending them: watching for unusual activity, closing gaps before somebody finds them, and knowing what to do in the first hour after something goes wrong.",
        "It splits broadly into defensive work — monitoring, investigating and responding to incidents — and offensive work, where you attack systems with permission so the owner can fix what you find. Both matter, and most people start on the defensive side because that is where the majority of jobs are.",
      ],
    },
    {
      heading: "Who moves into it",
      body: [
        "The people who do well in our cohorts rarely arrive with a computer science degree. They come from IT support, networking, software development, and often from outside technology entirely. What they share is patience for detail and a habit of asking how something could fail.",
        "If you are weighing up the switch, start with the guides below rather than a course. It is worth knowing what the job is like before paying for training in it.",
      ],
    },
  ] satisfies GuideSection[],
  relatedCoursePaths: ["/courses/ethical-hacking", "/courses/cybersecurity-clxgfa"],
  categoryPath: "/courses/category/cybersecurity",
};

/**
 * The guides.
 *
 * Each targets one real search. The outlines below are the structure the copy
 * should follow — the headings are the sub-questions a reader arrives with, and
 * Google reads them as the page's shape. Fill `body` and publish.
 */
export const CYBERSECURITY_GUIDES: Guide[] = [
  {
    slug: "is-cybersecurity-a-good-career-in-nigeria",
    title: "Is cybersecurity a good career in Nigeria?",
    metaTitle: "Is Cybersecurity a Good Career in Nigeria?",
    description:
      "An honest look at demand, pay, entry routes and the trade-offs of a cybersecurity career in Nigeria — written for people deciding whether to start.",
    targetQuery: "is cybersecurity a good career in nigeria",
    updated: "2026-09-22",
    intro:
      "Short answer: it can be, but not for the reasons most adverts give. Here is what the work pays, who is hiring, and what nobody tells you before you start.",
    sections: [
      {
        heading: "Who is actually hiring in Nigeria",
        // TODO(content): name real sectors — banks, fintech, telcos, consultancies.
        // Only name employers PalmTechnIQ can evidence. Cite job boards in `sources`.
        body: [],
      },
      {
        heading: "What the roles pay",
        // TODO(content): naira ranges by seniority. Every figure needs a source
        // in `sources` below — an invented salary is the fastest way to lose trust.
        body: [],
      },
      {
        heading: "How people get their first role",
        body: [],
      },
      {
        heading: "The honest downsides",
        // TODO(content): on-call rotations, alert fatigue, the certification
        // treadmill, the entry-level catch-22. Credibility comes from this section.
        body: [],
      },
    ],
    faqs: [
      {
        question: "Can I get a cybersecurity job in Nigeria without experience?",
        answer: "",
      },
      {
        question: "How long does it take to become job-ready?",
        answer: "",
      },
    ],
    relatedCoursePaths: ["/courses/cybersecurity-clxgfa"],
    status: "draft",
  },
  {
    slug: "how-to-become-a-cybersecurity-analyst-without-a-degree",
    title: "How to become a cybersecurity analyst without a degree",
    metaTitle: "Cybersecurity Analyst Without a Degree: How To Start",
    description:
      "A step-by-step route into cybersecurity without a computer science degree — what to learn, what to build, and how to prove it to an employer.",
    targetQuery: "how to become a cybersecurity analyst without a degree",
    updated: "2026-09-22",
    intro:
      "A degree is not the barrier most people assume. What employers check is whether you can do the work, and there are faster ways to show that.",
    sections: [
      { heading: "What employers check instead of a degree", body: [] },
      { heading: "The skills to build first, in order", body: [] },
      { heading: "Projects that prove you can do the work", body: [] },
      { heading: "Writing a CV when you have no job history in security", body: [] },
    ],
    relatedCoursePaths: ["/courses/cybersecurity-clxgfa"],
    status: "draft",
  },
  {
    slug: "cybersecurity-roadmap-for-beginners",
    title: "A cybersecurity roadmap for complete beginners",
    metaTitle: "Cybersecurity Roadmap for Beginners (Step by Step)",
    description:
      "What to learn first in cybersecurity, in what order, and how long each stage takes — from networking basics to your first security role.",
    targetQuery: "cybersecurity roadmap for beginners",
    updated: "2026-09-22",
    intro:
      "Most roadmaps list a hundred topics and leave you no wiser about where to start. This one is ordered, and each stage says what 'done' looks like.",
    sections: [
      { heading: "Stage 1 — Networking fundamentals", body: [] },
      { heading: "Stage 2 — Operating systems and the command line", body: [] },
      { heading: "Stage 3 — Security fundamentals", body: [] },
      { heading: "Stage 4 — Hands-on practice", body: [] },
      { heading: "Stage 5 — Specialising", body: [] },
    ],
    relatedCoursePaths: [
      "/courses/cybersecurity-clxgfa",
      "/courses/ethical-hacking",
    ],
    status: "draft",
  },
  {
    slug: "ethical-hacking-vs-cybersecurity",
    title: "Ethical hacking vs cybersecurity: what's the difference?",
    metaTitle: "Ethical Hacking vs Cybersecurity: The Difference",
    description:
      "Ethical hacking is one part of cybersecurity, not a synonym for it. Here is how the roles differ day to day, and which one to train for first.",
    targetQuery: "ethical hacking vs cybersecurity",
    updated: "2026-09-22",
    intro:
      "These get used interchangeably, and it costs people money — they train for one job while applying for another.",
    sections: [
      { heading: "The short answer", body: [] },
      { heading: "What an ethical hacker does day to day", body: [] },
      { heading: "What a security analyst does day to day", body: [] },
      { heading: "Which to learn first", body: [] },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking",
      "/courses/cybersecurity-clxgfa",
    ],
    status: "draft",
  },
  {
    slug: "security-plus-vs-ceh-which-certification-first",
    title: "Security+ or CEH: which certification should you take first?",
    metaTitle: "Security+ vs CEH: Which Certification First?",
    description:
      "A comparison of CompTIA Security+ and CEH for someone starting out — cost, difficulty, what employers ask for, and which to sit first.",
    targetQuery: "security+ vs ceh which first",
    updated: "2026-09-22",
    intro:
      "Both are entry-level in name only, and they are not interchangeable. Which one to sit first depends on the job you are aiming at.",
    sections: [
      { heading: "What each one certifies", body: [] },
      {
        heading: "Cost, in naira, and how long to prepare",
        // TODO(content): exam fees move. Date every figure and cite the vendor.
        body: [],
      },
      { heading: "Which one Nigerian employers actually ask for", body: [] },
      { heading: "Our recommendation", body: [] },
    ],
    relatedCoursePaths: ["/courses/ethical-hacking"],
    status: "draft",
  },
];

/** Guides safe to link, index and list in the sitemap. */
export const publishedGuides = (): Guide[] =>
  CYBERSECURITY_GUIDES.filter((guide) => guide.status === "published");

export const findGuide = (slug: string): Guide | undefined =>
  CYBERSECURITY_GUIDES.find((guide) => guide.slug === slug);
