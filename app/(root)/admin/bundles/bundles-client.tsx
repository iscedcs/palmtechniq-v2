"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatToNaira } from "@/lib/utils";
import { reviewBundle } from "@/actions/bundles";

type BundleCourse = {
  id: string;
  title: string;
  listPrice: number;
  sales90d: number;
  revenue90d: number;
};

type Bundle = {
  id: string;
  title: string;
  slug: string;
  price: number;
  listSum: number;
  priceFloor: number;
  discountPercent: number;
  reviewStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  submittedAt: string | null;
  isActive: boolean;
  tutorName: string;
  tutorEmail: string;
  courses: BundleCourse[];
};

const statusStyle: Record<Bundle["reviewStatus"], string> = {
  DRAFT: "border-muted-foreground/30 text-muted-foreground",
  PENDING_REVIEW: "border-amber-500/40 text-amber-600",
  APPROVED: "border-emerald-500/40 text-emerald-600",
  REJECTED: "border-red-500/40 text-red-600",
};

export default function AdminBundlesClient({ bundles }: { bundles: Bundle[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = (
    bundleId: string,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setBusyId(bundleId);
    startTransition(async () => {
      const result = await reviewBundle({
        bundleId,
        decision,
        note: notes[bundleId],
      });
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        decision === "APPROVED" ? "Bundle approved" : "Bundle sent back",
      );
    });
  };

  const queue = bundles.filter((b) => b.reviewStatus === "PENDING_REVIEW");
  const rest = bundles.filter((b) => b.reviewStatus !== "PENDING_REVIEW");

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Course Bundles</h1>
          <p className="py-2 text-sm text-foreground">
            The tutor sets the bundle price, but the platform absorbs 75% of the
            discount on a platform-attributed sale. Review the discount depth and
            whether the bundle grows the pie or just discounts sales that were
            already happening.
          </p>
        </div>

        {queue.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Awaiting review ({queue.length})
            </h2>
            {queue.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                busy={pending && busyId === bundle.id}
                note={notes[bundle.id] ?? ""}
                onNote={(value) =>
                  setNotes((prev) => ({ ...prev, [bundle.id]: value }))
                }
                onDecide={decide}
                actionable
              />
            ))}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All bundles
          </h2>
          {rest.length === 0 && queue.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No bundles yet.
              </CardContent>
            </Card>
          )}
          {rest.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              busy={pending && busyId === bundle.id}
              note={notes[bundle.id] ?? ""}
              onNote={(value) =>
                setNotes((prev) => ({ ...prev, [bundle.id]: value }))
              }
              onDecide={decide}
              actionable={bundle.reviewStatus === "APPROVED"}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function BundleCard({
  bundle,
  busy,
  note,
  onNote,
  onDecide,
  actionable,
}: {
  bundle: Bundle;
  busy: boolean;
  note: string;
  onNote: (value: string) => void;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED") => void;
  actionable: boolean;
}) {
  // Cannibalisation signal: a bundle of the tutor's two strongest sellers
  // discounts revenue that was already arriving.
  const ranked = [...bundle.courses].sort((a, b) => b.sales90d - a.sales90d);
  const topTwoBundled =
    ranked.length >= 2 && ranked[0].sales90d > 0 && ranked[1].sales90d > 0;

  const atFloor = bundle.price <= bundle.priceFloor;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{bundle.title}</CardTitle>
              <p className="text-sm text-foreground">
                {bundle.tutorName} · {bundle.tutorEmail}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!bundle.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Paused by tutor
                </Badge>
              )}
              <Badge variant="outline" className={statusStyle[bundle.reviewStatus]}>
                {bundle.reviewStatus.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Figure label="List total" value={formatToNaira(bundle.listSum)} />
            <Figure label="Bundle price" value={formatToNaira(bundle.price)} />
            <Figure
              label="Discount"
              value={`${bundle.discountPercent}%`}
              warn={atFloor}
            />
            <Figure label="Floor" value={formatToNaira(bundle.priceFloor)} />
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-medium">Course</th>
                  <th className="p-2 text-right font-medium">List price</th>
                  <th className="p-2 text-right font-medium">Sales (90d)</th>
                  <th className="p-2 text-right font-medium">Revenue (90d)</th>
                </tr>
              </thead>
              <tbody>
                {bundle.courses.map((course) => (
                  <tr key={course.id} className="border-b last:border-0">
                    <td className="p-2">{course.title}</td>
                    <td className="p-2 text-right">
                      {formatToNaira(course.listPrice)}
                    </td>
                    <td className="p-2 text-right">{course.sales90d}</td>
                    <td className="p-2 text-right">
                      {formatToNaira(course.revenue90d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {topTwoBundled && (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              Both of the tutor&apos;s top-selling courses here already sell on
              their own. Bundling them discounts sales that were likely to happen
              anyway. Prefer bundles pairing a strong seller with weaker courses.
            </p>
          )}

          {bundle.reviewNote && (
            <p className="text-xs text-muted-foreground">
              Last note: {bundle.reviewNote}
            </p>
          )}

          {actionable && (
            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Input
                placeholder="Reason (shown to the tutor on rejection)"
                value={note}
                onChange={(e) => onNote(e.target.value)}
                className="max-w-sm"
              />
              <Button
                size="sm"
                onClick={() => onDecide(bundle.id, "APPROVED")}
                disabled={busy}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide(bundle.id, "REJECTED")}
                disabled={busy}
              >
                <X className="mr-1 h-4 w-4" />
                Send back
              </Button>
              <Link
                href={`/bundles/${bundle.slug}`}
                className="text-xs text-muted-foreground underline"
                target="_blank"
              >
                Preview
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Figure({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${warn ? "text-amber-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
