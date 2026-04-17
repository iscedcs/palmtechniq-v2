"use client";

import { useState } from "react";
import Link from "next/link";
import type { DocSection } from "@/lib/docs/types";
import { Menu, X, Search, ChevronDown } from "lucide-react";

interface DocMobileNavProps {
  sections: DocSection[];
  currentSection: string;
  currentPage: string;
  version: string;
}

export function DocMobileNav({
  sections,
  currentSection,
  currentPage,
  version,
}: DocMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([currentSection]);

  const toggleSection = (slug: string) => {
    setOpenSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const currentPageTitle =
    sections
      .find((s) => s.slug === currentSection)
      ?.children?.find((c) => c.slug === currentPage)?.title ?? "Documentation";

  const filteredSections = sections
    .map((section) => {
      if (!searchQuery) return section;
      const filteredChildren = section.children?.filter(
        (child) =>
          child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          child.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredChildren?.length) {
        return { ...section, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as DocSection[];

  return (
    <div className="lg:hidden sticky top-16 z-40 bg-gray-950 border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
      >
        <span className="text-gray-400">
          Docs /{" "}
          <span className="text-white font-medium">{currentPageTitle}</span>
        </span>
        {isOpen ? (
          <X className="w-5 h-5 text-gray-400" />
        ) : (
          <Menu className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-950 border-b border-gray-800 max-h-[70vh] overflow-y-auto shadow-xl">
          {/* Search */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search docs..."
                className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">{version}</div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {filteredSections.map((section) => {
              const isOpenSection = openSections.includes(section.slug);
              return (
                <div key={section.slug}>
                  <button
                    onClick={() => toggleSection(section.slug)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg"
                  >
                    {section.title}
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transition-transform ${
                        isOpenSection ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpenSection && section.children && (
                    <div className="ml-3 border-l border-gray-800 pl-3 space-y-0.5">
                      {section.children.map((child) => {
                        const isActive =
                          currentSection === section.slug &&
                          currentPage === child.slug;
                        return (
                          <Link
                            key={child.slug}
                            href={`/documentation/${section.slug}/${child.slug}`}
                            onClick={() => setIsOpen(false)}
                            className={`block px-3 py-1.5 text-sm rounded-md ${
                              isActive
                                ? "text-green-400 bg-green-500/10 font-medium"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
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
        </div>
      )}
    </div>
  );
}
