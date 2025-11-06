"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Flame,
  Zap,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";

type DemandLevel = "low" | "medium" | "high" | "surge" | string;

interface DynamicPriceProps {
  basePrice?: number | null;
  currentPrice?: number | null;
  demandLevel?: DemandLevel | null;
  priceChangeIn?: number | null;
}

export function DynamicPriceDisplay({
  basePrice,
  currentPrice,
  demandLevel,
  priceChangeIn,
}: DynamicPriceProps) {
  const [timeLeft, setTimeLeft] = useState((priceChangeIn ?? 0) * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [priceChangeIn]);

  const getDemandInfo = () => {
    const normalized = demandLevel?.toLowerCase();

    switch (normalized) {
      case "low":
        return {
          color: "text-green-400",
          icon: TrendingDown,
          text: "Low Demand",
          bgColor: "bg-green-500/20",
        };
      case "medium":
        return {
          color: "text-yellow-400",
          icon: Clock,
          text: "Medium Demand",
          bgColor: "bg-yellow-500/20",
        };
      case "high":
        return {
          color: "text-orange-400",
          icon: Flame,
          text: "High Demand",
          bgColor: "bg-orange-500/20",
        };
      case "surge":
        return {
          color: "text-red-400",
          icon: Zap,
          text: "Surge Pricing",
          bgColor: "bg-red-500/20",
        };
      default:
        return {
          color: "text-gray-400",
          icon: TrendingUp,
          text: "Normal Demand",
          bgColor: "bg-gray-500/20",
        };
    }
  };

  const demandInfo = getDemandInfo();
  const discount =
    basePrice && currentPrice && basePrice > currentPrice
      ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
      : 0;

  const formattedPrice =
    currentPrice && currentPrice > 0 ? currentPrice : basePrice || 0;

  return (
    <div className="space-y-4">
      {/* Current Price */}
      <div className="flex items-center space-x-3">
        <motion.span
          key={formattedPrice}
          initial={{ scale: 1.2, color: "#00D4FF" }}
          animate={{ scale: 1, color: "#FFFFFF" }}
          className="text-3xl font-bold text-gradient">
          ₦{formattedPrice?.toLocaleString()}
        </motion.span>
        {discount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 line-through">
              ₦{basePrice?.toLocaleString()}
            </span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {discount}% OFF
            </Badge>
          </div>
        )}
      </div>

      {/* Demand Indicator */}
      <div
        className={`flex items-center space-x-2 p-3 rounded-lg ${demandInfo?.bgColor} border border-white/10`}>
        <demandInfo.icon className={`w-5 h-5 ${demandInfo?.color}`} />
        <span className={`font-semibold ${demandInfo?.color}`}>
          {demandInfo?.text}
        </span>
        {demandLevel === "surge" && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
            SURGE
          </Badge>
        )}
      </div>

      {/* Price Change Timer */}
      {timeLeft > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-semibold">
              Price changes in: {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {demandLevel === "surge"
              ? "Price may increase due to high demand"
              : "Limited time pricing"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
          <span className="text-gray-300 text-sm font-semibold">
            ⚡ Flash Sale Ended
          </span>
        </motion.div>
      )}
    </div>
  );
}

export function DemandSurgeNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-24 left-6 z-50 max-w-sm">
      <Card className="glass-card border-red-500/30 bg-red-500/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold">High Demand Alert! 🔥</h4>
              <p className="text-red-400 text-sm">
                React course price increased by 20%
              </p>
              <p className="text-gray-400 text-xs">
                47 people viewing this course
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
