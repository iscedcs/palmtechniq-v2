"use client";

import React, { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  GraduationCap,
  Heart,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  FileCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  QrCode,
} from "lucide-react";
import { CertificateQrModal } from "@/components/certificate/qr-code-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  getCertificatesList,
  getCertificateStats,
  generateNextCredentialId,
  issueCertificate,
  issueVolunteerCertificate,
  updateCertificate,
  toggleCertificateRevocation,
  deleteCertificate,
  IssueCertificateInput,
} from "@/actions/certificate-admin";

interface CertificateItem {
  id: string;
  credentialId: string;
  studentName: string;
  userEmail: string | null;
  userImage: string | null;
  userId: string | null;
  title: string;
  description: string | null;
  certificateUrl: string;
  category: "PROGRAM" | "COURSE" | "VOLUNTEER" | "GENERAL";
  programName: string | null;
  cohortName: string | null;
  courseName: string | null;
  grade: string | null;
  score: number | null;
  issuedAt: string;
  issuedDate: string;
  isRevoked: boolean;
  revocationReason: string | null;
  revokedAt: string | null;
  issuedByName: string | null;
  isVolunteer: boolean;
}

interface StatsData {
  total: number;
  programCertificates: number;
  courseCertificates: number;
  volunteerCertificates: number;
  generalCertificates: number;
  revoked: number;
  issuedThisMonth: number;
}

interface LookupData {
  students: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  }>;
  programs: Array<{
    id: string;
    name: string;
    slug: string;
    cohorts: Array<{ id: string; name: string }>;
  }>;
  courses: Array<{
    id: string;
    title: string;
    instructor: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    fullName: string;
    email: string;
    userId: string | null;
    programId: string;
    programName: string;
    cohortId: string;
    cohortName: string;
    status: string;
  }>;
}

interface CertificatesClientProps {
  initialCertificates: CertificateItem[];
  stats: StatsData;
  lookupData: LookupData;
  userRole: "ADMIN" | "SUPERIOR";
}

