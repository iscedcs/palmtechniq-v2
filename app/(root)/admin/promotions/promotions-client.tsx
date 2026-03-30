"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Plus,
  Search,
  Settings,
  Eye,
  MousePointerClick,
  Trash2,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { toast } from "sonner";
import {
  createAdminPromotion,
  updatePromotionStatus,
  deletePromotion,
  updatePromotionSettings,
  searchCoursesForPromotion,
  getAdminPromotions,
  approvePromotion,
  getNextAvailableSlot,
} from "@/actions/promotions";

type Promotion = {
  id: string;
  courseId: string;
  promotedBy: string;
  type: string;
  status: string;
  headline: string | null;
  description: string | null;
  ctaText: string | null;
  promoPrice: number | null;
  originalPrice: number | null;
  startDate: string | Date;
  endDate: string | Date;
  fee: number;
  feePaid: boolean;
  impressions: number;
  clicks: number;
  priority: number;
  createdAt: string | Date;
  course: {
    id: string;
    title: string;
    slug: string | null;
    thumbnail: string | null;
  };
  promoter: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type PromotionSettings = {
  promotionsEnabled: boolean;
  tutorPromotionFee: number;
  maxActivePromotions: number;
  defaultPromotionDays: number;
};

type CourseSearchResult = {
  id: string;
  title: string;
  slug: string | null;
  thumbnail: string | null;
  currentPrice: number | null;
  price: number;
  tutor: { user: { name: string } };
};

const statusIcon: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-4 h-4 text-green-500" />,
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  PENDING_PAYMENT: <Clock className="w-4 h-4 text-orange-500" />,
  EXPIRED: <XCircle className="w-4 h-4 text-gray-500" />,
  REJECTED: <Ban className="w-4 h-4 text-red-500" />,
  CANCELLED: <Ban className="w-4 h-4 text-red-400" />,
};

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PENDING_PAYMENT: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-400/20",
};

