"use client";

import { useMemo, useState } from "react";
import {
  type AdminApplicationItem,
  type AdminApplicationStatus,
  getTutorMentorApplications,
  updateTutorMentorApplicationStatus,
} from "@/actions/admin-applications";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, FileText, CheckCircle2, Clock3, XCircle } from "lucide-react";

type ApplicationsStats = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function statusBadgeClass(status: AdminApplicationStatus) {
  if (status === "PENDING") {
    return "border-yellow-500 text-yellow-400 bg-yellow-500/10";
  }
  if (status === "UNDER_REVIEW") {
    return "border-blue-500 text-blue-400 bg-blue-500/10";
  }
  if (status === "APPROVED") {
    return "border-green-500 text-green-400 bg-green-500/10";
  }
  return "border-red-500 text-red-400 bg-red-500/10";
}

export default function AdminApplicationsClient({
  initialApplications,
  initialStats,
}: {
  initialApplications: AdminApplicationItem[];
  initialStats: ApplicationsStats;
}) {
  const [applications, setApplications] =
    useState<AdminApplicationItem[]>(initialApplications);
  const [stats, setStats] = useState<ApplicationsStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminApplicationStatus>(
    "all"
  );
  const [selected, setSelected] = useState<AdminApplicationItem | null>(null);
  const [newStatus, setNewStatus] = useState<AdminApplicationStatus>("PENDING");
  const [reviewNote, setReviewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!term) return true;
      return [item.name, item.email, item.currentRole, item.applicationType]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [applications, search, statusFilter]);

  const refresh = async () => {
    const res = await getTutorMentorApplications();
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setApplications(res.applications);
    setStats(res.stats);
  };

  const openDetails = (application: AdminApplicationItem) => {
    setSelected(application);
    setNewStatus(application.status);
    setReviewNote(application.reviewNote || "");
  };

  const saveStatus = async () => {
    if (!selected) return;
    setIsSaving(true);
    const res = await updateTutorMentorApplicationStatus({
      registrationId: selected.id,
      status: newStatus,
      note: reviewNote,
    });
    if ("error" in res) {
      toast.error(res.error);
      setIsSaving(false);
      return;
    }
    toast.success("Application status updated.");
    await refresh();
    setIsSaving(false);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              Tutor & Mentor Applications
            </h1>
            <p className="text-gray-400">
              Review applications, update status, and manage recruitment workflow.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={refresh}
            className="border-neon-blue/50 bg-transparent hover:bg-neon-blue/10"
          >
            Refresh
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl text-white font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-yellow-400">Pending</p>
              <p className="text-2xl text-white font-semibold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-blue-400">Under Review</p>
              <p className="text-2xl text-white font-semibold">
                {stats.underReview}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-green-400">Approved</p>
              <p className="text-2xl text-white font-semibold">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-red-400">Rejected</p>
              <p className="text-2xl text-white font-semibold">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, role..."
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | AdminApplicationStatus)
                }
              >
                <SelectTrigger className="w-full md:w-56 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Submitted</TableHead>
                    <TableHead className="text-gray-400">Applicant</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell className="text-gray-400" colSpan={6}>
                        No applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell className="text-gray-300">
                          {formatDate(item.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.email}</p>
                        </TableCell>
                        <TableCell className="text-gray-300 uppercase">
                          {item.applicationType}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {item.currentRole || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(item)}
                            className="border-white/20 bg-transparent text-white hover:bg-white/10"
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl bg-gray-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Application Review
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neon-blue" />
                  <p className="font-medium">{selected.name}</p>
                </div>
                <p className="text-sm text-gray-300">{selected.email}</p>
                <p className="text-sm text-gray-300">
                  Type:{" "}
                  <span className="uppercase">{selected.applicationType}</span>
                </p>
                <p className="text-sm text-gray-300">
                  Role: {selected.currentRole || "N/A"}
                </p>
                <p className="text-sm text-gray-300">
                  Industry: {selected.industry || "N/A"}
                </p>
                <p className="text-sm text-gray-300">
                  Experience: {selected.experience || "N/A"}
                </p>
                <p className="text-sm text-gray-300">
                  Submitted: {formatDate(selected.submittedAt)}
                </p>
                {selected.reviewedAt ? (
                  <p className="text-sm text-gray-300">
                    Last reviewed: {formatDate(selected.reviewedAt)}
                  </p>
                ) : null}
                {selected.resumeUrl ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-neon-blue/50 bg-transparent text-white hover:bg-neon-blue/10"
                  >
                    <a
                      href={selected.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Resume
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-yellow-400">
                    Resume file missing in this submission.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Update status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) =>
                      setNewStatus(value as AdminApplicationStatus)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="w-4 h-4" />
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value="UNDER_REVIEW">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Under Review
                        </span>
                      </SelectItem>
                      <SelectItem value="APPROVED">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved
                        </span>
                      </SelectItem>
                      <SelectItem value="REJECTED">
                        <span className="inline-flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="review-note" className="text-white">
                    Admin review note
                  </Label>
                  <Textarea
                    id="review-note"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add review context for your team..."
                    className="mt-1 min-h-[140px] bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                    className="border-white/20 bg-transparent text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveStatus}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                  >
                    {isSaving ? "Saving..." : "Save Review"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
