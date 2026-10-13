import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { getFinanceOverview } from "@/actions/admin-finance-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function Alert({
  tone,
  title,
  children,
}: {
  tone: "red" | "orange" | "yellow";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  }[tone];
  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${styles}`}>
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-300 mt-1">{children}</p>
      </div>
    </div>
  );
}

export default async function FinanceOverviewPage() {
  const data = await getFinanceOverview();
  if ("error" in data) {
    return <div className="p-8 text-red-400">{data.error}</div>;
  }

  const { position, summary, pendingWithdrawals } = data;
  const live = summary.live.COMPLETED;

  const owedRows = [
    { label: "Tutor and mentor wallets", value: position.owed.tutorAndMentorWallets },
    { label: "Withdrawals awaiting approval", value: position.owed.openWithdrawals },
    { label: "Program earnings accrued, not yet released", value: position.owed.accruedProgramEarnings },
    { label: "VAT to remit", value: position.owed.vatToRemit },
  ];

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Finance Overview</h1>
        <p className="text-gray-400">
          What has been collected, what is owed, and what is safe to withdraw.
        </p>
      </div>

      {data.testTransactionCount > 0 && (
        <Alert tone="orange" title="Test-mode transactions exist">
          {data.testTransactionCount} transaction
          {data.testTransactionCount === 1 ? " was" : "s were"} made with Paystack
          test keys. They are excluded from every figure here.{" "}
          <Link href="/admin/finance/payments" className="underline">
            See Payments
          </Link>
        </Alert>
      )}

      {data.balanceError && (
        <Alert tone="yellow" title="Paystack balance unavailable">
          {data.balanceError}. The figures that depend on the balance are hidden
          until it can be read.
        </Alert>
      )}

      {position.shortfall && position.available !== null && (
        <Alert tone="red" title="More is owed than the Paystack balance holds">
          The balance is short by {naira(Math.abs(position.available))}. Do not
          withdraw to the bank, and expect payout approvals to be refused until
          it is topped up.
        </Alert>
      )}

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Money position</CardTitle>
          <p className="text-sm text-gray-400">
            An estimate. It does not include Paystack fees or payments charged
            but not yet settled into the balance.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-sm text-gray-400">Paystack balance</p>
              <p className="text-2xl text-white font-semibold mt-1">
                {position.paystackBalance === null
                  ? "Unavailable"
                  : naira(position.paystackBalance)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-sm text-gray-400">Owed to others</p>
              <p className="text-2xl text-white font-semibold mt-1">
                {naira(position.totalOwed)}
              </p>
            </div>
            <div
              className={`rounded-lg border p-4 ${
                position.shortfall
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-green-500/30 bg-green-500/5"
              }`}>
              <p className="text-sm text-gray-400">
                {position.shortfall ? "Shortfall" : "Safe to withdraw"}
              </p>
              <p
                className={`text-2xl font-semibold mt-1 ${
                  position.shortfall ? "text-red-400" : "text-green-400"
                }`}>
                {position.available === null
                  ? "Unavailable"
                  : naira(Math.abs(position.available))}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 divide-y divide-white/10">
            {owedRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-300">{row.label}</span>
                <span className="text-sm text-white font-medium">{naira(row.value)}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            Student cashback credit of {naira(data.studentCredit)} is not counted:
            it is spendable store credit, not cash owed.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Live revenue</CardTitle>
          <p className="text-sm text-gray-400">
            Completed Paystack payments only. Legacy manual payments
            {data.legacyTransactionCount > 0
              ? ` (${data.legacyTransactionCount})`
              : ""}{" "}
            and test-mode payments are kept out.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Collected (incl. VAT)", value: live.gross },
            { label: "VAT", value: live.vat },
            { label: "Tutors' share", value: live.tutorShare },
            { label: "Platform share", value: live.platformShare },
            { label: "This month", value: data.thisMonthGross },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-white/10 p-4">
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-xl text-white font-semibold mt-1">{naira(item.value)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            href: "/admin/finance/payments",
            title: "Payments",
            note: `${live.count} completed, ${summary.live.PENDING.count} pending, ${summary.live.FAILED.count} failed`,
          },
          {
            href: "/admin/finance/payouts",
            title: "Payouts",
            note:
              pendingWithdrawals.count > 0
                ? `${pendingWithdrawals.count} awaiting approval (${naira(pendingWithdrawals.amount)})`
                : "No withdrawals waiting",
          },
          {
            href: "/admin/finance/programs",
            title: "Programs",
            note: "Cohorts, lead instructors and earnings releases",
          },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="glass-card border-white/10 hover:bg-white/5 transition-colors h-full">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{link.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{link.note}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
