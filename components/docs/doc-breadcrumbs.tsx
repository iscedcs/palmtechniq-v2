import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DocBreadcrumbsProps {
  section: string;
  page: string;
}

export function DocBreadcrumbs({ section, page }: DocBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
      <Link
        href="/documentation"
        className="hover:text-white transition-colors">
        Docs
      </Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-gray-400">{section}</span>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-white font-medium">{page}</span>
    </nav>
  );
}
