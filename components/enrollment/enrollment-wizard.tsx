"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  enrollmentSchema,
  type EnrollmentFormData,
} from "@/schemas/enrollment";
import { submitEnrollment } from "@/actions/enrollment";
import { PROGRAMS, formatNaira, getProgramsByDuration } from "@/data/programs";
import type { ProgramDefinition } from "@/data/programs";
import { getAvailableCohorts, type CohortOption } from "@/lib/cohort";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  GraduationCap,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Clock,
  MapPin,
  Monitor,
  Building,
  Sparkles,
  Shield,
  TrendingUp,
} from "lucide-react";

const STEPS = [
  { label: "Select Program", icon: GraduationCap },
  { label: "Your Details", icon: User },
  { label: "Cohort & Mode", icon: Calendar },
  { label: "Investment Plan", icon: CreditCard },
  { label: "Review & Launch", icon: Rocket },
];

const DURATION_FILTERS = [
  { label: "All Programs", value: "all" },
  { label: "Crash Course (1 Month)", value: "1 Month (Crash Course)" },
  { label: "3 Months", value: "3 Months" },
  { label: "6 Months", value: "6 Months" },
  { label: "1 Year", value: "1 Year" },
];

export function EnrollmentWizard() {
  const [step, setStep] = useState(0);
  const [durationFilter, setDurationFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const cohorts: CohortOption[] = getAvailableCohorts();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      programSlug: "",
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      highestQualification: "",
      cohortValue: "",
      learningMode: "VIRTUAL",
      paymentPlan: "FULL_PAYMENT",
      agreeToTerms: undefined,
    },
    mode: "onChange",
  });

  const selectedSlug = form.watch("programSlug");
  const selectedProgram = PROGRAMS.find((p) => p.slug === selectedSlug);
  const paymentPlan = form.watch("paymentPlan");
  const selectedCohort = cohorts.find(
    (c) => c.value === form.watch("cohortValue"),
  );
  const progress = ((step + 1) / STEPS.length) * 100;

  const programsByDuration = getProgramsByDuration();
  const filteredPrograms =
    durationFilter === "all"
      ? PROGRAMS
      : programsByDuration[durationFilter] || [];

  // ── Step validation before advancing ──
  async function nextStep() {
    let fieldsToValidate: (keyof EnrollmentFormData)[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ["programSlug"];
        break;
      case 1:
        fieldsToValidate = ["fullName", "email", "phone"];
        break;
      case 2:
        fieldsToValidate = ["cohortValue", "learningMode"];
        break;
      case 3:
        fieldsToValidate = ["paymentPlan"];
        break;
    }

    const valid = await form.trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // ── Submit handler ──
  function onSubmit(data: EnrollmentFormData) {
    startTransition(async () => {
      const result = await submitEnrollment(data);
      if (result.success && result.authorizationUrl) {
        toast.success("Redirecting to payment...");
        window.location.href = result.authorizationUrl;
      } else {
        toast.error(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="text-center mb-10">
        <Badge className="mb-4 bg-neon-blue/20 text-neon-blue border-neon-blue/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Career Launchpad
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Professional Program Enrollment
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Reserve your spot in PalmTechnIQ&apos;s intensive programs. Choose
          your path, pick your cohort, and start your career pipeline.
        </p>
      </div>

      {/* ── Progress Stepper ── */}
      <div className="mb-8">
        <Progress value={progress} className="h-1.5 mb-6" />
        <div className="flex justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1.5 text-xs transition-all ${
                  isActive
                    ? "text-neon-blue"
                    : isComplete
                      ? "text-green-400 cursor-pointer"
                      : "text-gray-600"
                }`}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive
                      ? "border-neon-blue bg-neon-blue/20"
                      : isComplete
                        ? "border-green-400 bg-green-400/20"
                        : "border-gray-700 bg-gray-800/50"
                  }`}>
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}>
              {step === 0 && (
                <StepProgramSelection
                  form={form}
                  filteredPrograms={filteredPrograms}
                  durationFilter={durationFilter}
                  setDurationFilter={setDurationFilter}
                  selectedProgram={selectedProgram}
                />
              )}

              {step === 1 && <StepPersonalDetails form={form} />}

              {step === 2 && (
                <StepCohortAndMode form={form} cohorts={cohorts} />
              )}

              {step === 3 && (
                <StepPaymentPlan
                  form={form}
                  selectedProgram={selectedProgram}
                  paymentPlan={paymentPlan}
                />
              )}

              {step === 4 && (
                <StepReview
                  form={form}
                  selectedProgram={selectedProgram}
                  selectedCohort={selectedCohort}
                  paymentPlan={paymentPlan}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation Buttons ── */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={step === 0}
              className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                {isPending ? (
                  "Processing..."
                ) : (
                  <>
                    Confirm & Launch My Career
                    <Rocket className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step Components
// ────────────────────────────────────────────────────────────────────────────

function StepProgramSelection({
  form,
  filteredPrograms,
  durationFilter,
  setDurationFilter,
  selectedProgram,
}: {
  form: any;
  filteredPrograms: ProgramDefinition[];
  durationFilter: string;
  setDurationFilter: (f: string) => void;
  selectedProgram?: ProgramDefinition;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Choose Your Learning Path
        </h2>
        <p className="text-gray-400 text-sm">
          Select the professional program that aligns with your career goals.
        </p>
      </div>

      {/* Duration Filter */}
      <div className="flex flex-wrap gap-2">
        {DURATION_FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            variant={durationFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDurationFilter(f.value)}
            className={
              durationFilter === f.value
                ? "bg-neon-blue/20 text-neon-blue border-neon-blue/30"
                : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            }>
            {f.label}
          </Button>
        ))}
      </div>

      {/* Program Cards */}
      <FormField
        control={form.control}
        name="programSlug"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid gap-3 sm:grid-cols-2 max-h-[55vh] overflow-y-auto pr-1">
                {filteredPrograms.map((program) => {
                  const isSelected = field.value === program.slug;
                  return (
                    <Card
                      key={program.slug}
                      className={`cursor-pointer transition-all border-2 bg-gray-900/60 hover:bg-gray-900/90 ${
                        isSelected
                          ? "border-neon-blue shadow-lg shadow-neon-blue/10"
                          : "border-gray-800 hover:border-gray-600"
                      }`}
                      onClick={() => field.onChange(program.slug)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm leading-tight">
                            {program.name}
                          </h3>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-neon-blue flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-700 text-gray-400 mb-3">
                          <Clock className="w-3 h-3 mr-1" />
                          {program.durationLabel}
                        </Badge>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-lg font-bold text-white">
                            {formatNaira(program.fullPrice)}
                          </span>
                          {program.installTotal > program.fullPrice && (
                            <span className="text-xs text-gray-500">
                              or {formatNaira(program.firstInstall)} +{" "}
                              {formatNaira(program.secondInstall)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {program.careerOutcomes.slice(0, 2).map((outcome) => (
                            <Badge
                              key={outcome}
                              variant="outline"
                              className="text-[10px] border-green-800/40 text-green-400/80">
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                              {outcome}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selected Program Details */}
      {selectedProgram && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4">
          <h4 className="text-sm font-semibold text-neon-blue mb-2">
            Curriculum Highlights
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedProgram.curriculum.map((topic) => (
              <Badge
                key={topic}
                className="bg-gray-800 text-gray-300 border-gray-700 text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StepPersonalDetails({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Future Professional Details
        </h2>
        <p className="text-gray-400 text-sm">
          Tell us about yourself so we can personalize your journey.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel className="text-gray-300">Full Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Adebayo Johnson"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Email Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Phone Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="+234 800 000 0000"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">
                Date of Birth <span className="text-gray-600">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="highestQualification"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">
                Highest Qualification{" "}
                <span className="text-gray-600">(optional)</span>
              </FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssce">SSCE / WAEC / NECO</SelectItem>
                    <SelectItem value="ond">OND / Diploma</SelectItem>
                    <SelectItem value="hnd">HND</SelectItem>
                    <SelectItem value="bsc">B.Sc / B.A / B.Eng</SelectItem>
                    <SelectItem value="msc">M.Sc / MBA / M.A</SelectItem>
                    <SelectItem value="phd">Ph.D</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function StepCohortAndMode({
  form,
  cohorts,
}: {
  form: any;
  cohorts: CohortOption[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Your Learning Blueprint
        </h2>
        <p className="text-gray-400 text-sm">
          Pick the cohort cycle you&apos;d like to join and your preferred
          learning mode.
        </p>
      </div>

      {/* Cohort Selection */}
      <FormField
        control={form.control}
        name="cohortValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-300">Select Cohort</FormLabel>
            <FormControl>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cohorts.map((cohort) => {
                  const isSelected = field.value === cohort.value;
                  return (
                    <Card
                      key={cohort.value}
                      className={`cursor-pointer transition-all border-2 bg-gray-900/60 hover:bg-gray-900/90 ${
                        isSelected
                          ? "border-neon-blue shadow-lg shadow-neon-blue/10"
                          : "border-gray-800 hover:border-gray-600"
                      }`}
                      onClick={() => field.onChange(cohort.value)}>
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-gray-700 text-gray-500">
                            {cohort.quarterLabel}
                          </Badge>
                          {isSelected && (
                            <CheckCircle className="w-3.5 h-3.5 text-neon-blue" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-white mb-0.5">
                          {cohort.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cohort.monthName} {cohort.year}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Learning Mode */}
      <FormField
        control={form.control}
        name="learningMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-300">
              Preferred Mode of Learning
            </FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid sm:grid-cols-2 gap-3">
                <Label
                  htmlFor="mode-virtual"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all bg-gray-900/60 ${
                    field.value === "VIRTUAL"
                      ? "border-neon-blue shadow-lg shadow-neon-blue/10"
                      : "border-gray-800 hover:border-gray-600"
                  }`}>
                  <RadioGroupItem value="VIRTUAL" id="mode-virtual" />
                  <Monitor className="w-5 h-5 text-neon-blue" />
                  <div>
                    <p className="font-semibold text-white text-sm">Virtual</p>
                    <p className="text-xs text-gray-500">
                      Live online classes + recordings
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="mode-physical"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all bg-gray-900/60 ${
                    field.value === "PHYSICAL"
                      ? "border-neon-blue shadow-lg shadow-neon-blue/10"
                      : "border-gray-800 hover:border-gray-600"
                  }`}>
                  <RadioGroupItem value="PHYSICAL" id="mode-physical" />
                  <Building className="w-5 h-5 text-neon-blue" />
                  <div>
                    <p className="font-semibold text-white text-sm">Physical</p>
                    <p className="text-xs text-gray-500">
                      In-person classes at our centre
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepPaymentPlan({
  form,
  selectedProgram,
  paymentPlan,
}: {
  form: any;
  selectedProgram?: ProgramDefinition;
  paymentPlan: string;
}) {
  if (!selectedProgram) return null;

  const savings = selectedProgram.installTotal - selectedProgram.fullPrice;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Your Investment Plan
        </h2>
        <p className="text-gray-400 text-sm">
          Choose how you&apos;d like to invest in your career. Full payment
          saves you {formatNaira(savings)}.
        </p>
      </div>

      <FormField
        control={form.control}
        name="paymentPlan"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-4">
                {/* Full Payment */}
                <Label
                  htmlFor="plan-full"
                  className={`block p-5 rounded-xl border-2 cursor-pointer transition-all bg-gray-900/60 ${
                    field.value === "FULL_PAYMENT"
                      ? "border-green-500 shadow-lg shadow-green-500/10"
                      : "border-gray-800 hover:border-gray-600"
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value="FULL_PAYMENT"
                        id="plan-full"
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-white">Full Payment</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Pay once and save {formatNaira(savings)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {formatNaira(selectedProgram.fullPrice)}
                      </p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mt-1">
                        Best Value
                      </Badge>
                    </div>
                  </div>
                </Label>

                {/* Installment */}
                <Label
                  htmlFor="plan-installment"
                  className={`block p-5 rounded-xl border-2 cursor-pointer transition-all bg-gray-900/60 ${
                    field.value === "INSTALLMENT"
                      ? "border-neon-blue shadow-lg shadow-neon-blue/10"
                      : "border-gray-800 hover:border-gray-600"
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value="INSTALLMENT"
                        id="plan-installment"
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          2-Part Installment (70/30)
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          70% now, 30% in 2 weeks
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatNaira(selectedProgram.installTotal)}
                    </p>
                  </div>

                  {field.value === "INSTALLMENT" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 ml-7 space-y-2 border-t border-gray-800 pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          1st Installment (due now)
                        </span>
                        <span className="font-semibold text-white">
                          {formatNaira(selectedProgram.firstInstall)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          2nd Installment (after 2 weeks)
                        </span>
                        <span className="font-semibold text-white">
                          {formatNaira(selectedProgram.secondInstall)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </Label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
        <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span>
          Payments are processed securely via Paystack. Your card details are
          never stored on our servers.
        </span>
      </div>
    </div>
  );
}

function StepReview({
  form,
  selectedProgram,
  selectedCohort,
  paymentPlan,
}: {
  form: any;
  selectedProgram?: ProgramDefinition;
  selectedCohort?: CohortOption;
  paymentPlan: string;
}) {
  const values = form.getValues();
  if (!selectedProgram) return null;

  const isInstallment = paymentPlan === "INSTALLMENT";
  const payNow = isInstallment
    ? selectedProgram.firstInstall
    : selectedProgram.fullPrice;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Finalizing Your Launch
        </h2>
        <p className="text-gray-400 text-sm">
          Review everything before we confirm your enrollment.
        </p>
      </div>

      <div className="space-y-4">
        {/* Program */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Program
          </p>
          <p className="font-semibold text-white">{selectedProgram.name}</p>
          <Badge
            variant="outline"
            className="text-xs border-gray-700 text-gray-400 mt-1">
            {selectedProgram.durationLabel}
          </Badge>
        </div>

        {/* Cohort */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Cohort
          </p>
          <p className="font-semibold text-white">
            {selectedCohort?.displayName || "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedCohort
              ? `${selectedCohort.monthName} ${selectedCohort.year}`
              : ""}
          </p>
        </div>

        {/* Personal Info */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Name
            </p>
            <p className="text-sm text-white">{values.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-sm text-white">{values.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Phone
            </p>
            <p className="text-sm text-white">{values.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Learning Mode
            </p>
            <p className="text-sm text-white flex items-center gap-1">
              {values.learningMode === "VIRTUAL" ? (
                <Monitor className="w-3.5 h-3.5" />
              ) : (
                <Building className="w-3.5 h-3.5" />
              )}
              {values.learningMode === "VIRTUAL" ? "Virtual" : "Physical"}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4">
          <p className="text-xs text-neon-blue uppercase tracking-wider mb-3">
            Payment Summary
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan</span>
              <span className="text-white font-medium">
                {isInstallment ? "Installment (70/30)" : "Full Payment"}
              </span>
            </div>
            {isInstallment && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Cost</span>
                  <span className="text-white">
                    {formatNaira(selectedProgram.installTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    2nd Installment (in 2 weeks)
                  </span>
                  <span className="text-white">
                    {formatNaira(selectedProgram.secondInstall)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
              <span className="font-semibold text-white">Pay Now</span>
              <span className="text-xl font-bold text-neon-blue">
                {formatNaira(payNow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <FormField
        control={form.control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
            </FormControl>
            <div>
              <FormLabel className="text-sm text-gray-300 leading-relaxed">
                I agree to PalmTechnIQ&apos;s{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-neon-blue underline">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-neon-blue underline">
                  Privacy Policy
                </a>
                . I understand the payment plan selected and commit to
                completing all installments if applicable.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
