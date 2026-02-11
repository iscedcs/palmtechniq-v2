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
import { NairaSign } from "@/components/shared/naira-sign-icon";
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
import { toast } from "sonner";
import {
  deactivatePaymentMethod,
  getWalletDashboardData,
  getPaystackBanks,
  requestWithdrawal,
  saveBankPaymentMethod,
  setDefaultPaymentMethod,
  verifyBankAccount,
} from "@/actions/withdrawal";

type WalletSummary = {
  availableBalance: number;
  pendingPayouts: number;
  totalEarnings: number;
};

type WalletChartPoint = {
  month: string;
  courses: number;
  mentorship: number;
  projects: number;
};

type RevenueBreakdownItem = {
  name: string;
  value: number;
  color: string;
};

type WalletTransaction = {
  id: string;
  type: "earning" | "withdrawal";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
};

type PaymentMethodItem = {
  id: string;
  type: "BANK" | "WALLET" | "PAYPAL" | "STRIPE" | "PAYSTACK";
  details: Record<string, any> | null;
  isDefault: boolean;
};

type BankOption = {
  code: string;
  name: string;
};

export default function WalletClient({
  initialSummary,
  initialUser,
  initialTransactions,
  initialEarningsData,
  initialRevenueBreakdown,
  initialPaymentMethods,
}: {
  initialSummary: WalletSummary;
  initialUser: {
    name: string;
    avatar: string | null;
    role: UserRole;
    recipientCode: string | null;
    bankName: string | null;
    accountNumber: string | null;
  };
  initialTransactions: WalletTransaction[];
  initialEarningsData: WalletChartPoint[];
  initialRevenueBreakdown: RevenueBreakdownItem[];
  initialPaymentMethods: PaymentMethodItem[];
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [summary, setSummary] = useState<WalletSummary>(initialSummary);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(initialTransactions);
  const [earningsData, setEarningsData] =
    useState<WalletChartPoint[]>(initialEarningsData);
  const [revenueBreakdown, setRevenueBreakdown] = useState<
    RevenueBreakdownItem[]
  >(initialRevenueBreakdown);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(
    initialPaymentMethods,
  );
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankCode, setBankCode] = useState<string>("");
  const [bankName, setBankName] = useState(initialUser.bankName || "");
  const [accountNumber, setAccountNumber] = useState(
    initialUser.accountNumber || "",
  );
  const [accountName, setAccountName] = useState("");
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [recipientCode, setRecipientCode] = useState(
    initialUser.recipientCode || "",
  );
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadBanks = async () => {
    const res = await getPaystackBanks();
    if ("banks" in res) {
      setBanks(res.banks ?? []);
    }
  };

  const inferBankFromPaymentMethods = () => {
    const defaultBank = paymentMethods.find(
      (method) => method.type === "BANK" && method.isDefault,
    );
    if (defaultBank?.details?.bankCode) {
      setBankCode(String(defaultBank.details.bankCode));
      setAccountName(defaultBank.details.accountName || "");
    }
  };

  const handleVerifyAccount = async () => {
    if (!bankCode || !accountNumber) {
      toast.error("Select a bank and enter account number");
      return;
    }
    setVerifyingAccount(true);
    try {
      const res = await verifyBankAccount({ bankCode, accountNumber });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setAccountName(res.accountName);
      setBankName(res.bankName);
      setIsAccountVerified(true);
      toast.success("Account verified");
    } finally {
      setVerifyingAccount(false);
    }
  };

  const normalizeName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const isNameMismatch = () => {
    if (!accountName) return false;
    const profile = normalizeName(initialUser.name || "");
    const resolved = normalizeName(accountName);
    if (!profile || !resolved) return false;
    return !resolved.includes(profile) && !profile.includes(resolved);
  };

  const totalBalance = summary.availableBalance;
  const pendingPayouts = summary.pendingPayouts;
  const totalEarnings = summary.totalEarnings;
  const monthlyGrowth = 23.5;

  const refreshSummary = async () => {
    setLoadingSummary(true);
    try {
      const refreshed = await getWalletDashboardData();
      if ("summary" in refreshed && refreshed.summary) {
        setSummary(refreshed.summary);
        setTransactions(refreshed.transactions ?? []);
        setEarningsData(refreshed.earningsData ?? []);
        setRevenueBreakdown(refreshed.revenueBreakdown ?? []);
        setPaymentMethods(
          (refreshed.paymentMethods ?? []).map((method) => ({
            ...method,
            details:
              method.details && typeof method.details === "object"
                ? method.details
                : null,
          }))
        );
        if (refreshed.user) {
          setBankName(refreshed.user.bankName || "");
          setAccountNumber(refreshed.user.accountNumber || "");
          setRecipientCode(refreshed.user.recipientCode || "");
        }
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    inferBankFromPaymentMethods();
  }, [paymentMethods]);

  useEffect(() => {
    setIsAccountVerified(false);
    setAccountName("");
  }, [bankCode]);

  const formatPaymentMethodLabel = (method: PaymentMethodItem) => {
    if (method.type === "BANK") {
      const bankName = method.details?.bankName || "Bank";
      const accountNumber = method.details?.accountNumber
        ? `****${String(method.details.accountNumber).slice(-4)}`
        : "Account";
      const accountName = method.details?.accountName
        ? ` - ${method.details.accountName}`
        : "";
      return `${bankName} ${accountNumber}${accountName}`;
    }
    if (method.type === "PAYPAL") return "PayPal";
    if (method.type === "STRIPE") return "Stripe";
    if (method.type === "PAYSTACK") return "Paystack";
    return "Wallet";
  };

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
      <Navigation />
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
                    : `₦${totalBalance.toLocaleString()}`
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
                    : `₦${totalEarnings.toLocaleString()}`
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
                    : `₦${pendingPayouts.toLocaleString()}`
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
                  <NairaSign className="w-4 h-4" />
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
                        {transactions.length === 0 ? (
                          <div className="text-sm text-gray-400">
                            No transactions yet.
                          </div>
                        ) : (
                          transactions.map((transaction) => (
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
                                      : transaction.status === "failed"
                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  }>
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
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
                        {paymentMethods.length === 0 ? (
                          <p className="text-xs text-gray-400">
                            Add a payout method to request withdrawals.
                          </p>
                        ) : (
                          <Select defaultValue={paymentMethods[0]?.id}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                              {paymentMethods.map((method) => (
                                <SelectItem
                                  key={method.id}
                                  value={method.id}
                                  className="text-white hover:bg-white/10">
                                  {formatPaymentMethodLabel(method)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-neon-green to-emerald-400 text-white"
                        disabled={paymentMethods.length === 0 || !recipientCode}
                        onClick={async () => {
                          const amount = Number(withdrawalAmount);
                          if (!amount || amount <= 0) {
                            toast.error("Enter a valid withdrawal amount");
                            return;
                          }
                          const result = await requestWithdrawal(amount);
                          if ("error" in result) {
                            toast.error(result.error || "Withdrawal failed");
                            return;
                          }
                          toast.success("Withdrawal request submitted");
                          setWithdrawalAmount("");
                          await refreshSummary();
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
                        {paymentMethods.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No payment methods found.
                          </p>
                        ) : (
                          paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {method.type}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    {formatPaymentMethodLabel(method)}
                                  </p>
                                  {method.isDefault ? (
                                    <p className="text-sm text-gray-400">
                                      Primary account
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {method.isDefault ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Default
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white hover:bg-white/10"
                                    onClick={async () => {
                                      const res = await setDefaultPaymentMethod(
                                        method.id,
                                      );
                                      if ("error" in res) {
                                        toast.error(res.error);
                                        return;
                                      }
                                      await refreshSummary();
                                    }}>
                                    Make default
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-white hover:bg-white/10"
                                  onClick={async () => {
                                    const res = await deactivatePaymentMethod(
                                      method.id,
                                    );
                                    if ("error" in res) {
                                      toast.error(res.error);
                                      return;
                                    }
                                    await refreshSummary();
                                  }}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="rounded-lg border border-white/10 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-white">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Add or update bank details
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Bank</Label>
                          <Select
                            value={bankCode}
                            onValueChange={(value) => setBankCode(value)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 backdrop-blur-sm border-white/10">
                              {banks.map((bank) => (
                                <SelectItem
                                  key={bank.code}
                                  value={bank.code}
                                  className="text-white hover:bg-white/10">
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Account number</Label>
                          <Input
                            value={accountNumber}
                            onChange={(e) => {
                              setAccountNumber(e.target.value);
                              setIsAccountVerified(false);
                              setAccountName("");
                            }}
                            placeholder="Account number"
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Account name</Label>
                          <Input
                            value={accountName}
                            readOnly
                            placeholder="Verify account to display name"
                            className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                            disabled={verifyingAccount}
                            onClick={handleVerifyAccount}>
                            {verifyingAccount
                              ? "Verifying..."
                              : "Verify Bank Account"}
                          </Button>
                        </div>
                        {accountName ? (
                          <p
                            className={`text-xs ${
                              isNameMismatch()
                                ? "text-red-400"
                                : "text-green-400"
                            }`}>
                            Account name: {accountName}
                          </p>
                        ) : null}
                        {isNameMismatch() ? (
                          <p className="text-xs text-red-400">
                            Account name does not match your profile name.
                          </p>
                        ) : null}
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                          disabled={!isAccountVerified || isNameMismatch()}
                          onClick={async () => {
                            if (!bankCode || !accountNumber) {
                              toast.error(
                                "Bank and account number are required",
                              );
                              return;
                            }
                            const res = await saveBankPaymentMethod({
                              bankCode,
                              accountNumber,
                            });
                            if ("error" in res) {
                              toast.error(res.error);
                              return;
                            }
                            toast.success("Payment method saved");
                            await refreshSummary();
                          }}>
                          Save Payment Method
                        </Button>
                      </div>
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
