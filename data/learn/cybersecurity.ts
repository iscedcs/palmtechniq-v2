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
  relatedCoursePaths: [
    "/courses/ethical-hacking",
    "/courses/cybersecurity-clxgfa",
  ],
  categoryPath: "/courses/category/cybersecurity",
};

/**
 * The guides.
 *
 * Each targets one real search. The headings are the sub-questions a reader
 * arrives with, and Google reads them as the page's shape.
 *
 * STATE OF PLAY (drafted 2026-10-02)
 *   - cybersecurity-roadmap-for-beginners ........ written, needs review
 *   - ethical-hacking-vs-cybersecurity ........... written, needs review
 *   - how-to-become-...-without-a-degree ......... written, needs review
 *   - is-cybersecurity-a-good-career-in-nigeria .. NEEDS FACTS: employers, pay
 *   - security-plus-vs-ceh-... ................... NEEDS FACTS: fees, postings
 *
 * Every TODO(content) marker below is a fact that has to come from a source,
 * not from us. Leave it empty rather than guess.
 */
export const CYBERSECURITY_GUIDES: Guide[] = [
  {
    slug: "is-cybersecurity-a-good-career-in-nigeria",
    title: "Is cybersecurity a good career in Nigeria?",
    metaTitle: "Is Cybersecurity a Good Career in Nigeria?",
    description:
      "An honest look at demand, pay, entry routes and the trade-offs of a cybersecurity career in Nigeria — written for people deciding whether to start.",
    targetQuery: "is cybersecurity a good career in nigeria",
    updated: "2026-10-02",
    intro:
      "Short answer: it can be, but not for the reasons most adverts give. Here is what the work pays, who is hiring, and what nobody tells you before you start.",
    sections: [
      {
        heading: "Who is actually hiring in Nigeria",
        // TODO(content): name real employers ONLY with evidence. Pull ten or so
        // current postings from job boards, list the employers that recur, and
        // cite the boards in `sources`. Add the date you checked.
        body: [
          "Security work follows money and regulation. In Nigeria that points to organisations that hold customer funds or customer data and answer to a regulator: banks, fintech companies, telecom operators, payment processors and insurers, along with the consultancies and managed-security providers that serve them. Government agencies and large enterprises with their own IT teams hire as well.",
          "Two things shape who hires. Regulated sectors have compliance obligations that need people to meet them, which creates steady demand. And many smaller organisations cannot justify a full security team, so they buy the service from a provider, which is one reason entry-level work can sit at the provider rather than at the end client.",
          "Do not take any list of employers on trust, including ours. Search the job boards for security analyst, SOC analyst and information security roles in your city and read what the postings ask for. Ten minutes of that tells you more about the market you will be entering than any article.",
        ],
      },
      {
        heading: "What the roles pay",
        // TODO(content): naira ranges by seniority (entry, mid, senior). Every
        // figure needs a dated source in `sources` below — an invented salary is
        // the fastest way to lose trust. If we cannot source it, leave it out.
        body: [
          "Pay in security varies more than in most careers, and anyone quoting a single number is simplifying. It moves with the sector, with seniority, with whether the role is monitoring and response or a specialist job like penetration testing, and with whether the employer is local or the role is remote and paid from abroad.",
          "When you compare offers, look past the headline salary. On-call or shift allowances, whether the employer pays for certification exams and training, and how quickly the role lets you move up all change what an offer is really worth.",
        ],
      },
      {
        heading: "How people get their first role",
        body: ["There is no single door. The common routes are:"],
        bullets: [
          "Moving sideways from IT support or networking, where you already see the systems security teams protect.",
          "Moving from software development, where you already understand how applications fail.",
          "Starting from scratch with structured training, practice labs and a small portfolio of work.",
        ],
      },
      {
        heading: "What every route has in common",
        body: [
          "Evidence. A hiring manager reading a CV with no security job titles wants proof you can do the work: lab write-ups, a home lab you can describe in detail, a certification that matches the role, or a short piece of analysis on a real problem.",
          "Our guide to becoming a cybersecurity analyst without a degree covers how to build that evidence step by step.",
        ],
      },
      {
        heading: "The honest downsides",
        body: [
          "Some of it is tedious. Defensive roles spend a lot of time triaging alerts, and most turn out to be nothing. The skill is staying attentive through the boring ones, and burnout from alert fatigue is a well-known problem in the field.",
          "Many roles involve on-call rotations or shift work, because attackers do not keep office hours. Ask about this before you accept an offer, not after.",
          "Certifications can become a treadmill. Employers often ask for them, many need renewing, and each costs money to sit. Decide which ones serve the job you want rather than collecting them.",
          "And there is an entry-level catch-22: plenty of entry-level postings ask for experience. The way through is the evidence above, plus being willing to start in an adjacent role such as IT support or network operations and move across.",
          "If those trade-offs sound tolerable, the field rewards people who stay curious. If they do not, it is better to find that out now than after paying for training.",
        ],
      },
    ],
    faqs: [
      {
        question:
          "Can I get a cybersecurity job in Nigeria without experience?",
        answer:
          "Yes, but rarely straight into a senior-sounding title. Most people without experience start in an adjacent role such as IT support or network operations, or in a junior analyst position, and use projects, lab work and a relevant certification to show they can do the work. Expect to compete on evidence rather than on a CV full of security job titles.",
      },
      {
        question: "How long does it take to become job-ready?",
        answer:
          "There is no honest single number. It depends on what you already know, how many hours a week you can give it, and which role you are aiming at. Someone working in IT support starts much further along than someone who has never opened a terminal. A better test than the calendar: can you explain, and demonstrate on a practice lab, the skills the postings you want are asking for?",
      },
      {
        question: "Do I need a computer science degree?",
        answer:
          "Not for most entry routes. Employers mostly care whether you can show the skills. Some roles, particularly in government or very large organisations, may list a degree as a requirement, so check the postings for the specific roles you want.",
      },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking-starter",
      "/courses/ethical-hacking",
    ],
    status: "draft",
  },
  {
    slug: "how-to-become-a-cybersecurity-analyst-without-a-degree",
    title: "How to become a cybersecurity analyst without a degree",
    metaTitle: "Cybersecurity Analyst Without a Degree: How To Start",
    description:
      "A step-by-step route into cybersecurity without a computer science degree — what to learn, what to build, and how to prove it to an employer.",
    targetQuery: "how to become a cybersecurity analyst without a degree",
    updated: "2026-10-02",
    intro:
      "A degree is not the barrier most people assume. What employers check is whether you can do the work, and there are faster ways to show that.",
    sections: [
      {
        heading: "What employers check instead of a degree",
        body: [
          "When a posting lists a degree, it can be a filter for a large pile of applications rather than a hard requirement. What a hiring manager actually wants to know is whether you can be trusted near their systems and whether you learn quickly. A degree is one way to signal that. It is not the only one.",
          "The things that carry weight instead:",
        ],
        bullets: [
          "Practical skills you can demonstrate: networking, operating systems, reading logs.",
          "Evidence of curiosity: a home lab, written-up practice exercises, notes you have kept.",
          "A certification that matches the role, which shows you have covered a recognised syllabus.",
          "Clear communication. Analysts write reports and explain risk to people who are not technical.",
        ],
      },
      {
        heading: "Read the postings first",
        body: [
          "Before you study anything, read ten postings for the roles you want and note what they ask for. Where a degree is listed with the words or equivalent experience, that is your opening. The skills that appear in most of the postings are your study list.",
        ],
      },
      {
        heading: "The skills to build first, in order",
        body: [
          "Order matters because each layer makes the next one easier to understand.",
        ],
        bullets: [
          "Networking: how data moves, IP addressing, ports, DNS, and the difference between TCP and UDP.",
          "Operating systems: Linux and Windows basics, users and permissions, and the command line.",
          "Security fundamentals: authentication, encryption, and the common attack types and how each is detected.",
          "Logs and monitoring: reading logs and recognising what normal looks like, which is most of an analyst's working day.",
          "Scripting: enough to automate repetitive checks. You do not need to become a developer.",
        ],
      },
      {
        heading: "Where our courses fit",
        body: [
          "The first modules of our Ethical Hacking course follow roughly this order: networking fundamentals including the OSI model and subnetting, then Linux and the command line, then web application and API security. That makes it a structured way through the early layers even if your target job is defensive.",
          "To be straight about it: the course takes the attacker's view, which is useful for understanding what you will be defending against, but it is not a security operations analyst programme. If you are not sure the field suits you, the Ethical Hacking Starter is the cheaper way to find out.",
        ],
      },
      {
        heading: "Projects that prove you can do the work",
        body: [
          "A project is evidence. Aim for two or three small ones that you can explain in detail, rather than a long list you cannot talk through.",
        ],
        bullets: [
          "Build a home lab: a couple of virtual machines on your own laptop, one to attack from and one to attack, and write up what you learned.",
          "Scan and document: use Nmap against your own lab to map its services, then write what you found and what you would fix.",
          "Write up a practice challenge: walk through how you solved a challenge on a free practice platform, in your own words, including the dead ends.",
          "Investigate logs: take sample log files and write a short incident summary covering what happened, how you know, and what you would recommend.",
        ],
      },
      {
        heading: "The one rule that matters",
        body: [
          "Only test systems you own or have written permission to test. That is the line between security work and a crime, and interviewers will ask whether you understand it. Practise in your own lab or on purpose-built practice targets, never on someone else's website or network.",
        ],
      },
      {
        heading: "Writing a CV when you have no job history in security",
        body: [
          "Lead with a short summary naming the role you are aiming for, then put a projects section above your work history. For each project, say in one or two lines what you did, which tools you used and what you found.",
          "Translate your existing experience. IT support shows you handle incidents and users. Customer service shows you stay calm and explain things clearly. Any job that touched access control, records or compliance is relevant, so describe it in those terms.",
          "List certifications you hold or are working towards, with dates, and link to your write-ups. Keep it to one or two pages and echo the wording of the posting wherever that is honest.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I become a SOC analyst without a degree?",
        answer:
          "Many people do. Entry-level monitoring roles tend to ask for networking and operating-system knowledge, familiarity with security tools and logs, and often a foundational certification. A degree helps in some postings but is rarely the only route. Check the specific postings you are aiming at.",
      },
      {
        question: "Which certification should a beginner start with?",
        answer:
          "It depends on the role you are aiming for. Our guide comparing Security+ and CEH walks through how to choose.",
      },
      {
        question: "Is a course enough on its own to get hired?",
        answer:
          "A course gives you structure and a syllabus, but it is rarely enough by itself because employers want to see that you have applied what you learned. Treat training as the start of your evidence — add lab work, write-ups and a project — rather than a substitute for it.",
      },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking-starter",
      "/courses/ethical-hacking",
    ],
    status: "published",
  },
  {
    slug: "cybersecurity-roadmap-for-beginners",
    title: "A cybersecurity roadmap for complete beginners",
    metaTitle: "Cybersecurity Roadmap for Beginners (Step by Step)",
    description:
      "What to learn first in cybersecurity and in what order, with a clear test for when each stage is done — from networking basics to your first security role.",
    targetQuery: "cybersecurity roadmap for beginners",
    updated: "2026-10-02",
    intro:
      "Most roadmaps list a hundred topics and leave you no wiser about where to start. This one is ordered, and each stage says what 'done' looks like.",
    sections: [
      {
        heading: "How to use this roadmap",
        body: [
          "Move on when you can pass the test at the end of a stage, not when a number of weeks has gone by. People start from very different places, so any calendar would be wrong for most readers. Someone who already works in IT support will clear the first two stages quickly. Someone starting fresh should give them time.",
        ],
      },
      {
        heading: "Stage 1 — Networking fundamentals",
        body: [
          "Everything in security happens over a network, so this comes first. You are learning how machines find and talk to each other, because attacks and defences are both built on those mechanics. If you want a guided version, our Ethical Hacking course opens with the OSI model, then subnetting and IP addressing.",
          "You are done with this stage when you can:",
        ],
        bullets: [
          "Explain, step by step, what happens when you type a web address into a browser.",
          "Describe the OSI model in your own words and say which layer a given problem sits in.",
          "Work out the subnet for a given IP range and mask.",
          "Explain what a port is, and the difference between TCP and UDP.",
        ],
      },
      {
        heading: "Stage 2 — Operating systems and the command line",
        body: [
          "Most security tools run on Linux, and most targets run Windows or Linux, so you need to be comfortable in both. Start with Linux, because the command line teaches you how the system really works.",
          "You are done with this stage when you can:",
        ],
        bullets: [
          "Move around the file system and create, copy and delete files from the terminal.",
          "Read and change file permissions, and explain what they allow.",
          "Manage users, processes and services.",
          "Chain simple commands together to search through a large file.",
          "Describe, at a basic level, how users, services and the registry work on Windows.",
        ],
      },
      {
        heading: "Stage 3 — Security fundamentals",
        body: [
          "Now the concepts: confidentiality, integrity and availability; authentication versus authorisation; encryption at rest and in transit; and the common attack types — phishing, malware, injection, credential theft — alongside the defences for each. The OWASP lists of common web vulnerabilities are a good map for the web side.",
          "You are done with this stage when you can:",
        ],
        bullets: [
          "Explain confidentiality, integrity and availability with a real example for each.",
          "Describe how a typical phishing attack unfolds and name three points where it could be stopped.",
          "Say why hashing is not the same as encryption.",
          "Name the main categories of web application vulnerability and give an example of each.",
        ],
      },
      {
        heading: "Stage 4 — Hands-on practice",
        body: [
          "Reading is not enough. Build a small lab, attack your own machines, and write down what you learn. Our Ethical Hacking Starter covers this stage's core skills: footprinting, network scanning, DNS and SNMP enumeration, and vulnerability assessment with Nikto and Nessus.",
          "Only practise on systems you own or on purpose-built practice targets. Your write-ups become your portfolio.",
          "You are done with this stage when you can:",
        ],
        bullets: [
          "Set up a lab with one virtual machine to attack from and one to attack.",
          "Use a scanner such as Nmap against your own lab and explain every line of its output.",
          "Take an unfamiliar practice machine, enumerate it methodically, and explain what you found and why it matters.",
          "Show a few written-up exercises to someone else and have them follow your reasoning.",
        ],
      },
      {
        heading: "Stage 5 — Specialising",
        body: [
          "Only now choose a direction, because by this point you have seen enough to choose with some basis. The main branches are:",
        ],
        bullets: [
          "Defensive work: monitoring, detection and incident response.",
          "Offensive work: penetration testing and application security.",
          "Governance, risk and compliance: policy, audits and controls.",
          "Cloud security: securing infrastructure on the major cloud platforms.",
        ],
      },
      {
        heading: "Choosing, and what 'done' looks like here",
        body: [
          "Try a little of each branch before committing, then deepen with the certification that matches the role. You are done with the roadmap when you can name the role you are aiming at and list the skills its postings ask for that you do not yet have. That list is your next study plan.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to know programming to start in cybersecurity?",
        answer:
          "Not to begin. Networking, operating systems and security fundamentals come first and need no programming. Basic scripting becomes useful later, for automating repetitive checks, and you do not need to be a developer to benefit from it.",
      },
      {
        question: "Which operating system should I learn first?",
        answer:
          "Linux. Most security tooling runs on it, and working at the command line teaches you how the system works. Pick up the Windows basics alongside it, since most organisations run Windows.",
      },
      {
        question: "How do I know when I am ready to apply for jobs?",
        answer:
          "Judge by evidence, not by the calendar. When you can pass the test for the first four stages and have a few written-up exercises to show, start applying. Nobody ever feels fully ready, and applications teach you what the market actually asks for.",
      },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking-starter",
      "/courses/ethical-hacking",
    ],
    status: "published",
  },
  {
    slug: "ethical-hacking-vs-cybersecurity",
    title: "Ethical hacking vs cybersecurity: what's the difference?",
    metaTitle: "Ethical Hacking vs Cybersecurity: The Difference",
    description:
      "Ethical hacking is one part of cybersecurity, not a synonym for it. Here is how the roles differ day to day, and which one to train for first.",
    targetQuery: "ethical hacking vs cybersecurity",
    updated: "2026-10-02",
    intro:
      "These get used interchangeably, and it costs people money — they train for one job while applying for another.",
    sections: [
      {
        heading: "The short answer",
        body: [
          "Cybersecurity is the whole field of protecting systems, data and people from attack. Ethical hacking is one specialism inside it: attacking systems, with permission, to find weaknesses before real attackers do.",
          "Every ethical hacker works in cybersecurity. Most cybersecurity professionals are not ethical hackers.",
        ],
      },
      {
        heading: "What an ethical hacker does day to day",
        body: [
          "Ethical hackers are also called penetration testers or red teamers. The work is usually project-based: agree the scope and rules in writing with the client, probe the systems in scope, find and prove weaknesses, then write a report explaining each finding and how to fix it. A large share of the job is writing and explaining, not only technical work.",
        ],
        bullets: [
          "Agreeing scope and permission in writing before anything is tested.",
          "Reconnaissance, scanning and enumeration of the target.",
          "Testing web applications, networks and APIs for weaknesses.",
          "Writing the report and presenting findings to the people who will fix them.",
        ],
      },
      {
        heading: "Why permission is the whole difference",
        body: [
          "The techniques an ethical hacker uses are the same ones a criminal uses. What separates them is written authorisation from the system's owner and a scope both sides have agreed. Without that, it is not ethical hacking.",
        ],
      },
      {
        heading: "What a security analyst does day to day",
        body: [
          "Analysts work on the defending side: monitoring alerts from security tools, investigating whether something is a real incident or a false alarm, escalating and responding, and improving detection so the same issue is caught faster next time.",
          "The work is ongoing rather than project-based, often runs in shifts, and involves a lot of reading logs and following procedures. It rewards patience and pattern recognition.",
        ],
      },
      {
        heading: "Which to learn first",
        body: [
          "If you are unsure, learn the foundations both share: networking, Linux and basic security concepts. They carry over to either path, so nothing is wasted.",
          "After that, a rough guide. If you enjoy taking things apart, thinking like an attacker and writing detailed reports, lean offensive. If you prefer steady investigation, spotting patterns and working to a process, lean defensive. Defensive roles are generally more numerous than specialist offensive ones, which is one reason many people start there.",
          "If you want to try the offensive side before committing, our Ethical Hacking Starter lets you do footprinting, scanning, enumeration and basic vulnerability assessment hands-on. The full Ethical Hacking course goes further into Linux, web application security and API security.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is ethical hacking legal?",
        answer:
          "It is legal when it is done with the system owner's explicit written permission and within an agreed scope. Testing systems you do not own or have permission to test can break the law. Practise only in your own lab or on purpose-built practice targets, get permission in writing for any real engagement, and ask a lawyer if you are unsure.",
      },
      {
        question: "Can I switch from one to the other later?",
        answer:
          "Yes. The foundations overlap heavily, and experience on one side makes you better at the other: attackers who have worked in defence write more useful reports, and analysts who understand attack techniques spot them faster.",
      },
      {
        question: "Do I need to learn programming for ethical hacking?",
        answer:
          "You can start without it. Networking, Linux and web fundamentals come first. Scripting becomes more valuable as you advance, but it is not a prerequisite for beginning.",
      },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking-starter",
      "/courses/ethical-hacking",
    ],
    status: "published",
  },
  {
    slug: "security-plus-vs-ceh-which-certification-first",
    title: "Security+ or CEH: which certification should you take first?",
    metaTitle: "Security+ vs CEH: Which Certification First?",
    description:
      "A comparison of CompTIA Security+ and CEH for someone starting out — cost, difficulty, what employers ask for, and which to sit first.",
    targetQuery: "security+ vs ceh which first",
    updated: "2026-10-02",
    intro:
      "Both are entry-level in name only, and they are not interchangeable. Which one to sit first depends on the job you are aiming at.",
    sections: [
      {
        heading: "What each one certifies",
        // TODO(content): confirm each exam's current domains on the vendor's own
        // page and cite it in `sources`. Syllabi change between exam versions.
        body: [
          "CompTIA Security+ is a vendor-neutral certification covering the broad fundamentals of security: threats and vulnerabilities, network and system security, identity and access management, risk, and incident response. It is general by design and aimed at people moving into security roles.",
          "Certified Ethical Hacker (CEH), from EC-Council, is narrower and attacker-focused. It covers the tools and techniques attackers use — reconnaissance, scanning, enumeration, system hacking, web application attacks — and the habit of testing systems with permission.",
          "In short: Security+ shows you understand the field, and CEH shows you know how attacks are carried out. Neither proves you can do the job on its own.",
        ],
      },
      {
        heading: "Cost, in naira, and how long to prepare",
        // TODO(content): exam fees move. Add the current voucher price for each
        // exam, DATED, with the vendor page in `sources`, and convert to naira
        // at a stated rate and date. Do not publish a figure we cannot source.
        body: [
          "Both vendors price their exams in US dollars, so the naira cost moves with the exchange rate. Exam versions and prices also change, so check the vendor's current figures rather than relying on a number in an article, this one included.",
          "When you budget, count more than the exam voucher:",
        ],
        bullets: [
          "The exam voucher itself.",
          "Any training the vendor requires or strongly recommends.",
          "Practice exams and study material.",
          "Retake fees if you do not pass first time.",
          "Renewal costs and continuing-education requirements.",
        ],
      },
      {
        heading: "How long to prepare",
        body: [
          "It depends on your background. Someone already working in networking or IT support will need less preparation than someone starting from nothing, and either of them will do better with hands-on practice alongside the reading than from the reading alone.",
        ],
      },
      {
        heading: "Which one Nigerian employers actually ask for",
        // TODO(content): do the postings exercise below, then add the real
        // result here — e.g. "of the N postings we reviewed on <date>, X
        // mentioned Security+ and Y mentioned CEH" — and cite the job boards.
        // Until that count exists, do not claim which one employers prefer.
        body: [
          "The honest answer comes from the postings, not from a general claim. Pull twenty or so current postings for the roles you want, in your own city, and tally which certifications they list by name. Note whether each one is required or only preferred.",
          "Defensive and general roles tend to name foundational certifications, while specialist penetration-testing roles tend to name offensive ones, so the mix you find will depend on the roles you search for.",
        ],
      },
      {
        heading: "Our recommendation",
        body: [
          "If your target is a defensive or general security role — analyst, security operations, junior security engineer — start with Security+. It covers the vocabulary and concepts every other path assumes.",
          "If your target is penetration testing, or you already have strong networking and Linux skills, CEH is relevant. Check the current eligibility rules first, because EC-Council has historically required either approved training or documented experience to sit the exam, and conditions like that change.",
          "Either way, a certification is a syllabus and a signal, not a substitute for hands-on skill. Build lab work alongside it, because technical interviews ask you to demonstrate, not recite. Our Ethical Hacking course is hands-on practice you can run alongside either.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I skip certifications and just build a portfolio?",
        answer:
          "Some employers hire on demonstrated skill, but many postings list certifications as a requirement or use them as a filter, so check the postings for your target roles. A mix of both — a recognised certification and written-up practical work — is the strongest position.",
      },
      {
        question: "Do these certifications expire?",
        answer:
          "Most do. They typically need renewing after a set period through continuing-education credits or re-examination. Check each vendor's current renewal requirements before you commit.",
      },
      {
        question: "Should I take both?",
        answer:
          "Eventually, some people do. Starting with one that matches your target role and getting hands-on practice is usually a better use of money than collecting several early on.",
      },
    ],
    relatedCoursePaths: [
      "/courses/ethical-hacking-starter",
      "/courses/ethical-hacking",
    ],
    status: "draft",
  },
];

/** Guides safe to link, index and list in the sitemap. */
export const publishedGuides = (): Guide[] =>
  CYBERSECURITY_GUIDES.filter((guide) => guide.status === "published");

export const findGuide = (slug: string): Guide | undefined =>
  CYBERSECURITY_GUIDES.find((guide) => guide.slug === slug);