export default function AdminPromotionsClient({
  initialPromotions,
  initialSettings,
}: {
  initialPromotions: Promotion[];
  initialSettings: PromotionSettings;
}) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [settings, setSettings] = useState(initialSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<CourseSearchResult[]>([]);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  // Create form state
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("Enroll Now");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("10");
  const [promoPrice, setPromoPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");

  // Approve dialog state
  const [showApprove, setShowApprove] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Promotion | null>(null);
  const [approveStartDate, setApproveStartDate] = useState("");
  const [approveEndDate, setApproveEndDate] = useState("");
  const [approvePriority, setApprovePriority] = useState("5");
  const [loadingSlot, setLoadingSlot] = useState(false);

  async function handleSearchCourses() {
    if (!courseSearch.trim()) return;
    const res = await searchCoursesForPromotion(courseSearch);
    if (res && "courses" in res) {
      setCourseResults(res.courses ?? []);
    }
  }

  async function handleCreatePromotion() {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please set start and end dates");
      return;
    }
    setLoading(true);
    const res = await createAdminPromotion({
      courseId: selectedCourse.id,
      headline: headline || undefined,
      description: description || undefined,
      ctaText: ctaText || undefined,
      promoPrice: promoPrice ? parseFloat(promoPrice) : undefined,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      startDate,
      endDate,
      priority: parseInt(priority) || 10,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Promotion created successfully");
      setShowCreate(false);
      resetForm();
      refreshPromotions();
    }
  }

  function resetForm() {
    setSelectedCourse(null);
    setCourseSearch("");
    setCourseResults([]);
    setHeadline("");
    setDescription("");
    setCtaText("Enroll Now");
    setStartDate("");
    setEndDate("");
    setPriority("10");
    setPromoPrice("");
    setOriginalPrice("");
  }

  async function openApproveDialog(promo: Promotion) {
    setApproveTarget(promo);
    setShowApprove(true);
    setLoadingSlot(true);
    try {
      const durationMs =
        new Date(promo.endDate).getTime() - new Date(promo.startDate).getTime();
      const durationDays = Math.max(1, Math.round(durationMs / 86400000));
      const slot = await getNextAvailableSlot(durationDays);
      setApproveStartDate(new Date(slot.startDate).toISOString().slice(0, 16));
      setApproveEndDate(new Date(slot.endDate).toISOString().slice(0, 16));
    } catch {
      toast.error("Failed to fetch schedule");
    } finally {
      setLoadingSlot(false);
    }
  }

  async function handleApprove() {
    if (!approveTarget || !approveStartDate || !approveEndDate) return;
    setLoading(true);
    const res = await approvePromotion(approveTarget.id, {
      startDate: approveStartDate,
      endDate: approveEndDate,
      priority: parseInt(approvePriority) || 5,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Promotion approved and scheduled");
      setShowApprove(false);
      setApproveTarget(null);
      refreshPromotions();
    }
  }

  async function refreshPromotions() {
    const res = await getAdminPromotions();
    if (res && "promotions" in res) {
      setPromotions(res.promotions ?? []);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await updatePromotionStatus(id, status as any);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Promotion ${status.toLowerCase()}`);
      refreshPromotions();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion?")) return;
    const res = await deletePromotion(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Promotion deleted");
      refreshPromotions();
    }
  }

  async function handleSettingsSave() {
    setLoading(true);
    const res = await updatePromotionSettings(settings);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Settings updated");
      setShowSettings(false);
    }
  }

  const filtered = promotions.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.promoter.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "ALL" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.status === "ACTIVE").length,
    pending: promotions.filter((p) => p.status === "PENDING").length,
    totalImpressions: promotions.reduce((s, p) => s + p.impressions, 0),
    totalClicks: promotions.reduce((s, p) => s + p.clicks, 0),
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-primary" />
              Course Promotions
            </h1>
            <p className="text-gray-400 mt-1">
              Manage promoted courses and ad settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="bg-primary hover:bg-secondary text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Promotion
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Megaphone },
            { label: "Active", value: stats.active, icon: CheckCircle },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "Impressions", value: stats.totalImpressions, icon: Eye },
            {
              label: "Clicks",
              value: stats.totalClicks,
              icon: MousePointerClick,
            },
          ].map((s) => (
            <Card key={s.label} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {s.value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search promotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] bg-gray-900/50 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Awaiting Payment</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promotions enabled indicator */}
        {!settings.promotionsEnabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400 text-sm flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Promotions are currently <strong>disabled</strong>. No ads will show
            to users. Go to Settings to enable.
          </div>
        )}

        {/* Table */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Course</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Promoter</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Period</TableHead>
                  <TableHead className="text-gray-400 text-center">
                    <Eye className="w-4 h-4 inline mr-1" />
                    /
                    <MousePointerClick className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="text-gray-400">Fee</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-12">
                      No promotions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((promo) => {
                    const start = new Date(promo.startDate);
                    const end = new Date(promo.endDate);
                    const ctr =
                      promo.impressions > 0
                        ? ((promo.clicks / promo.impressions) * 100).toFixed(1)
                        : "0";
                    return (
                      <TableRow
                        key={promo.id}
                        className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium max-w-[200px] truncate">
                          {promo.course.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              promo.type === "ADMIN"
                                ? "border-blue-500/30 text-blue-400"
                                : "border-purple-500/30 text-purple-400"
                            }>
                            {promo.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {promo.promoter.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColor[promo.status] || ""}>
                            <span className="mr-1">
                              {statusIcon[promo.status]}
                            </span>
                            {promo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {start.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          –{" "}
                          {end.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-center text-gray-300 text-sm">
                          {promo.impressions.toLocaleString()} /{" "}
                          {promo.clicks.toLocaleString()}
                          <span className="text-xs text-gray-500 block">
                            {ctr}% CTR
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {promo.fee > 0 ? (
                            <span className="flex items-center">
                              <NairaSign className="text-xs" />
                              {promo.fee.toLocaleString()}
                              {!promo.feePaid && (
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-xs border-red-500/30 text-red-400">
                                  Unpaid
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500">Free</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {promo.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-8 w-8 p-0"
                                  onClick={() => openApproveDialog(promo)}
                                  title="Approve & Schedule">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                  onClick={() =>
                                    handleStatusChange(promo.id, "REJECTED")
                                  }
                                  title="Reject">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {promo.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 w-8 p-0"
                                onClick={() =>
                                  handleStatusChange(promo.id, "CANCELLED")
                                }
                                title="Cancel">
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                              onClick={() => handleDelete(promo.id)}
                              title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ─── Create Promotion Dialog ────────────────────────────────────── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                Create Promotion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Course search */}
              <div className="space-y-2">
                <Label>Select Course</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchCourses()
                    }
                    className="bg-gray-800 border-gray-700"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSearchCourses}
                    className="bg-gray-700 hover:bg-gray-600">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {courseResults.length > 0 && !selectedCourse && (
                  <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg divide-y divide-gray-800">
                    {courseResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCourse(c);
                          setHeadline(c.title);
                          setOriginalPrice(
                            String(c.currentPrice ?? c.price ?? ""),
                          );
                          setCourseResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-800 text-sm">
                        <p className="text-white font-medium truncate">
                          {c.title}
                        </p>
                        <p className="text-gray-500 text-xs">
                          by {c.tutor.user.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCourse && (
                  <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {selectedCourse.title}
                      </p>
                      <p className="text-gray-400 text-xs">
                        by {selectedCourse.tutor.user.name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCourse(null)}
                      className="text-gray-400 hover:text-white h-8 w-8 p-0">
                      ×
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  placeholder="Promotion headline..."
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Short promo description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>
                    Promo Price (<NairaSign className="text-xs" />)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Special promo price"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Original Price (<NairaSign className="text-xs" />)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Crossed-out price"
                    value={originalPrice}
                    disabled
                    className="bg-gray-800 border-gray-700 opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={handleCreatePromotion}
                disabled={loading || !selectedCourse}>
                {loading ? "Creating..." : "Create Promotion"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Approve & Schedule Dialog ─────────────────────────────────── */}
        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Approve & Schedule Promotion
              </DialogTitle>
            </DialogHeader>
            {approveTarget && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-white font-medium">
                    {approveTarget.course.title}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Requested by {approveTarget.promoter.name}
                  </p>
                  {approveTarget.headline && (
                    <p className="text-gray-400 text-sm mt-1">
                      &ldquo;{approveTarget.headline}&rdquo;
                    </p>
                  )}
                </div>

                {loadingSlot ? (
                  <p className="text-gray-400 text-sm">
                    Loading next available slot...
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="datetime-local"
                          value={approveStartDate}
                          onChange={(e) => setApproveStartDate(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="datetime-local"
                          value={approveEndDate}
                          onChange={(e) => setApproveEndDate(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={approvePriority}
                        onChange={(e) => setApprovePriority(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                      <p className="text-gray-500 text-xs">
                        Higher = shown first if overlapping with other
                        promotions
                      </p>
                    </div>
                  </>
                )}

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={
                    loading ||
                    loadingSlot ||
                    !approveStartDate ||
                    !approveEndDate
                  }>
                  {loading ? "Approving..." : "Approve & Schedule"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Settings Dialog ────────────────────────────────────────────── */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Promotion Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Promotions</Label>
                  <p className="text-gray-400 text-sm">
                    Show promotional popups to users on courses page
                  </p>
                </div>
                <Switch
                  checked={settings.promotionsEnabled}
                  onCheckedChange={(val) =>
                    setSettings({ ...settings, promotionsEnabled: val })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Tutor Promotion Fee (<NairaSign className="text-xs" />)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.tutorPromotionFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tutorPromotionFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-gray-500 text-xs">
                  Fee charged to tutors for promoting their courses
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Active Promotions</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxActivePromotions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxActivePromotions: parseInt(e.target.value) || 5,
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Promotion Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.defaultPromotionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultPromotionDays: parseInt(e.target.value) || 7,
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={handleSettingsSave}
                disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
