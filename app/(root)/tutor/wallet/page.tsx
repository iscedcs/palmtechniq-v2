"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { UserRole } from "@/types/user";
import { generateRandomAvatar } from "@/lib/utils";
import { toast } from "sonner";

const earningsData = [
  { month: "Jan", courses: 2400, mentorship: 1200, projects: 800 },
  { month: "Feb", courses: 3200, mentorship: 1800, projects: 1200 },
  { month: "Mar", courses: 2800, mentorship: 2200, projects: 1600 },
  { month: "Apr", courses: 4200, mentorship: 2800, projects: 2000 },
  { month: "May", courses: 3800, mentorship: 3200, projects: 2400 },
  { month: "Jun", courses: 5200, mentorship: 3800, projects: 2800 },
];

const revenueBreakdown = [
  { name: "Courses", value: 18600, color: "#3b82f6" },
  { name: "Mentorship", value: 15000, color: "#8b5cf6" },
  { name: "Projects", value: 11800, color: "#06d6a0" },
];

const transactions = [
  {
    id: 1,
    type: "earning",
    description: "Course: Advanced React Patterns",
    amount: 299,
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: 2,
    type: "earning",
    description: "Mentorship Session: John Smith",
    amount: 129,
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: 3,
    type: "withdrawal",
    description: "Bank Transfer",
    amount: -1500,
    date: "2024-01-12",
    status: "completed",
  },
  {
    id: 4,
    type: "earning",
    description: "Project Review: E-commerce App",
    amount: 89,
    date: "2024-01-10",
    status: "completed",
  },
  {
    id: 5,
    type: "earning",
    description: "Course: JavaScript Fundamentals",
    amount: 199,
    date: "2024-01-08",
    status: "pending",
  },
];

