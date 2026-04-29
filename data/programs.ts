/**
 * PalmTechnIQ Professional Programs — pricing and metadata.
 *
 * Pricing based on the "70/30 Installment Plan" framework.
 * All amounts in Nigerian Naira (₦).
 */

export type ProgramDurationKey =
  | "ONE_MONTH"
  | "THREE_MONTHS"
  | "SIX_MONTHS"
  | "ONE_YEAR";

export interface ProgramDefinition {
  slug: string;
  name: string;
  duration: ProgramDurationKey;
  durationLabel: string;
  fullPrice: number;
  installTotal: number;
  firstInstall: number;
  secondInstall: number;
  careerOutcomes: string[];
  curriculum: string[];
}

// ─── Crash Courses (1 Month) ────────────────────────────────────────────────

const crashCourseBase = {
  duration: "ONE_MONTH" as ProgramDurationKey,
  durationLabel: "1 Month (Crash Course)",
  fullPrice: 90_000,
  installTotal: 95_000,
  firstInstall: 66_500,
  secondInstall: 28_500,
};

// ─── 3-Month Programs ──────────────────────────────────────────────────────

// ─── 6-Month & 1-Year Programs ─────────────────────────────────────────────

export const PROGRAMS: ProgramDefinition[] = [
  // ── Crash Courses ──
  {
    ...crashCourseBase,
    slug: "digital-marketing-crash",
    name: "Digital Marketing (Crash Course)",
    careerOutcomes: [
      "Social Media Manager",
      "Content Strategist",
      "SEO Specialist",
    ],
    curriculum: [
      "Social Media Marketing",
      "SEO Fundamentals",
      "Content Strategy",
      "Paid Advertising",
    ],
  },
  {
    ...crashCourseBase,
    slug: "backend-development-crash",
    name: "Backend Development (Crash Course)",
    careerOutcomes: [
      "Junior Backend Developer",
      "API Developer",
      "Server-Side Engineer",
    ],
    curriculum: [
      "Node.js / Python Basics",
      "REST APIs",
      "Database Design",
      "Authentication & Security",
    ],
  },
  {
    ...crashCourseBase,
    slug: "frontend-development-crash",
    name: "Frontend Development (Crash Course)",
    careerOutcomes: [
      "Junior Frontend Developer",
      "UI Engineer",
      "Web Developer",
    ],
    curriculum: [
      "HTML/CSS/JS Deep Dive",
      "React Fundamentals",
      "Responsive Design",
      "Git & Deployment",
    ],
  },
  {
    ...crashCourseBase,
    slug: "data-analytics-crash",
    name: "Data Analytics (Crash Course)",
    careerOutcomes: [
      "Junior Data Analyst",
      "BI Analyst",
      "Reporting Specialist",
    ],
    curriculum: [
      "Excel & Google Sheets",
      "SQL Basics",
      "Data Visualization",
      "Intro to Python for Data",
    ],
  },
  {
    ...crashCourseBase,
    slug: "cybersecurity-crash",
    name: "Cybersecurity (Crash Course)",
    careerOutcomes: [
      "Security Awareness Specialist",
      "Junior SOC Analyst",
      "IT Auditor",
    ],
    curriculum: [
      "Cybersecurity Fundamentals",
      "Network Security",
      "Threat Detection",
      "Security Best Practices",
    ],
  },
  {
    ...crashCourseBase,
    slug: "ui-ux-design-crash",
    name: "UI/UX Design (Crash Course)",
    careerOutcomes: ["Junior UI Designer", "UX Researcher", "Visual Designer"],
    curriculum: [
      "Design Thinking",
      "Figma Mastery",
      "User Research",
      "Prototyping",
    ],
  },
  {
    ...crashCourseBase,
    slug: "project-management-crash",
    name: "Project Management (Crash Course)",
    careerOutcomes: [
      "Junior Project Coordinator",
      "Scrum Assistant",
      "Team Lead",
    ],
    curriculum: [
      "Agile & Scrum",
      "Task Management Tools",
      "Stakeholder Communication",
      "Risk Management",
    ],
  },
  {
    ...crashCourseBase,
    slug: "product-management-crash",
    name: "Product Management (Crash Course)",
    careerOutcomes: [
      "Associate Product Manager",
      "Product Analyst",
      "Growth Strategist",
    ],
    curriculum: [
      "Product Discovery",
      "Roadmapping",
      "User Stories",
      "Product Metrics",
    ],
  },

  // ── 3-Month Programs ──
  {
    slug: "digital-marketing-3m",
    name: "Digital Marketing",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 300_000,
    installTotal: 320_000,
    firstInstall: 224_000,
    secondInstall: 96_000,
    careerOutcomes: [
      "Digital Marketing Manager",
      "Growth Hacker",
      "Campaign Strategist",
    ],
    curriculum: [
      "Advanced SEO/SEM",
      "Email Marketing",
      "Analytics & Reporting",
      "Brand Strategy",
      "Paid Ads Mastery",
    ],
  },
  {
    slug: "backend-development-3m",
    name: "Backend Development",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 400_000,
    installTotal: 420_000,
    firstInstall: 294_000,
    secondInstall: 126_000,
    careerOutcomes: ["Backend Developer", "API Architect", "DevOps Engineer"],
    curriculum: [
      "Node.js / Python",
      "Database Architecture",
      "API Design",
      "Cloud Deployment",
      "Testing & CI/CD",
    ],
  },
  {
    slug: "frontend-development-3m",
    name: "Frontend Development",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 350_000,
    installTotal: 370_000,
    firstInstall: 259_000,
    secondInstall: 111_000,
    careerOutcomes: ["Frontend Developer", "React Developer", "UI Engineer"],
    curriculum: [
      "React / Next.js",
      "TypeScript",
      "State Management",
      "Performance Optimization",
      "Testing",
    ],
  },
  {
    slug: "data-analytics-3m",
    name: "Data Analytics",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 350_000,
    installTotal: 370_000,
    firstInstall: 259_000,
    secondInstall: 111_000,
    careerOutcomes: [
      "Data Analyst",
      "Business Intelligence Analyst",
      "Data Scientist (Junior)",
    ],
    curriculum: [
      "Python for Data",
      "SQL & Databases",
      "Tableau / Power BI",
      "Statistical Analysis",
      "Machine Learning Intro",
    ],
  },
  {
    slug: "cybersecurity-3m",
    name: "Cybersecurity",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 400_000,
    installTotal: 420_000,
    firstInstall: 294_000,
    secondInstall: 126_000,
    careerOutcomes: ["SOC Analyst", "Penetration Tester", "Security Engineer"],
    curriculum: [
      "Network Security",
      "Ethical Hacking",
      "Incident Response",
      "SIEM Tools",
      "Compliance & Governance",
    ],
  },
  {
    slug: "smart-home-automation-3m",
    name: "Smart Home Automation",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 300_000,
    installTotal: 320_000,
    firstInstall: 224_000,
    secondInstall: 96_000,
    careerOutcomes: [
      "IoT Developer",
      "Home Automation Consultant",
      "Embedded Systems Engineer",
    ],
    curriculum: [
      "IoT Fundamentals",
      "Arduino / Raspberry Pi",
      "Smart Protocols",
      "Home Network Design",
      "Project Build",
    ],
  },
  {
    slug: "project-management-3m",
    name: "Project Management",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 300_000,
    installTotal: 320_000,
    firstInstall: 224_000,
    secondInstall: 96_000,
    careerOutcomes: ["Project Manager", "Scrum Master", "Program Coordinator"],
    curriculum: [
      "Agile & Waterfall",
      "Scrum Methodology",
      "Resource Planning",
      "Risk Management",
      "Stakeholder Management",
    ],
  },
  {
    slug: "ui-ux-design-3m",
    name: "UI/UX Design",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 300_000,
    installTotal: 320_000,
    firstInstall: 224_000,
    secondInstall: 96_000,
    careerOutcomes: [
      "UI/UX Designer",
      "Product Designer",
      "Interaction Designer",
    ],
    curriculum: [
      "User Research",
      "Wireframing & Prototyping",
      "Figma Advanced",
      "Design Systems",
      "Usability Testing",
    ],
  },
  {
    slug: "product-management-3m",
    name: "Product Management",
    duration: "THREE_MONTHS",
    durationLabel: "3 Months",
    fullPrice: 300_000,
    installTotal: 320_000,
    firstInstall: 224_000,
    secondInstall: 96_000,
    careerOutcomes: [
      "Product Manager",
      "Product Owner",
      "Growth Product Manager",
    ],
    curriculum: [
      "Product Strategy",
      "User Stories & PRDs",
      "A/B Testing",
      "Product Analytics",
      "Go-to-Market Strategy",
    ],
  },

  // ── 6-Month Programs ──
  {
    slug: "digital-marketing-6m",
    name: "Digital Marketing",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 600_000,
    installTotal: 630_000,
    firstInstall: 441_000,
    secondInstall: 189_000,
    careerOutcomes: [
      "Senior Digital Marketer",
      "Marketing Director",
      "Chief Marketing Officer",
    ],
    curriculum: [
      "Full Stack Marketing",
      "Programmatic Advertising",
      "Marketing Automation",
      "Advanced Analytics",
      "Leadership & Strategy",
    ],
  },
  {
    slug: "backend-development-6m",
    name: "Backend Development",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 900_000,
    installTotal: 940_000,
    firstInstall: 658_000,
    secondInstall: 282_000,
    careerOutcomes: [
      "Senior Backend Engineer",
      "Solutions Architect",
      "Tech Lead",
    ],
    curriculum: [
      "Advanced System Design",
      "Microservices",
      "Cloud Architecture",
      "DevOps at Scale",
      "Performance Engineering",
    ],
  },
  {
    slug: "frontend-development-6m",
    name: "Frontend Development",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 800_000,
    installTotal: 840_000,
    firstInstall: 588_000,
    secondInstall: 252_000,
    careerOutcomes: [
      "Senior Frontend Engineer",
      "Frontend Architect",
      "Tech Lead",
    ],
    curriculum: [
      "Advanced React Patterns",
      "Micro-Frontends",
      "Performance & A11y",
      "Design Systems",
      "Monorepo Tooling",
    ],
  },
  {
    slug: "data-analytics-6m",
    name: "Data Analytics",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 800_000,
    installTotal: 840_000,
    firstInstall: 588_000,
    secondInstall: 252_000,
    careerOutcomes: [
      "Senior Data Analyst",
      "Data Scientist",
      "Analytics Manager",
    ],
    curriculum: [
      "Advanced Python & R",
      "Machine Learning",
      "Big Data Tools",
      "Statistical Modeling",
      "Data Engineering Basics",
    ],
  },
  {
    slug: "smart-home-automation-6m",
    name: "Smart Home Automation",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 800_000,
    installTotal: 840_000,
    firstInstall: 588_000,
    secondInstall: 252_000,
    careerOutcomes: [
      "IoT Solutions Architect",
      "Embedded Systems Lead",
      "Smart City Consultant",
    ],
    curriculum: [
      "Industrial IoT",
      "Edge Computing",
      "Custom Firmware",
      "Cloud IoT Platforms",
      "Capstone Project",
    ],
  },
  {
    slug: "project-management-6m",
    name: "Project Management",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 700_000,
    installTotal: 740_000,
    firstInstall: 518_000,
    secondInstall: 222_000,
    careerOutcomes: [
      "Senior Project Manager",
      "Program Manager",
      "PMO Director",
    ],
    curriculum: [
      "PMP Prep",
      "Advanced Agile",
      "Portfolio Management",
      "Strategic Planning",
      "Leadership & Communication",
    ],
  },
  {
    slug: "ui-ux-design-6m",
    name: "UI/UX Design",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 800_000,
    installTotal: 840_000,
    firstInstall: 588_000,
    secondInstall: 252_000,
    careerOutcomes: [
      "Senior Product Designer",
      "Design Lead",
      "Head of Design",
    ],
    curriculum: [
      "Design Leadership",
      "Advanced Prototyping",
      "Design Ops",
      "Accessibility Mastery",
      "Portfolio Project",
    ],
  },
  {
    slug: "product-management-6m",
    name: "Product Management",
    duration: "SIX_MONTHS",
    durationLabel: "6 Months",
    fullPrice: 800_000,
    installTotal: 840_000,
    firstInstall: 588_000,
    secondInstall: 252_000,
    careerOutcomes: [
      "Senior Product Manager",
      "Head of Product",
      "Chief Product Officer",
    ],
    curriculum: [
      "Product Vision & Strategy",
      "Data-Driven Decisions",
      "Stakeholder Alignment",
      "Scaling Products",
      "Capstone Product Launch",
    ],
  },

  // ── 1-Year Programs ──
  {
    slug: "fullstack-development-1y",
    name: "Fullstack Development",
    duration: "ONE_YEAR",
    durationLabel: "1 Year",
    fullPrice: 1_400_000,
    installTotal: 1_470_000,
    firstInstall: 1_029_000,
    secondInstall: 441_000,
    careerOutcomes: [
      "Fullstack Engineer",
      "Software Architect",
      "Engineering Manager",
    ],
    curriculum: [
      "Frontend & Backend Mastery",
      "System Design",
      "Cloud & DevOps",
      "Open Source Contributions",
      "Capstone Enterprise App",
    ],
  },
  {
    slug: "cybersecurity-1y",
    name: "Cybersecurity",
    duration: "ONE_YEAR",
    durationLabel: "1 Year",
    fullPrice: 1_400_000,
    installTotal: 1_470_000,
    firstInstall: 1_029_000,
    secondInstall: 441_000,
    careerOutcomes: ["Security Architect", "CISO", "Red Team Lead"],
    curriculum: [
      "Advanced Penetration Testing",
      "Malware Analysis",
      "Cloud Security",
      "Digital Forensics",
      "Security Leadership",
    ],
  },
  {
    slug: "mobile-app-development-1y",
    name: "Mobile App Development",
    duration: "ONE_YEAR",
    durationLabel: "1 Year",
    fullPrice: 1_000_000,
    installTotal: 1_050_000,
    firstInstall: 735_000,
    secondInstall: 315_000,
    careerOutcomes: [
      "Mobile Developer",
      "React Native Engineer",
      "Mobile Architect",
    ],
    curriculum: [
      "React Native / Flutter",
      "iOS & Android Patterns",
      "App Store Deployment",
      "Performance & Testing",
      "Capstone Mobile App",
    ],
  },
];