export default function CertificatesClient({
  initialCertificates,
  stats: initialStats,
  lookupData,
  userRole,
}: CertificatesClientProps) {
  const [certificates, setCertificates] =
    useState<CertificateItem[]>(initialCertificates);
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PROGRAM" | "COURSE" | "VOLUNTEER" | "REVOKED"
  >("ALL");
  const [isPending, startTransition] = useTransition();

  // Copied state tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Issue Certificate Modal States
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueMode, setIssueMode] = useState<
    "PROGRAM" | "COURSE" | "VOLUNTEER" | "CUSTOM"
  >("PROGRAM");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [certTitle, setCertTitle] = useState("");
  const [certDescription, setCertDescription] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [certGrade, setCertGrade] = useState("");
  const [certScore, setCertScore] = useState<string>("");
  const [volunteerRole, setVolunteerRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Attach URL Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Revocation Modal States
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokingCert, setRevokingCert] = useState<CertificateItem | null>(
    null,
  );
  const [revokeReason, setRevokeReason] = useState("");
  const [isSavingRevoke, setIsSavingRevoke] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCert, setDeletingCert] = useState<CertificateItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Code Modal States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCertData, setQrCertData] = useState<{
    credentialId: string;
    studentName?: string;
    certificateTitle?: string;
  }>({ credentialId: "" });

  const openQrModal = (cert: {
    credentialId: string;
    studentName?: string;
    title?: string;
  }) => {
    setQrCertData({
      credentialId: cert.credentialId,
      studentName: cert.studentName,
      certificateTitle: cert.title,
    });
    setQrModalOpen(true);
  };

  // Refresh certificate list
  const refreshData = async () => {
    startTransition(async () => {
      const typeFilter =
        activeTab === "REVOKED"
          ? "ALL"
          : activeTab === "ALL"
            ? "ALL"
            : activeTab;
      const statusFilter = activeTab === "REVOKED" ? "REVOKED" : "ALL";

      const [resCerts, resStats] = await Promise.all([
        getCertificatesList({
          search: searchQuery,
          type: typeFilter,
          status: statusFilter,
          pageSize: 100,
        }),
        getCertificateStats(),
      ]);

      if (resCerts.success && resCerts.certificates) {
        setCertificates(resCerts.certificates);
      }
      if (resStats.success && resStats.stats) {
        setStats(resStats.stats);
      }
    });
  };

  // Filter certificates on tab switch or search query
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      // Tab filter
      if (activeTab === "REVOKED") {
        if (!cert.isRevoked) return false;
      } else if (activeTab === "PROGRAM") {
        if (cert.category !== "PROGRAM") return false;
      } else if (activeTab === "COURSE") {
        if (cert.category !== "COURSE") return false;
      } else if (activeTab === "VOLUNTEER") {
        if (cert.category !== "VOLUNTEER") return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        cert.credentialId.toLowerCase().includes(q) ||
        cert.studentName.toLowerCase().includes(q) ||
        cert.title.toLowerCase().includes(q) ||
        (cert.userEmail && cert.userEmail.toLowerCase().includes(q)) ||
        (cert.programName && cert.programName.toLowerCase().includes(q)) ||
        (cert.courseName && cert.courseName.toLowerCase().includes(q))
      );
    });
  }, [certificates, activeTab, searchQuery]);

  // Handle 1-click Copy
  const handleCopy = (
    text: string,
    id: string,
    label: string = "Credential ID",
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Generate unique credential ID for current mode
  const handleGenerateId = async (
    mode: "PROGRAM" | "COURSE" | "VOLUNTEER" | "CUSTOM" = issueMode,
  ) => {
    setIsGeneratingId(true);
    try {
      const category =
        mode === "PROGRAM"
          ? "PROGRAM"
          : mode === "COURSE"
            ? "COURSE"
            : mode === "VOLUNTEER"
              ? "VOLUNTEER"
              : "GENERAL";
      const res = await generateNextCredentialId(category);
      if (res.success && res.credentialId) {
        setCredentialId(res.credentialId);
      } else {
        toast.error("Failed to generate credential ID");
      }
    } catch {
      toast.error("Error generating credential ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Open Issue Dialog
  const openIssueModal = async (
    defaultMode: "PROGRAM" | "COURSE" | "VOLUNTEER" | "CUSTOM" = "PROGRAM",
  ) => {
    setIssueMode(defaultMode);
    setSelectedStudentId("");
    setCustomStudentName("");
    setSelectedProgramId("");
    setSelectedCohortId("");
    setSelectedCourseId("");
    setCertTitle("");
    setCertDescription("");
    setCertificateUrl("");
    setCertGrade("");
    setCertScore("");
    setVolunteerRole("");
    setIsIssueOpen(true);
    await handleGenerateId(defaultMode);
  };

  // Pre-fill from enrollment quick action
  const handleQuickIssueFromEnrollment = async (
    enrollment: LookupData["recentEnrollments"][0],
  ) => {
    setIssueMode("PROGRAM");
    if (enrollment.userId) {
      setSelectedStudentId(enrollment.userId);
    }
    setCustomStudentName(enrollment.fullName);
    setSelectedProgramId(enrollment.programId);
    setSelectedCohortId(enrollment.cohortId);
    setCertTitle(`Professional Certificate in ${enrollment.programName}`);
    setCertDescription(
      `Successfully completed the ${enrollment.cohortName} cohort of ${enrollment.programName}.`,
    );
    setCertificateUrl("");
    setIsIssueOpen(true);
    await handleGenerateId("PROGRAM");
  };

  // Handle program selection changes to auto-fill title
  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const prog = lookupData.programs.find((p) => p.id === progId);
    if (prog) {
      if (!certTitle || certTitle.startsWith("Professional Certificate in")) {
        setCertTitle(`Professional Certificate in ${prog.name}`);
      }
      if (prog.cohorts.length > 0 && !selectedCohortId) {
        setSelectedCohortId(prog.cohorts[0].id);
      }
    }
  };

  // Handle course selection changes
  const handleCourseChange = (crsId: string) => {
    setSelectedCourseId(crsId);
    const crs = lookupData.courses.find((c) => c.id === crsId);
    if (
      crs &&
      (!certTitle || certTitle.startsWith("Certificate of Completion -"))
    ) {
      setCertTitle(`Certificate of Completion - ${crs.title}`);
    }
  };

  // Handle student selection change
  const handleStudentChange = (stdId: string) => {
    setSelectedStudentId(stdId);
    const student = lookupData.students.find((s) => s.id === stdId);
    if (student) {
      setCustomStudentName(student.name);
    }
  };

  // Submit Issue Certificate
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (issueMode === "VOLUNTEER") {
      if (!customStudentName.trim() || !certTitle.trim()) {
        toast.error("Volunteer name and Event name are required");
        return;
      }

      setIsSubmitting(true);
      const res = await issueVolunteerCertificate({
        volunteerName: customStudentName.trim(),
        eventName: certTitle.trim(),
        role: volunteerRole.trim() || undefined,
        description: certDescription.trim() || undefined,
        certCode: credentialId.trim() || undefined,
        certificateUrl: certificateUrl.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Volunteer certificate created successfully!");
      setIsIssueOpen(false);
      refreshData();
      return;
    }

    // Regular Certificate (Program / Course / Custom)
    if (!selectedStudentId && !customStudentName.trim()) {
      toast.error("Please select or enter a student name");
      return;
    }

    if (!selectedStudentId) {
      toast.error(
        "Please link an existing registered user profile for student certificate generation",
      );
      return;
    }

    if (!certTitle.trim()) {
      toast.error("Certificate title is required");
      return;
    }

    const payload: IssueCertificateInput = {
      userId: selectedStudentId,
      studentName: customStudentName.trim(),
      category:
        issueMode === "PROGRAM"
          ? "PROGRAM"
          : issueMode === "COURSE"
            ? "COURSE"
            : "GENERAL",
      programId:
        issueMode === "PROGRAM" ? selectedProgramId || undefined : undefined,
      cohortId:
        issueMode === "PROGRAM" ? selectedCohortId || undefined : undefined,
      courseId:
        issueMode === "COURSE" ? selectedCourseId || undefined : undefined,
      title: certTitle.trim(),
      description: certDescription.trim() || undefined,
      credentialId: credentialId.trim() || undefined,
      certificateUrl: certificateUrl.trim() || undefined,
      grade: certGrade.trim() || undefined,
      score: certScore ? parseFloat(certScore) : undefined,
    };

    setIsSubmitting(true);
    const res = await issueCertificate(payload);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      `Certificate issued with Credential ID: ${res.certificate?.credentialId}`,
    );
    setIsIssueOpen(false);
    refreshData();
  };

  // Open Edit Modal
  const openEditModal = (cert: CertificateItem) => {
    setEditingCert(cert);
    setEditUrl(cert.certificateUrl || "");
    setEditStudentName(cert.studentName || "");
    setEditTitle(cert.title || "");
    setEditGrade(cert.grade || "");
    setEditDescription(cert.description || "");
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    setIsSavingEdit(true);
    const res = await updateCertificate({
      id: editingCert.id,
      isVolunteer: editingCert.isVolunteer,
      studentName: editStudentName,
      title: editTitle,
      certificateUrl: editUrl,
      grade: editGrade,
      description: editDescription,
    });
    setIsSavingEdit(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Certificate updated successfully!");
    setIsEditOpen(false);
    refreshData();
  };

  // Open Revoke Modal
  const openRevokeModal = (cert: CertificateItem) => {
    setRevokingCert(cert);
    setRevokeReason(cert.revocationReason || "");
    setIsRevokeOpen(true);
  };

  // Confirm Revoke / Reinstate
  const handleRevokeConfirm = async () => {
    if (!revokingCert) return;
    const newStatus = !revokingCert.isRevoked;

    setIsSavingRevoke(true);
    const res = await toggleCertificateRevocation(revokingCert.id, {
      isRevoked: newStatus,
      reason: newStatus ? revokeReason : undefined,
      isVolunteer: revokingCert.isVolunteer,
    });
    setIsSavingRevoke(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      newStatus
        ? "Certificate has been revoked."
        : "Certificate reinstated successfully.",
    );
    setIsRevokeOpen(false);
    refreshData();
  };

  // Open Delete Modal
  const openDeleteModal = (cert: CertificateItem) => {
    setDeletingCert(cert);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingCert) return;

    setIsDeleting(true);
    const res = await deleteCertificate(
      deletingCert.id,
      deletingCert.isVolunteer,
    );
    setIsDeleting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Certificate deleted.");
    setIsDeleteOpen(false);
    refreshData();
  };

  // Filtered student list for student picker
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return lookupData.students;
    const q = studentSearch.toLowerCase();
    return lookupData.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [lookupData.students, studentSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/40 px-3 py-1">
                {userRole === "SUPERIOR" ? "Superior & Admin Portal" : "Admin Portal"}
              </Badge>
              <Badge variant="outline" className="border-neon-blue/40 text-neon-blue">
                Credential Verification Engine
              </Badge>
            </div> */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Certificates &{" "}
              <span className="text-gradient">Credential Management</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              Generate credential IDs, issue professional program & course
              certificates, attach cloud storage links, and manage verification
              records.
            </p>
          </div>

          <div className="flex  items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Link href="/verify-certificate" target="_blank">
                <ExternalLink className="w-4 h-4 text-neon-blue" />
              </Link>
            </Button>
            <Button
              onClick={() => openIssueModal("PROGRAM")}
              className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white font-medium shadow-lg shadow-neon-blue/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Total Issued
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
                <Award className="w-5 h-5 text-neon-blue" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Programs
                </p>
                <p className="text-2xl font-bold text-neon-purple mt-1">
                  {stats.programCertificates}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
                <GraduationCap className="w-5 h-5 text-neon-purple" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Courses
                </p>
                <p className="text-2xl font-bold text-neon-blue mt-1">
                  {stats.courseCertificates}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Volunteers
                </p>
                <p className="text-2xl font-bold text-pink-400 mt-1">
                  {stats.volunteerCertificates}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  This Month
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {stats.issuedThisMonth}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 hover-glow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Revoked
                </p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {stats.revoked}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Issuance from Recent Completed Program Enrollments */}
        {lookupData.recentEnrollments.length > 0 && (
          <Card className="glass-card border-neon-purple/30 bg-neon-purple/5 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-white font-semibold">
                    Fast Action: Recent Completed / Paid Program Enrollments
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-neon-purple/40 text-neon-purple text-xs">
                  1-Click Pre-fill
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lookupData.recentEnrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-neon-purple/40 transition-all flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {enrollment.fullName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {enrollment.programName} · {enrollment.cohortName}
                      </p>
                      <Badge className="mt-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                        {enrollment.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickIssueFromEnrollment(enrollment)}
                      className="bg-neon-purple hover:bg-neon-purple/80 text-white text-xs shrink-0">
                      Issue Cert
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by student, ID (e.g. PTQ-...), course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-card border-white/20 pl-10 text-white placeholder:text-gray-500 h-10 w-full"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full md:w-auto">
            <TabsList className="glass-card border-white/10 p-1 flex overflow-x-auto">
              <TabsTrigger
                value="ALL"
                className="data-[state=active]:bg-neon-blue/20 text-xs sm:text-sm">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger
                value="PROGRAM"
                className="data-[state=active]:bg-neon-purple/20 text-xs sm:text-sm">
                Programs ({stats.programCertificates})
              </TabsTrigger>
              <TabsTrigger
                value="COURSE"
                className="data-[state=active]:bg-cyan-500/20 text-xs sm:text-sm">
                Courses ({stats.courseCertificates})
              </TabsTrigger>
              <TabsTrigger
                value="VOLUNTEER"
                className="data-[state=active]:bg-pink-500/20 text-xs sm:text-sm">
                Volunteers ({stats.volunteerCertificates})
              </TabsTrigger>
              <TabsTrigger
                value="REVOKED"
                className="data-[state=active]:bg-red-500/20 text-xs sm:text-sm text-red-300">
                Revoked ({stats.revoked})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Certificates Table */}
        <Card className="glass-card border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-semibold">
                      Credential ID
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Student / Recipient
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Program / Course / Event
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Certificate File
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Issued Date
                    </TableHead>
                    <TableHead className="text-gray-400 font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-gray-400">
                        <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-500" />
                        <p className="text-base font-medium text-white">
                          No certificates found
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Try adjusting your search query or tab filter, or
                          issue a new certificate.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCertificates.map((cert) => {
                      const isCopied = copiedId === cert.credentialId;
                      const hasUrl = Boolean(
                        cert.certificateUrl && cert.certificateUrl.trim(),
                      );

                      return (
                        <TableRow
                          key={`${cert.isVolunteer ? "vol-" : "reg-"}${cert.id}`}
                          className="border-white/10 hover:bg-white/[0.03] transition-colors">
                          {/* Credential ID */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <code className="font-mono text-xs font-semibold px-2 py-1 rounded bg-black/40 border border-white/10 text-neon-blue">
                                {cert.credentialId}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-white"
                                onClick={() =>
                                  handleCopy(
                                    cert.credentialId,
                                    cert.credentialId,
                                    "Credential ID",
                                  )
                                }
                                title="Copy Credential ID">
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>

                          {/* Student */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarImage src={cert.userImage || ""} />
                                <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">
                                  {cert.studentName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white leading-tight">
                                  {cert.studentName}
                                </p>
                                {cert.userEmail && (
                                  <p className="text-xs text-gray-400 leading-tight mt-0.5">
                                    {cert.userEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Program / Course Title */}
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-white truncate">
                                {cert.programName ||
                                  cert.courseName ||
                                  cert.title}
                              </p>
                              {cert.cohortName && (
                                <p className="text-xs text-neon-purple truncate">
                                  {cert.cohortName}
                                </p>
                              )}
                              {cert.grade && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-[10px] border-emerald-500/40 text-emerald-400 py-0">
                                  Grade: {cert.grade}
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Category Badge */}
                          <TableCell>
                            {cert.category === "PROGRAM" ? (
                              <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/40 text-xs">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Program
                              </Badge>
                            ) : cert.category === "COURSE" ? (
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                                <BookOpen className="w-3 h-3 mr-1" />
                                Course
                              </Badge>
                            ) : cert.category === "VOLUNTEER" ? (
                              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">
                                <Heart className="w-3 h-3 mr-1" />
                                Volunteer
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-white/20 text-gray-300 text-xs">
                                General
                              </Badge>
                            )}
                          </TableCell>

                          {/* Certificate URL Link */}
                          <TableCell>
                            {hasUrl ? (
                              <a
                                href={cert.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-colors"
                                title="Open Certificate Document (Mega / PDF)">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Attached</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(cert)}
                                className="h-7 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs border border-amber-500/30">
                                <Plus className="w-3 h-3 mr-1" />
                                Attach Mega Link
                              </Button>
                            )}
                          </TableCell>

                          {/* Issued Date */}
                          <TableCell className="text-xs text-gray-400">
                            {new Date(cert.issuedDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {cert.isRevoked ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Revoked
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Valid
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neon-purple hover:text-neon-purple hover:bg-neon-purple/10"
                                onClick={() => openQrModal(cert)}
                                title="Get Certificate QR Code">
                                <QrCode className="w-4 h-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="glass-card border-white/10 w-52">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/verify-certificate?code=${encodeURIComponent(cert.credentialId)}`}
                                      target="_blank"
                                      className="cursor-pointer">
                                      <Eye className="w-4 h-4 mr-2 text-neon-blue" />
                                      View Verification
                                    </Link>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => openQrModal(cert)}>
                                    <QrCode className="w-4 h-4 mr-2 text-neon-purple" />
                                    Get QR Code (PNG)
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => {
                                      const url = `${window.location.origin}/verify-certificate?code=${encodeURIComponent(
                                        cert.credentialId,
                                      )}`;
                                      handleCopy(
                                        url,
                                        cert.id,
                                        "Verification Link",
                                      );
                                    }}>
                                    <Share2 className="w-4 h-4 mr-2 text-neon-purple" />
                                    Copy Verification URL
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => openEditModal(cert)}>
                                    <Edit2 className="w-4 h-4 mr-2 text-cyan-400" />
                                    Edit & Attach URL
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="bg-white/10" />

                                  <DropdownMenuItem
                                    onClick={() => openRevokeModal(cert)}
                                    className={
                                      cert.isRevoked
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                    }>
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    {cert.isRevoked
                                      ? "Reinstate Certificate"
                                      : "Revoke Certificate"}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => openDeleteModal(cert)}
                                    className="text-red-400 focus:text-red-400">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Certificate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 1. ISSUE CERTIFICATE MODAL */}
      {/* ============================================================ */}
      <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-neon-blue" />
              Issue New Certificate
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate a unique credential ID and issue an authentic certificate
              to a student or volunteer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueSubmit} className="space-y-5 py-2">
            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Certificate Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "PROGRAM", label: "Program", icon: GraduationCap },
                  { id: "COURSE", label: "Course", icon: BookOpen },
                  { id: "CUSTOM", label: "General", icon: Award },
                  { id: "VOLUNTEER", label: "Volunteer", icon: Heart },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = issueMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setIssueMode(mode.id as any);
                        handleGenerateId(mode.id as any);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-medium ${
                        isSelected
                          ? "bg-neon-blue/20 border-neon-blue text-white shadow-md shadow-neon-blue/20"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}>
                      <Icon
                        className={`w-4 h-4 ${isSelected ? "text-neon-blue" : "text-gray-400"}`}
                      />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Student Picker (for non-volunteer) */}
            {issueMode !== "VOLUNTEER" && (
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center justify-between">
                  <span>Select Registered Student</span>
                  <span className="text-[11px] text-neon-blue">
                    Links to student profile
                  </span>
                </label>

                {/* Filter / Search input */}
                <Input
                  placeholder="Filter students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="glass-card border-white/20 text-xs h-9"
                />

                <Select
                  value={selectedStudentId}
                  onValueChange={handleStudentChange}>
                  <SelectTrigger className="glass-card border-white/20 text-white">
                    <SelectValue placeholder="Choose a student account" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/20 max-h-64 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((std) => (
                        <SelectItem key={std.id} value={std.id}>
                          <span className="font-medium text-white">
                            {std.name}
                          </span>{" "}
                          <span className="text-gray-400 text-xs">
                            ({std.email})
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No students found matching "{studentSearch}"
                      </div>
                    )}
                  </SelectContent>
                </Select>

                <div>
                  <label className="text-xs text-gray-400">
                    Student Name on Certificate
                  </label>
                  <Input
                    placeholder="Full name as printed on certificate"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    className="glass-card border-white/20 mt-1"
                    required
                  />
                </div>
              </div>
            )}

            {/* Volunteer Recipient (for volunteer mode) */}
            {issueMode === "VOLUNTEER" && (
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold">
                  Volunteer Details
                </label>
                <div>
                  <label className="text-xs text-gray-400">
                    Volunteer Full Name
                  </label>
                  <Input
                    placeholder="e.g. Jane Doe"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    className="glass-card border-white/20 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">
                    Volunteer Role / Designation (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Lead Technical Instructor / Event Coordinator"
                    value={volunteerRole}
                    onChange={(e) => setVolunteerRole(e.target.value)}
                    className="glass-card border-white/20 mt-1"
                  />
                </div>
              </div>
            )}

            {/* Program & Cohort Selection */}
            {issueMode === "PROGRAM" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Professional Program
                  </label>
                  <Select
                    value={selectedProgramId}
                    onValueChange={handleProgramChange}>
                    <SelectTrigger className="glass-card border-white/20 mt-1">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/20">
                      {lookupData.programs.map((prog) => (
                        <SelectItem key={prog.id} value={prog.id}>
                          {prog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Cohort
                  </label>
                  <Select
                    value={selectedCohortId}
                    onValueChange={setSelectedCohortId}>
                    <SelectTrigger className="glass-card border-white/20 mt-1">
                      <SelectValue placeholder="Select Cohort" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/20">
                      {lookupData.programs
                        .find((p) => p.id === selectedProgramId)
                        ?.cohorts.map((cohort) => (
                          <SelectItem key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </SelectItem>
                        )) || (
                        <SelectItem value="none">
                          No cohorts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Course Selection */}
            {issueMode === "COURSE" && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Course
                </label>
                <Select
                  value={selectedCourseId}
                  onValueChange={handleCourseChange}>
                  <SelectTrigger className="glass-card border-white/20 mt-1">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/20">
                    {lookupData.courses.map((crs) => (
                      <SelectItem key={crs.id} value={crs.id}>
                        {crs.title} (by {crs.instructor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Certificate Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {issueMode === "VOLUNTEER"
                    ? "Event / Project Name"
                    : "Certificate Title"}
                </label>
                <Input
                  placeholder={
                    issueMode === "VOLUNTEER"
                      ? "e.g. PalmTechnIQ Tech Summit 2026"
                      : "e.g. Professional Certificate in Full Stack Engineering"
                  }
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="glass-card border-white/20 mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Description / Commendation Note
                </label>
                <Input
                  placeholder="e.g. Awarded for successful completion and mastery of core competencies."
                  value={certDescription}
                  onChange={(e) => setCertDescription(e.target.value)}
                  className="glass-card border-white/20 mt-1"
                />
              </div>
            </div>

            {/* Credential ID Generator Field */}
            <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-neon-blue font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Credential ID (Unique Verification Code)
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateId(issueMode)}
                  disabled={isGeneratingId}
                  className="border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 h-7 text-xs">
                  {isGeneratingId ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <Input
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value.toUpperCase())}
                placeholder="e.g. PTQ-PRG-2026-9F3K8A"
                className="font-mono text-sm uppercase bg-black/40 border-neon-blue/30 text-neon-blue"
                required
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-gray-400">
                  This ID can be printed on your certificate graphic.
                </p>
                {credentialId.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openQrModal({
                        credentialId,
                        studentName: customStudentName,
                        title: certTitle,
                      })
                    }
                    className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 text-xs h-7 shrink-0">
                    <QrCode className="w-3.5 h-3.5 mr-1.5" />
                    Download QR Code
                  </Button>
                )}
              </div>
            </div>

            {/* Certificate Document URL (Mega Link / Cloud Storage) */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-300 font-semibold flex items-center justify-between">
                <span>Certificate File / Document URL (Optional)</span>
                <span className="text-[11px] text-gray-400">
                  Mega.nz, Google Drive, or Cloud PDF
                </span>
              </label>
              <Input
                placeholder="e.g. https://mega.nz/file/ABC123#XYZ789 or hosted PDF URL"
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
                className="glass-card border-white/20"
              />
              <p className="text-[11px] text-gray-400">
                You can attach the Mega link now, or leave it blank and attach
                it anytime later after uploading your design.
              </p>
            </div>

            {/* Grade & Score (for non-volunteer) */}
            {issueMode !== "VOLUNTEER" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Grade (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Distinction / A+"
                    value={certGrade}
                    onChange={(e) => setCertGrade(e.target.value)}
                    className="glass-card border-white/20 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    Numeric Score % (Optional)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 95"
                    value={certScore}
                    onChange={(e) => setCertScore(e.target.value)}
                    className="glass-card border-white/20 mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIssueOpen(false)}
                className="border-white/10 bg-transparent text-gray-300">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white font-medium">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    Confirm & Issue Certificate
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 2. EDIT & ATTACH URL MODAL */}
      {/* ============================================================ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass-card border-white/10 max-w-lg text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-neon-blue" />
              Edit Certificate & Attach File URL
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update certificate details or attach the Mega/cloud file link for
              credential:{" "}
              <code className="text-neon-blue font-mono">
                {editingCert?.credentialId}
              </code>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Certificate File / Mega Link URL
              </label>
              <Input
                placeholder="https://mega.nz/file/... or Google Drive / Cloud PDF URL"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="glass-card border-white/20 mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Paste your Mega link or direct download URL here.
              </p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Student / Recipient Name
              </label>
              <Input
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                className="glass-card border-white/20 mt-1"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Certificate Title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="glass-card border-white/20 mt-1"
                required
              />
            </div>

            {!editingCert?.isVolunteer && (
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Grade / Distinction (Optional)
                </label>
                <Input
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="glass-card border-white/20 mt-1"
                />
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Description / Notes (Optional)
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="glass-card border-white/20 mt-1"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-white/10 bg-transparent text-gray-300">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingEdit}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white">
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 3. REVOKE / REINSTATE MODAL */}
      {/* ============================================================ */}
      <Dialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              {revokingCert?.isRevoked
                ? "Reinstate Certificate"
                : "Revoke Certificate"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {revokingCert?.isRevoked
                ? `Are you sure you want to restore validity for certificate ${revokingCert?.credentialId}?`
                : `Revoking will immediately mark certificate ${revokingCert?.credentialId} as INVALID on the public verification portal.`}
            </DialogDescription>
          </DialogHeader>

          {!revokingCert?.isRevoked && (
            <div className="py-2">
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Reason for Revocation (Optional)
              </label>
              <Input
                placeholder="e.g. Incomplete requirements, issued in error, administrative audit"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="glass-card border-white/20 mt-1"
              />
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRevokeOpen(false)}
              className="border-white/10 bg-transparent text-gray-300">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRevokeConfirm}
              disabled={isSavingRevoke}
              className={
                revokingCert?.isRevoked
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }>
              {isSavingRevoke
                ? "Processing..."
                : revokingCert?.isRevoked
                  ? "Confirm Reinstate"
                  : "Confirm Revocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Certificate Record
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to permanently delete certificate{" "}
              <code className="text-red-400 font-mono">
                {deletingCert?.credentialId}
              </code>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-white/10 bg-transparent text-gray-300">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white">
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 5. QR CODE PREVIEW & DOWNLOAD MODAL */}
      {/* ============================================================ */}
      <CertificateQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        credentialId={qrCertData.credentialId}
        studentName={qrCertData.studentName}
        certificateTitle={qrCertData.certificateTitle}
      />
    </div>
  );
}
