"use client";

import { useState } from "react";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  Power,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getAdminPromoCodes,
} from "@/actions/promo-codes";
import { searchCoursesForPromotion } from "@/actions/promotions";

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
  creator: { id: string; name: string | null; email: string | null; role: string } | null;
  _count: { redemptions: number };
};

type CourseSearchResult = {
  id: string;
  title: string;
  tutor: { user: { name: string | null } } | null;
};

function formatDiscount(code: PromoCode) {
  return code.discountType === "PERCENTAGE"
    ? `${code.discountValue}%`
    : `₦${code.discountValue.toLocaleString()}`;
}

export default function AdminPromoCodesClient({
  initialPromoCodes,
}: {
  initialPromoCodes: PromoCode[];
}) {
  const [promoCodes, setPromoCodes] = useState(initialPromoCodes);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const [code, setCode] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<CourseSearchResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(
    null,
  );
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
    setCourseSearch("");
    setCourseResults([]);
    setSelectedCourse(null);
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setStartsAt("");
    setEndsAt("");
    setMaxRedemptions("");
    setPerUserLimit("");
  }

  async function refresh() {
    const res = await getAdminPromoCodes();
    if (res && "promoCodes" in res) {
      setPromoCodes(res.promoCodes ?? []);
    }
  }

  async function handleSearchCourses() {
    if (!courseSearch.trim()) return;
    const res = await searchCoursesForPromotion(courseSearch);
    if (res && "courses" in res) {
      setCourseResults((res.courses as CourseSearchResult[]) ?? []);
    } else if (res?.error) {
      toast.error(res.error);
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
      courseId: selectedCourse?.id ?? null,
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

  function copyCode(codeValue: string) {
    navigator.clipboard.writeText(codeValue);
    toast.success("Code copied");
  }

  const filtered = promoCodes.filter((p) => {
    if (filter === "active") return p.isActive;
    if (filter === "inactive") return !p.isActive;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-7 h-7 text-primary" />
            Promo Codes
          </h1>
          <p className="text-gray-400 mt-1">
            Every code across the platform — tutor-created and platform-wide.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Platform Code
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className={
              filter === f
                ? "bg-orange-600 hover:bg-orange-700"
                : "border-gray-700 text-gray-300"
            }
            onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {filtered.length} code{filtered.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Code</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Created By</TableHead>
                <TableHead className="text-gray-400">Applies To</TableHead>
                <TableHead className="text-gray-400">Discount</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Used</TableHead>
                <TableHead className="text-gray-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 py-10">
                    No promo codes yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((promo) => (
                  <TableRow key={promo.id} className="border-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white font-medium">
                          {promo.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-white"
                          onClick={() => copyCode(promo.code)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          promo.promoType === "PLATFORM"
                            ? "border-blue-500/20 text-blue-400"
                            : "border-purple-500/20 text-purple-400"
                        }>
                        {promo.promoType === "PLATFORM" ? "Platform" : "Tutor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {promo.creator?.name || promo.creator?.email || "—"}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {promo.course
                        ? promo.course.title
                        : promo.promoType === "PLATFORM"
                          ? "All courses"
                          : "All of creator's courses"}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {formatDiscount(promo)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          promo.isActive
                            ? "border-green-500/20 text-green-400"
                            : "border-gray-600 text-gray-400"
                        }>
                        {promo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {promo._count.redemptions}
                      {promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          title={promo.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleActive(promo)}>
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                          title="Delete"
                          onClick={() => handleDelete(promo)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              New Platform Promo Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="e.g. WELCOME10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Course (optional — leave blank for platform-wide)</Label>
              {selectedCourse ? (
                <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <span className="text-sm text-white">
                    {selectedCourse.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 h-6"
                    onClick={() => setSelectedCourse(null)}>
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchCourses();
                        }
                      }}
                      className="bg-gray-800 border-gray-700"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700"
                      onClick={handleSearchCourses}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {courseResults.length > 0 && (
                    <div className="border border-gray-700 rounded-md divide-y divide-gray-800 max-h-40 overflow-y-auto">
                      {courseResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                          onClick={() => {
                            setSelectedCourse(c);
                            setCourseResults([]);
                            setCourseSearch("");
                          }}>
                          {c.title}
                          {c.tutor?.user?.name && (
                            <span className="text-gray-500">
                              {" "}
                              — {c.tutor.user.name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              className="w-full bg-orange-600 hover:bg-orange-700"
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
