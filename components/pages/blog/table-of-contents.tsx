"use client";

interface Heading {
  text: string;
  style: string;
  _key: string;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (!headings || headings.length === 0) return null;

  function scrollToHeading(key: string) {
    const el = document.getElementById(`heading-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="glass-card border border-white/10 rounded-xl p-6 mb-10">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Table of Contents
      </h2>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h._key}>
            <button
              onClick={() => scrollToHeading(h._key)}
              className={`text-left w-full text-sm transition-colors hover:text-neon-blue ${
                h.style === "h3"
                  ? "pl-4 text-gray-400"
                  : "text-gray-300 font-medium"
              }`}>
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
