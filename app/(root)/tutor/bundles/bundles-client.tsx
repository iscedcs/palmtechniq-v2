"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Package,
  Plus,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatToNaira } from "@/lib/utils";
import {
  createCourseBundle,
  submitBundleForReview,
  updateCourseBundle,
} from "@/actions/bundles";

type CourseOption = { id: string; title: string; listPrice: number };

type Bundle = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  isActive: boolean;
  reviewStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  courses: CourseOption[];
};

type Limits = {
  maxDiscount: number;
  minPrice: number;
  minCourses: number;
};

const statusStyle: Record<Bundle["reviewStatus"], string> = {
  DRAFT: "border-muted-foreground/30 text-muted-foreground",
  PENDING_REVIEW: "border-amber-500/40 text-amber-600",
  APPROVED: "border-emerald-500/40 text-emerald-600",
  REJECTED: "border-red-500/40 text-red-600",
};

export default function TutorBundlesClient({
  bundles,
  availableCourses,
  limits,
}: {
  bundles: Bundle[];
  availableCourses: CourseOption[];
  limits: Limits;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="mx-auto max-w-4xl space-y-6 px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Package className="h-6 w-6" />
              Course Bundles
            </h1>
            <p className="py-2 text-sm text-foreground">
              Sell several of your courses together at one price. Bundles are
              reviewed by the platform before they go live.
            </p>
          </div>
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New bundle
              </>
            )}
          </Button>
        </div>

        {availableCourses.length < limits.minCourses && (
          <Card>
            <CardContent className="flex items-start gap-2 p-4 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              You need at least {limits.minCourses} published courses to make a
              bundle. You have {availableCourses.length}.
            </CardContent>
          </Card>
        )}

        {creating && availableCourses.length >= limits.minCourses && (
          <BundleForm
            availableCourses={availableCourses}
            limits={limits}
            onDone={() => setCreating(false)}
          />
        )}

        <div className="space-y-4">
          {bundles.length === 0 && !creating && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No bundles yet.
              </CardContent>
            </Card>
          )}

          {bundles.map((bundle) => (
            <BundleRow key={bundle.id} bundle={bundle} limits={limits} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BundleForm({
  availableCourses,
  limits,
  onDone,
}: {
  availableCourses: CourseOption[];
  limits: Limits;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const chosen = availableCourses.filter((c) => selected.includes(c.id));
  const listSum = chosen.reduce((sum, c) => sum + c.listPrice, 0);
  // Mirror of the server rule, shown live so the tutor isn't guessing.
  const priceFloor = useMemo(
    () => Math.max(Math.round(listSum * (1 - limits.maxDiscount)), limits.minPrice),
    [listSum, limits],
  );

  const priceNumber = Number(price) || 0;
  const belowFloor = priceNumber > 0 && priceNumber < priceFloor;
  const discountPercent =
    listSum > 0 && priceNumber > 0
      ? Math.round((1 - priceNumber / listSum) * 100)
      : 0;

  const canSubmit =
    title.trim().length > 0 &&
    selected.length >= limits.minCourses &&
    priceNumber >= priceFloor;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createCourseBundle({
        title,
        description,
        price: priceNumber,
        courseIds: selected,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Bundle created as a draft. Submit it for review when ready.");
      onDone();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New bundle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="bundle-title">Title</Label>
          <Input
            id="bundle-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Full-Stack Starter Pack"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bundle-description">Description (optional)</Label>
          <Textarea
            id="bundle-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will a student get out of this bundle?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Courses ({selected.length} selected, minimum {limits.minCourses})
          </Label>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
            {availableCourses.map((course) => {
              const isOn = selected.includes(course.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => toggle(course.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                    isOn ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {course.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatToNaira(course.listPrice)}
                  </span>
                  {isOn && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sold separately</span>
              <span className="font-medium">{formatToNaira(listSum)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">
                Lowest allowed price ({Math.round(limits.maxDiscount * 100)}% max
                discount)
              </span>
              <span className="font-medium">{formatToNaira(priceFloor)}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="bundle-price">Bundle price (₦)</Label>
          <Input
            id="bundle-price"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={priceFloor ? String(priceFloor) : "0"}
          />
          {belowFloor && (
            <p className="flex items-start gap-2 text-xs text-amber-600">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              Minimum is {formatToNaira(priceFloor)}. The platform absorbs most
              of a bundle discount, so discounts are capped at{" "}
              {Math.round(limits.maxDiscount * 100)}%.
            </p>
          )}
          {!belowFloor && priceNumber > 0 && listSum > 0 && (
            <p className="text-xs text-muted-foreground">
              Students save {formatToNaira(Math.max(0, listSum - priceNumber))} (
              {discountPercent}%). VAT is added at checkout.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={!canSubmit || pending}>
            {pending ? "Creating…" : "Create draft"}
          </Button>
          <Button variant="ghost" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BundleRow({ bundle, limits }: { bundle: Bundle; limits: Limits }) {
  const [pending, startTransition] = useTransition();
  const listSum = bundle.courses.reduce((sum, c) => sum + c.listPrice, 0);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/bundles/${bundle.slug}`
      : `/bundles/${bundle.slug}`;

  const submit = () => {
    startTransition(async () => {
      const result = await submitBundleForReview(bundle.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Sent for review.");
    });
  };

  const togglePause = (isActive: boolean) => {
    startTransition(async () => {
      const result = await updateCourseBundle({ bundleId: bundle.id, isActive });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Bundle resumed." : "Bundle paused.");
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{bundle.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {bundle.courses.length} courses ·{" "}
                {formatToNaira(bundle.price)} (was {formatToNaira(listSum)})
              </p>
            </div>
            <Badge variant="outline" className={statusStyle[bundle.reviewStatus]}>
              {bundle.reviewStatus.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {bundle.courses.map((course) => (
              <li key={course.id} className="flex justify-between gap-3">
                <span className="truncate">{course.title}</span>
                <span>{formatToNaira(course.listPrice)}</span>
              </li>
            ))}
          </ul>

          {bundle.reviewStatus === "REJECTED" && bundle.reviewNote && (
            <p className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-600">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              {bundle.reviewNote}
            </p>
          )}

          {bundle.reviewStatus === "PENDING_REVIEW" && (
            <p className="text-xs text-muted-foreground">
              Waiting for platform review. It is not purchasable yet.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            {(bundle.reviewStatus === "DRAFT" ||
              bundle.reviewStatus === "REJECTED") && (
              <Button size="sm" onClick={submit} disabled={pending}>
                <Send className="mr-1 h-4 w-4" />
                Submit for review
              </Button>
            )}

            {bundle.reviewStatus === "APPROVED" && (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={bundle.isActive}
                    onCheckedChange={togglePause}
                    disabled={pending}
                  />
                  <span className="text-sm">
                    {bundle.isActive ? "Live" : "Paused"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Bundle link copied");
                  }}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copy link
                </Button>
                <Link
                  href={`/bundles/${bundle.slug}`}
                  target="_blank"
                  className="text-xs text-muted-foreground underline"
                >
                  View page
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
