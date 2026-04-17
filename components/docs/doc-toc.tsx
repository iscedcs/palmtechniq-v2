"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface DocTableOfContentsProps {
  content: string;
}

export function DocTableOfContents({ content }: DocTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Extract headings from markdown content
  const headings: TocItem[] = content
    .split("\n")
    .filter((line) => line.match(/^#{2,3} /))
    .map((line) => {
      const match = line.match(/^(#{2,3}) (.+)$/);
      if (!match) return null;
      return {
        id: match[2]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        title: match[2],
        level: match[1].length,
      };
    })
    .filter(Boolean) as TocItem[];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="py-8 px-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        On this page
      </h4>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm py-1 transition-colors ${
              heading.level === 3 ? "pl-3" : ""
            } ${
              activeId === heading.id
                ? "text-green-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(heading.id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                setActiveId(heading.id);
              }
            }}>
            {heading.title}
          </a>
        ))}
      </nav>
    </div>
  );
}
