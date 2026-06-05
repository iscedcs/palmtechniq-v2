"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import PayBalanceModal from "./pay-balance-modal";
import { NairaSign } from "@/components/shared/naira-sign-icon";

export interface ProgramEnrollmentData {
  id: string;
  programName: string;
  cohortName: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: string;
  learningMode: string;
  paymentPlan: string;
  hasBalancePayment: boolean;
  balanceAmount: number;
  balanceDueDate?: Date;
  balancePaid: boolean;
  balanceOverdue: boolean;
  firstInstallmentPaid: boolean;
  createdAt: Date;
}

interface ProgramEnrollmentCardProps {
  enrollment: ProgramEnrollmentData;
  onPaymentSuccess?: () => void;
}

export default function ProgramEnrollmentCard({
  enrollment,
  onPaymentSuccess,
}: ProgramEnrollmentCardProps) {
  const [showPayModal, setShowPayModal] = useState(false);

  const isFullyPaid = enrollment.remainingBalance === 0;
  const isPendingBalance =
    !isFullyPaid && enrollment.firstInstallmentPaid && enrollment.hasBalancePayment;

  const paymentProgress = (enrollment.amountPaid / enrollment.totalAmount) * 100;

  return (
    <>
      <Card className="glass-card border-white/10 bg-slate-950/60 overflow-hidden transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-white">
                {enrollment.programName}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-400">{enrollment.cohortName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isFullyPaid && (
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Paid
                </Badge>
              )}
              {isPendingBalance && (
                <Badge className="bg-sky-500/20 text-sky-200 border-sky-500/20">
                  Balance Due
                </Badge>
              )}
              {enrollment.balanceOverdue && (
                <Badge className="bg-red-500/20 text-red-200 border-red-500/20">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              {enrollment.learningMode === "VIRTUAL" ? "Virtual" : "Physical"}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              {enrollment.paymentPlan === "FULL_PAYMENT" ? "Full Payment" : "Installment"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span className="font-medium">Payment Progress</span>
              <span className="text-xs text-gray-400">
                <NairaSign className="text-xs" />
                {enrollment.amountPaid.toLocaleString("en-NG")} /
                <NairaSign className="text-xs" />
                {enrollment.totalAmount.toLocaleString("en-NG")}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFullyPaid ? "bg-emerald-400" : "bg-neon-blue"
                }`}
                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
              />
            </div>
          </div>

          {isPendingBalance && enrollment.hasBalancePayment && (
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-gray-300">Remaining Balance</p>
                <p className="mt-1 text-3xl font-semibold text-white">
                  <NairaSign className="text-base" />
                  {enrollment.balanceAmount.toLocaleString("en-NG")}
                </p>
              </div>

              {enrollment.balanceDueDate && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  Due: {format(new Date(enrollment.balanceDueDate), "MMM dd, yyyy")}
                  {enrollment.balanceOverdue && (
                    <span className="ml-auto text-xs font-semibold text-red-300">
                      OVERDUE
                    </span>
                  )}
                </div>
              )}

              <Button
                onClick={() => setShowPayModal(true)}
                className="w-full bg-neon-blue text-white hover:bg-blue-500"
              >
                <NairaSign className="mr-2 text-base" />
                Pay Remaining Balance
              </Button>
            </div>
          )}

          {isFullyPaid && (
            <div className="flex items-center gap-2 rounded-3xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />
              <span>All payments completed. You're all set!</span>
            </div>
          )}

          {!enrollment.firstInstallmentPaid && (
            <div className="flex items-center gap-2 rounded-3xl bg-amber-500/10 p-3 text-sm text-amber-200">
              <Clock className="h-4 w-4 flex-shrink-0 text-amber-300" />
              <span>Awaiting first payment to complete enrollment</span>
            </div>
          )}
        </CardContent>
      </Card>

      {showPayModal && (
        <PayBalanceModal
          enrollmentId={enrollment.id}
          programName={enrollment.programName}
          balanceAmount={enrollment.balanceAmount}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false);
            onPaymentSuccess?.();
          }}
        />
      )}
    </>
  );
}