/**
 * Get programs grouped by duration for display.
 */
export function getProgramsByDuration(): Record<string, ProgramDefinition[]> {
  const groups: Record<string, ProgramDefinition[]> = {};
  for (const program of PROGRAMS) {
    const key = program.durationLabel;
    if (!groups[key]) groups[key] = [];
    groups[key].push(program);
  }
  return groups;
}

/**
 * Get unique program base names (de-duplicated across durations).
 * E.g., "Backend Development", "Cybersecurity", etc.
 */
export function getUniqueProgramNames(): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const program of PROGRAMS) {
    // Strip "(Crash Course)" suffix to get the base name
    const baseName = program.name.replace(/\s*\(Crash Course\)$/, "");
    if (!seen.has(baseName)) {
      seen.add(baseName);
      names.push(baseName);
    }
  }
  return names;
}

/**
 * Get available durations for a given base program name.
 */
export function getDurationsForProgram(
  baseName: string,
): { duration: ProgramDurationKey; label: string; slug: string }[] {
  return PROGRAMS.filter((p) => {
    const pBase = p.name.replace(/\s*\(Crash Course\)$/, "");
    return pBase === baseName;
  }).map((p) => ({
    duration: p.duration,
    label: p.durationLabel,
    slug: p.slug,
  }));
}

/**
 * Get a program definition by base name + duration.
 */
export function getProgramByNameAndDuration(
  baseName: string,
  duration: ProgramDurationKey,
): ProgramDefinition | undefined {
  return PROGRAMS.find((p) => {
    const pBase = p.name.replace(/\s*\(Crash Course\)$/, "");
    return pBase === baseName && p.duration === duration;
  });
}

/**
 * Find a single program by slug.
 */
export function getProgramBySlug(slug: string): ProgramDefinition | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

/**
 * Format price in Nigerian Naira.
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
