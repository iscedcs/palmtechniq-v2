import { FinanceTabs } from "@/components/pages/admin/finance-tabs";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <FinanceTabs />
      {children}
    </div>
  );
}
