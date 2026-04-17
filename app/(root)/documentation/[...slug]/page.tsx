import {
  findDocPage,
  getAdjacentPages,
  docSections,
  DOC_VERSION,
} from "@/lib/docs/content";
import { DocSidebar } from "@/components/docs/doc-sidebar";
import { DocContent } from "@/components/docs/doc-content";
import { DocTableOfContents } from "@/components/docs/doc-toc";
import { DocBreadcrumbs } from "@/components/docs/doc-breadcrumbs";
import { DocPagination } from "@/components/docs/doc-pagination";
import { DocMobileNav } from "@/components/docs/doc-mobile-nav";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length < 2) return { title: "Documentation" };

  const [sectionSlug, pageSlug] = slug;
  const result = findDocPage(sectionSlug, pageSlug);
  if (!result) return { title: "Documentation" };

  return {
    title: result.page.title,
    description: result.page.description,
  };
}

export async function generateStaticParams() {
  const paths: { slug: string[] }[] = [];
  for (const section of docSections) {
    if (section.children) {
      for (const page of section.children) {
        paths.push({ slug: [section.slug, page.slug] });
      }
    }
  }
  return paths;
}

export default async function DocCatchAllPage({ params }: DocPageProps) {
  const { slug } = await params;

  if (!slug || slug.length < 2) {
    notFound();
  }

  const [sectionSlug, pageSlug] = slug;
  const result = findDocPage(sectionSlug, pageSlug);

  if (!result) {
    notFound();
  }

  const { section, page } = result;
  const adjacent = getAdjacentPages(sectionSlug, pageSlug);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile navigation */}
      <DocMobileNav
        sections={docSections}
        currentSection={sectionSlug}
        currentPage={pageSlug}
        version={DOC_VERSION}
      />

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-gray-800 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <DocSidebar
            sections={docSections}
            currentSection={sectionSlug}
            currentPage={pageSlug}
            version={DOC_VERSION}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 py-8 lg:px-12 lg:py-24">
          <DocBreadcrumbs section={section.title} page={page.title} />

          <DocContent
            content={page.content}
            lastUpdated={page.lastUpdated}
            audience={page.audience}
          />

          <DocPagination prev={adjacent.prev} next={adjacent.next} />
        </main>

        {/* Table of contents - hidden on smaller screens */}
        <aside className="hidden xl:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <DocTableOfContents content={page.content} />
        </aside>
      </div>
    </div>
  );
}
