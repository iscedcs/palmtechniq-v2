"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/finance", label: "Overview", exact: true },
  { href: "/admin/finance/payments", label: "Payments", exact: false },
  { href: "/admin/finance/payouts", label: "Payouts", exact: false },
  { href: "/admin/finance/programs", label: "Programs", exact: false },
];

export function FinanceTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Finance sections"
      className="container mx-auto px-6 pb-2 flex gap-2 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