export default function TutorWalletPage() {
  const [userRole] = useState<UserRole>("TUTOR");
  const [userName] = useState("Sarah Chen");
  const [userAvatar] = useState(generateRandomAvatar());
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [summary, setSummary] = useState({
    availableBalance: 0,
    pendingPayouts: 0,
    totalEarnings: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/wallet/summary");
        const json = await res.json();
        if (mounted && json.ok) {
          setSummary(json.summary);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalBalance = summary.availableBalance;
  const pendingPayouts = summary.pendingPayouts;
  const totalEarnings = summary.totalEarnings;
  const monthlyGrowth = 23.5;

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <motion.div whileHover={{ scale: 1.05, rotateY: 5 }} className="group">
      <Card className="glass-card hover-glow border-white/10 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold text-white mt-2">{value}</p>
              {change && (
                <div
                  className={`flex items-center mt-2 text-sm ₦{
                    change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {change > 0 ? "+" : ""}
                  {change}% from last month
                </div>
              )}
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ₦{color} p-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-full h-full text-white" />
            </div>
          </div>
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ₦{color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-12 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <motion.div
            className="absolute top-20 right-20 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Wallet & <span className="text-gradient">Earnings</span>
                </h1>
                <p className="text-xl text-gray-300">
                  Track your earnings and manage withdrawals
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                  <Banknote className="w-4 h-4" />
                  Withdraw Funds
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Wallet}
                title="Available Balance"
                  value={
                    loadingSummary
                      ? "Loading..."
                      : `₦₦{totalBalance.toLocaleString()}`
                  }
                change={monthlyGrowth}
                color="from-neon-green to-emerald-400"
              />
              <StatCard
                icon={PiggyBank}
                title="Total Earnings"
                  value={
                    loadingSummary
                      ? "Loading..."
                      : `₦₦{totalEarnings.toLocaleString()}`
                  }
                change={null}
                color="from-neon-blue to-cyan-400"
              />
              <StatCard
                icon={Clock}
                  title="Pending Payouts"
                  value={
                    loadingSummary
                      ? "Loading..."
                      : `₦₦{pendingPayouts.toLocaleString()}`
                  }
                change={null}
                color="from-neon-purple to-pink-400"
              />
              <StatCard
                icon={Calendar}
                title="This Month"
                value="₦3,240"
                change={15}
                color="from-neon-orange to-yellow-400"
              />
            </motion.div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 bg-white/5 backdrop-blur-sm border border-white/10">
                <TabsTrigger
                  value="overview"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <DollarSign className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Receipt className="w-4 h-4" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="withdraw"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <Banknote className="w-4 h-4" />
                  Withdraw
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="tax"
                  className="gap-2 text-white data-[state=active]:bg-white/10">
                  <FileText className="w-4 h-4" />
                  Tax Reports
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Earnings Chart */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Earnings Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={earningsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="courses"
                            stroke="#3b82f6"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="mentorship"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="projects"
                            stroke="#06d6a0"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Revenue Breakdown */}
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Revenue Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={revenueBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value">
                              {revenueBreakdown.map((entry, index) => (
                                <Cell
                                  key={`cell-₦{index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {revenueBreakdown.map((item) => (
                          <div key={item.name} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm font-medium text-white">
                                {item.name}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-white">
                              ₦{item.value.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">
                          Transaction History
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                            <Filter className="w-4 h-4" />
                            Filter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                            <Download className="w-4 h-4" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-2 rounded-full ₦{
                                  transaction.type === "earning"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}>
                                {transaction.type === "earning" ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownLeft className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {transaction.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-lg font-bold ₦{
                                  transaction.amount > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}>
                                {transaction.amount > 0 ? "+" : ""}₦
                                {Math.abs(transaction.amount)}
                              </span>
                              <Badge
                                className={
                                  transaction.status === "completed"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                }>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Banknote className="w-5 h-5" />
                        Withdraw Funds
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="font-medium text-green-400">
                            Available Balance
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                          ₦{totalBalance.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-white">
                          Withdrawal Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWithdrawalAmount("1000")}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                            ₦1,000
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWithdrawalAmount("5000")}
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                            ₦5,000
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setWithdrawalAmount(totalBalance.toString())
                            }
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                            All
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Withdrawal Method</Label>
                        <Select defaultValue="bank">
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                            <SelectItem
                              value="bank"
                              className="text-white hover:bg-white/10">
                              Bank Transfer (2-3 days)
                            </SelectItem>
                            <SelectItem
                              value="paypal"
                              className="text-white hover:bg-white/10">
                              PayPal (Instant)
                            </SelectItem>
                            <SelectItem
                              value="stripe"
                              className="text-white hover:bg-white/10">
                              Stripe (1-2 days)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-neon-green to-emerald-400 text-white"
                        onClick={async () => {
                          const amount = Number(withdrawalAmount);
                          if (!amount || amount <= 0) {
                            toast.error("Enter a valid withdrawal amount");
                            return;
                          }
                          const res = await fetch("/api/wallet/withdraw", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ amount }),
                          });
                          const json = await res.json();
                          if (!res.ok || !json.ok) {
                            toast.error(json.reason || "Withdrawal failed");
                            return;
                          }
                          toast.success("Withdrawal request submitted");
                          setWithdrawalAmount("");
                          const summaryRes = await fetch("/api/wallet/summary");
                          const summaryJson = await summaryRes.json();
                          if (summaryJson.ok) {
                            setSummary(summaryJson.summary);
                          }
                        }}>
                        Withdraw ₦{withdrawalAmount || "0.00"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <CreditCard className="w-5 h-5" />
                        Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                BANK
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                Chase Bank ****1234
                              </p>
                              <p className="text-sm text-gray-400">
                                Primary account
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Default
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                PP
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">PayPal</p>
                              <p className="text-sm text-gray-400">
                                sarah.chen@example.com
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/10">
                            Edit
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <CreditCard className="w-4 h-4" />
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Earnings Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={earningsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar
                            dataKey="courses"
                            fill="#3b82f6"
                            name="Courses"
                          />
                          <Bar
                            dataKey="mentorship"
                            fill="#8b5cf6"
                            name="Mentorship"
                          />
                          <Bar
                            dataKey="projects"
                            fill="#06d6a0"
                            name="Projects"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Tax Reports Tab */}
              <TabsContent value="tax" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <FileText className="w-5 h-5" />
                        Tax Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="font-semibold text-white">
                            2024 Tax Summary
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            Annual earnings report
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                            <Download className="w-4 h-4" />
                            Download PDF
                          </Button>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="font-semibold text-white">
                            1099-NEC Form
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            Non-employee compensation
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent">
                            <Download className="w-4 h-4" />
                            Download PDF
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div className="text-sm text-yellow-400">
                            <p className="font-medium">Tax Information</p>
                            <p>
                              Please consult with a tax professional for advice
                              specific to your situation. These documents are
                              provided for your convenience.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
