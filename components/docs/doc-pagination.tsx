import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageRef {
  section: string;
  sectionSlug: string;
  page: { title: string; slug: string };
}

interface DocPaginationProps {
  prev: PageRef | null;
  next: PageRef | null;
}

export function DocPagination({ prev, next }: DocPaginationProps) {
  return (
    <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-800">
      {prev ? (
        <Link
          href={`/documentation/${prev.sectionSlug}/${prev.page.slug}`}
          className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <div>
            <div className="text-xs text-gray-600">{prev.section}</div>
            <div className="font-medium">{prev.page.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/documentation/${next.sectionSlug}/${next.page.slug}`}
          className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors text-right">
          <div>
            <div className="text-xs text-gray-600">{next.section}</div>
            <div className="font-medium">{next.page.title}</div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
