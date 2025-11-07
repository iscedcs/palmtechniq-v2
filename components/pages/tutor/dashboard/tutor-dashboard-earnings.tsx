"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Legend,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type EarningsDataPoint = { month: string; amount: number; forecast?: boolean };

export function TutorDashboardEarnings({
  monthlyEarnings,
  earningsHistory = [],
}: {
  monthlyEarnings: number;
  earningsHistory?: EarningsDataPoint[];
}) {
  // 1️⃣ Build dynamic chart data
  const data =
    earningsHistory.length > 0
      ? [...earningsHistory]
      : [
          { month: "Jun", amount: 0 },
          { month: "Jul", amount: 0 },
          { month: "Aug", amount: 0 },
          { month: "Sep", amount: 0 },
          { month: "Oct", amount: 0 },
          { month: "Nov", amount: 0 },
        ];

  // 2️⃣ Compute growth %
  const growth =
    data.length >= 2 && data[data.length - 2].amount > 0
      ? Math.round(
          ((data[data.length - 1].amount - data[data.length - 2].amount) /
            data[data.length - 2].amount) *
            100
        )
      : 0;

  const forecastNextMonth = (() => {
    if (data.length < 3) return 0;
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = data.map((d) => d.amount);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean),
      0
    );
    const den = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    const slope = num / den;
    const intercept = yMean - slope * xMean;
    const nextX = n + 1;
    const predicted = intercept + slope * nextX;
    return predicted > 0 ? predicted : 0;
  })();

  const nextMonthName = (() => {
    const current = new Date();
    const next = new Date(current.getFullYear(), current.getMonth() + 1);
    return next.toLocaleString("default", { month: "short" });
  })();

  const chartData = [
    ...data,
    { month: nextMonthName, amount: forecastNextMonth, forecast: true },
  ];

  // Dynamic trend line color
  const trendColor =
    growth > 0 ? "#00FF88" : growth < 0 ? "#FF4B4B" : "#9CA3AF";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}>
      <Card className="glass-card border-white/10 hover-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Monthly Earnings</h3>
            <Badge
              className={cn(
                "border-green-500/30",
                growth >= 0
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              )}>
              {growth >= 0 ? "+" : ""}
              {growth}% from last month
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="month"
                  stroke="#aaa"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="#aaa"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(val) => `₦${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                  contentStyle={{
                    backgroundColor: "rgba(20,20,30,0.85)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `₦${value.toLocaleString()}`,
                    props.payload.forecast ? "Projected" : "Earnings",
                  ]}
                />

                <Bar
                  dataKey="amount"
                  fill="url(#colorEarnings)"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.forecast
                          ? "url(#colorForecast)"
                          : "url(#colorEarnings)"
                      }
                    />
                  ))}
                </Bar>

                {/* Trend line overlay */}
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={trendColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />

                <Badge
                  className={cn(
                    "border-green-500/30",
                    growth > 0
                      ? "bg-green-500/20 text-green-400"
                      : growth < 0
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  )}>
                  {growth >= 0 ? "+" : ""}
                  {growth}% from last month
                </Badge>

                <defs>
                  <linearGradient
                    id="colorEarnings"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop offset="0%" stopColor="#00CFFF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient
                    id="colorForecast"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop offset="0%" stopColor="#00CFFF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-300">
              <TrendingUp className="inline-block w-4 h-4 text-green-400 mr-1" />
              You earned{" "}
              <span className="text-green-400 font-semibold">
                ₦{monthlyEarnings.toLocaleString()}
              </span>{" "}
              this month
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
