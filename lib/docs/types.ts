export interface DocSection {
  title: string;
  slug: string;
  icon?: string;
  children?: DocPage[];
}

export interface DocPage {
  title: string;
  slug: string;
  description?: string;
  content: string;
  lastUpdated?: string;
  audience?: "all" | "developer" | "non-developer";
}

export interface DocBreadcrumb {
  label: string;
  href?: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}
