"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { DocSection } from "@/lib/docs/types";
import {
  Rocket,
  Layers,
  Users,
  GitBranch,
  Code,
  Wrench,
  ChevronDown,
  Search,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Rocket,
  Layers,
  Users,
  GitBranch,
  Code,
  Wrench,
};

interface DocSidebarProps {
  sections: DocSection[];
  currentSection: string;
  currentPage: string;
  version: string;
}

export function DocSidebar({
  sections,
  currentSection,
  currentPage,
  version,
}: DocSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(
    sections.map((s) => s.slug),
  );

  const toggleSection = useCallback((slug: string) => {
    setOpenSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const filteredSections = sections
    .map((section) => {
      if (!searchQuery) return section;
      const filteredChildren = section.children?.filter(
        (child) =>
          child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          child.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (
        filteredChildren?.length ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return { ...section, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as DocSection[];

  return (
    <div className="py-6 px-4">
      {/* Logo and version */}
      <div className="mb-6">
        <Link
          href="/documentation"
          className="flex items-center gap-2 text-lg font-semibold text-white hover:text-green-400 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-xs font-bold">
            PT
          </div>
          <span>PalmTechnIQ</span>
        </Link>
        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-medium rounded bg-gray-800 text-gray-400 border border-gray-700">
          {version}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search documentation..."
          className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {!searchQuery && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-500 rounded border border-gray-700">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {filteredSections.map((section) => {
          const Icon = section.icon ? iconMap[section.icon] : null;
          const isOpen = openSections.includes(section.slug);

          return (
            <div key={section.slug}>
              <button
                onClick={() => toggleSection(section.slug)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-colors group">
                <span className="flex items-center gap-2">
                  {Icon && (
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                  )}
                  {section.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && section.children && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-800 pl-3">
                  {section.children.map((child) => {
                    const isActive =
                      currentSection === section.slug &&
                      currentPage === child.slug;
                    return (
                      <Link
                        key={child.slug}
                        href={`/documentation/${section.slug}/${child.slug}`}
                        className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                          isActive
                            ? "text-green-400 bg-green-500/10 font-medium"
                            : "text-gray-400 hover:text-white hover:bg-gray-900"
                        }`}>
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="mt-8 pt-6 border-t border-gray-800 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to PalmTechnIQ
        </Link>
      </div>
    </div>
  );
}
