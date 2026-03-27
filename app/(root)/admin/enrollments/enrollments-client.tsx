"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { NairaSign } from "@/components/shared/naira-sign-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type Installment = {
  id: string;
  installmentNo: number;
  amount: number;
  dueDate: string | null;
  status: string;
  paidAt: string | null;
};

type Enrollment = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  programName: string;
  cohortName: string;
  learningMode: string;
  paymentPlan: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  hasAccount: boolean;
  userId: string | null;
  userName: string | null;
  installments: Installment[];
  createdAt: string;
};

type Stats = {
  totalEnrollments: number;
  totalRevenue: number;
  totalExpected: number;
  pendingBalance: number;
  PENDING_PAYMENT: number;
  FIRST_INSTALLMENT_PAID: number;
  FULLY_PAID: number;
  CANCELLED: number;
  REFUNDED: number;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  FIRST_INSTALLMENT_PAID: {
    label: "1st Installment Paid",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  FULLY_PAID: {
    label: "Fully Paid",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
  },
};

export default function AdminEnrollmentsClient({
  enrollments,
  stats,
}: {
  enrollments: Enrollment[];
  stats: Stats;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const matchesSearch =
        !search ||
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.programName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, search, statusFilter]);

  const needsFollowUp = enrollments.filter(
    (e) =>
      e.status === "FIRST_INSTALLMENT_PAID" || e.status === "PENDING_PAYMENT",
  );

  const statCards = [
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments.toString(),
      icon: GraduationCap,
      color: "text-neon-blue",
      bgColor: "bg-neon-blue/10",
    },
    {
      title: "Revenue Collected",
      value: formatNaira(stats.totalRevenue),
      icon: NairaSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pending Balance",
      value: formatNaira(stats.pendingBalance),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Needs Follow-Up",
      value: needsFollowUp.length.toString(),
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white">
              <Link href="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Program Enrollments
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Track and manage professional program enrollments &amp; payments
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <Card className="glass-card border-white/10 hover-glow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Status breakdown badges */}
        <motion.div
          className="flex flex-wrap gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}>
          <Badge
            variant="outline"
            className="bg-green-500/10 border-green-500/30 text-green-400 px-3 py-1">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {stats.FULLY_PAID} Fully Paid
          </Badge>
          <Badge
            variant="outline"
            className="bg-blue-500/10 border-blue-500/30 text-blue-400 px-3 py-1">
            <CreditCard className="w-3 h-3 mr-1" />
            {stats.FIRST_INSTALLMENT_PAID} 1st Installment
          </Badge>
          <Badge
            variant="outline"
            className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" />
            {stats.PENDING_PAYMENT} Pending
          </Badge>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-card border-white/20 pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="glass-card border-white/20 w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
              <SelectItem value="FIRST_INSTALLMENT_PAID">
                1st Installment Paid
              </SelectItem>
              <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Enrollments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Enrollments ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-400">Student</TableHead>
                      <TableHead className="text-gray-400">Program</TableHead>
                      <TableHead className="text-gray-400">Cohort</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-right">
                        Paid
                      </TableHead>
                      <TableHead className="text-gray-400 text-right">
                        Balance
                      </TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={8}
                          className="text-center text-gray-500 py-12">
                          No enrollments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((enrollment) => {
                        const cfg =
                          STATUS_CONFIG[enrollment.status] ??
                          STATUS_CONFIG.PENDING_PAYMENT;
                        const isExpanded = expandedRow === enrollment.id;

                        return (
                          <>
                            <TableRow
                              key={enrollment.id}
                              className="border-white/10 hover:bg-white/5 cursor-pointer"
                              onClick={() =>
                                setExpandedRow(
                                  isExpanded ? null : enrollment.id,
                                )
                              }>
                              <TableCell>
                                <div>
                                  <p className="text-white font-medium text-sm">
                                    {enrollment.fullName}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {enrollment.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm">
                                {enrollment.programName}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm">
                                {enrollment.cohortName}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${cfg.bg} ${cfg.color} text-xs`}>
                                  {cfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-green-400 text-sm font-medium">
                                {formatNaira(enrollment.amountPaid)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {enrollment.balance > 0 ? (
                                  <span className="text-amber-400">
                                    {formatNaira(enrollment.balance)}
                                  </span>
                                ) : (
                                  <span className="text-green-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-500 text-xs">
                                {new Date(
                                  enrollment.createdAt,
                                ).toLocaleDateString("en-NG", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </TableCell>
                            </TableRow>

                            {/* Expanded Detail Row */}
                            {isExpanded && (
                              <TableRow
                                key={`${enrollment.id}-detail`}
                                className="border-white/10 bg-white/[0.02]">
                                <TableCell colSpan={8} className="p-0">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-6 py-5 space-y-4">
                                    {/* Contact & Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">
                                          {enrollment.phone}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <a
                                          href={`mailto:${enrollment.email}`}
                                          className="text-neon-blue hover:underline"
                                          onClick={(e) => e.stopPropagation()}>
                                          {enrollment.email}
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">
                                          {enrollment.learningMode === "VIRTUAL"
                                            ? "Virtual"
                                            : "Physical"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300">
                                          {enrollment.paymentPlan ===
                                          "INSTALLMENT"
                                            ? "Installment (70/30)"
                                            : "Full Payment"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Account status */}
                                    <div className="text-sm">
                                      {enrollment.hasAccount ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-500/10 border-green-500/30 text-green-400">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Account linked
                                          {enrollment.userName
                                            ? ` — ${enrollment.userName}`
                                            : ""}
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          No account yet
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Installments */}
                                    {enrollment.installments.length > 0 && (
                                      <div>
                                        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                                          Payment Schedule
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {enrollment.installments.map(
                                            (inst) => (
                                              <div
                                                key={inst.id}
                                                className={`rounded-lg border p-3 ${
                                                  inst.status === "PAID"
                                                    ? "border-green-500/20 bg-green-500/5"
                                                    : "border-white/10 bg-white/[0.02]"
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-gray-300 text-sm font-medium">
                                                    Installment{" "}
                                                    {inst.installmentNo}
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className={
                                                      inst.status === "PAID"
                                                        ? "bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                                                        : "bg-gray-500/10 border-gray-500/30 text-gray-400 text-xs"
                                                    }>
                                                    {inst.status === "PAID"
                                                      ? "Paid"
                                                      : "Pending"}
                                                  </Badge>
                                                </div>
                                                <p className="text-white font-semibold mt-1">
                                                  {formatNaira(inst.amount)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                  <CalendarDays className="w-3 h-3 text-gray-500" />
                                                  <span className="text-gray-500 text-xs">
                                                    {inst.paidAt
                                                      ? `Paid ${new Date(inst.paidAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
                                                      : inst.dueDate
                                                        ? `Due ${new Date(inst.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
                                                        : "No due date set"}
                                                  </span>
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Follow-up Section */}
        {needsFollowUp.length > 0 && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}>
            <Card className="glass-card border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400 text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Students Needing Follow-Up ({needsFollowUp.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {needsFollowUp.map((e) => {
                    const cfg =
                      STATUS_CONFIG[e.status] ?? STATUS_CONFIG.PENDING_PAYMENT;
                    return (
                      <div
                        key={e.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {e.fullName}
                          </p>
                          <p className="text-gray-500 text-xs">{e.email}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {e.programName} · {e.cohortName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={`${cfg.bg} ${cfg.color} text-xs`}>
                            {cfg.label}
                          </Badge>
                          <div className="text-right">
                            <p className="text-amber-400 font-semibold text-sm">
                              {formatNaira(e.balance)}
                            </p>
                            <p className="text-gray-500 text-xs">outstanding</p>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 text-xs">
                            <a
                              href={`mailto:${e.email}?subject=PalmTechnIQ Enrollment — ${e.programName}&body=Hi ${e.fullName},%0D%0A%0D%0AThis is a follow-up regarding your enrollment in ${e.programName} (${e.cohortName}).%0D%0A%0D%0AYou have an outstanding balance of ${formatNaira(e.balance)}.%0D%0A%0D%0ABest regards,%0D%0APalmTechnIQ Team`}>
                              <Mail className="w-3 h-3 mr-1" />
                              Follow Up
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
