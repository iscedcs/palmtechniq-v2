"use client";

import { useState } from "react";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  Power,
  Users,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getTutorPromoCodes,
} from "@/actions/promo-codes";

type PromoCode = {
  id: string;
  code: string;
  promoType: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  isGlobal: boolean;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  courseId: string | null;
  course: { id: string; title: string } | null;
  _count: { redemptions: number };
};

type CourseOption = { id: string; title: string };

const ALL_COURSES = "__all__";

function formatDiscount(code: PromoCode) {
  return code.discountType === "PERCENTAGE"
    ? `${code.discountValue}% off`
    : `₦${code.discountValue.toLocaleString()} off`;
}

export default function TutorPromoCodesClient({
  initialPromoCodes,
  courses,
}: {
  initialPromoCodes: PromoCode[];
  courses: CourseOption[];
}) {
  const [promoCodes, setPromoCodes] = useState(initialPromoCodes);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState(ALL_COURSES);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");

  function resetForm() {
    setCode("");
    setCourseId(ALL_COURSES);
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setStartsAt("");
    setEndsAt("");
    setMaxRedemptions("");
    setPerUserLimit("");
  }

  async function refresh() {
    const res = await getTutorPromoCodes();
    if (res && "promoCodes" in res) {
      setPromoCodes(res.promoCodes ?? []);
    }
  }

  async function handleSubmit() {
    if (!code.trim()) {
      toast.error("Enter a code");
      return;
    }
    if (!discountValue) {
      toast.error("Enter a discount value");
      return;
    }
    setLoading(true);
    const res = await createPromoCode({
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      courseId: courseId === ALL_COURSES ? null : courseId,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Promo code created");
    setShowCreate(false);
    resetForm();
    refresh();
  }

  async function toggleActive(promo: PromoCode) {
    const res = await updatePromoCode(promo.id, { isActive: !promo.isActive });
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(promo.isActive ? "Code deactivated" : "Code activated");
    refresh();
  }

  async function handleDelete(promo: PromoCode) {
    if (promo._count.redemptions > 0) {
      toast.error(
        "This code has already been used — deactivate it instead of deleting",
      );
      return;
    }
    if (!confirm(`Delete promo code "${promo.code}"?`)) return;
    const res = await deletePromoCode(promo.id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Promo code deleted");
    refresh();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-7 h-7 text-primary" />
              Promo Codes
            </h1>
            <p className="text-gray-400 mt-1">
              Create discount codes for one course, or leave the course blank
              to apply across all of your courses.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-secondary text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Code
          </Button>
        </div>

        {promoCodes.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="py-16 text-center">
              <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                You haven&apos;t created any promo codes yet.
              </p>
              <Button
                className="mt-4 bg-primary hover:bg-secondary"
                onClick={() => setShowCreate(true)}>
                Create Your First Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {promoCodes.map((promo) => (
              <Card key={promo.id} className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-lg text-white font-semibold tracking-wide">
                          {promo.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-white"
                          onClick={() => copyCode(promo.code)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Badge
                          variant="outline"
                          className={
                            promo.isActive
                              ? "border-green-500/20 text-green-400"
                              : "border-gray-600 text-gray-400"
                          }>
                          {promo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">
                        {formatDiscount(promo)} ·{" "}
                        {promo.course ? promo.course.title : "All my courses"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {promo.startsAt || promo.endsAt ? (
                          <span>
                            {promo.startsAt
                              ? new Date(promo.startsAt).toLocaleDateString(
                                  "en-GB",
                                  { day: "2-digit", month: "short" },
                                )
                              : "now"}{" "}
                            –{" "}
                            {promo.endsAt
                              ? new Date(promo.endsAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "no end date"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <InfinityIcon className="w-3.5 h-3.5" /> No time
                            limit
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {promo._count.redemptions} used
                          {promo.maxRedemptions
                            ? ` / ${promo.maxRedemptions}`
                            : ""}
                        </span>
                        {promo.perUserLimit && (
                          <span>Max {promo.perUserLimit} per student</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300"
                        onClick={() => toggleActive(promo)}>
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {promo.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(promo)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                New Promo Code
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="e.g. LAUNCH20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-gray-800 border-gray-700 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Applies to</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_COURSES}>
                      All my courses
                    </SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) =>
                      setDiscountType(v as "PERCENTAGE" | "FIXED")
                    }>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {discountType === "PERCENTAGE" ? "Percent off" : "Amount off (₦)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Starts (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ends (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Total use limit (optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per-student limit (optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-secondary"
                onClick={handleSubmit}
                disabled={loading}>
                {loading ? "Creating..." : "Create Code"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
