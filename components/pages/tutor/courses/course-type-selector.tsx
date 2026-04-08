"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUniqueProgramNames,
  getDurationsForProgram,
  getProgramBySlug,
  type ProgramDurationKey,
} from "@/data/programs";
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

interface CourseTypeSelectorProps {
  form: UseFormReturn<any>;
}

export default function CourseTypeSelector({ form }: CourseTypeSelectorProps) {
  const courseType = form.watch("courseType") || "REGULAR";
  const programSlug = form.watch("programSlug");

  const [selectedProgramName, setSelectedProgramName] = useState<string>("");

  const programNames = useMemo(() => getUniqueProgramNames(), []);

  const availableDurations = useMemo(() => {
    if (!selectedProgramName) return [];
    return getDurationsForProgram(selectedProgramName);
  }, [selectedProgramName]);

  const selectedProgram = programSlug
    ? getProgramBySlug(programSlug)
    : undefined;

  const handleCourseTypeSelect = (type: "REGULAR" | "PROGRAM") => {
    form.setValue("courseType", type);
    if (type === "REGULAR") {
      form.setValue("programSlug", undefined);
      setSelectedProgramName("");
    }
  };

  const handleProgramNameSelect = (name: string) => {
    setSelectedProgramName(name);
    form.setValue("programSlug", undefined);
  };

  const handleDurationSelect = (slug: string) => {
    form.setValue("programSlug", slug);
    const program = getProgramBySlug(slug);
    if (program) {
      // Auto-populate title with program name + duration label
      const baseName = program.name.replace(/\s*\(Crash Course\)$/, "");
      form.setValue(
        "title",
        `${baseName} – ${program.durationLabel} Program`,
      );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          What type of course are you creating?
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Choose whether this is a regular standalone course or a
          program-based course tied to one of our professional programs.
        </p>
      </div>

      {/* Course Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regular Course Card */}
        <button
          type="button"
          onClick={() => handleCourseTypeSelect("REGULAR")}
          className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            courseType === "REGULAR"
              ? "border-neon-blue bg-neon-blue/10 shadow-lg shadow-neon-blue/20"
              : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
          }`}>
          {courseType === "REGULAR" && (
            <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-neon-blue" />
          )}
          <BookOpen className="w-10 h-10 text-neon-blue mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Regular Course
          </h4>
          <p className="text-gray-400 text-sm">
            A standalone course that students can individually purchase from
            the course marketplace. Not tied to any program or cohort.
          </p>
        </button>

        {/* Program Course Card */}
        <button
          type="button"
          onClick={() => handleCourseTypeSelect("PROGRAM")}
          className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            courseType === "PROGRAM"
              ? "border-neon-purple bg-neon-purple/10 shadow-lg shadow-neon-purple/20"
              : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
          }`}>
          {courseType === "PROGRAM" && (
            <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-neon-purple" />
          )}
          <GraduationCap className="w-10 h-10 text-neon-purple mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Program Course
          </h4>
          <p className="text-gray-400 text-sm">
            A course tied to a professional program (e.g., Cybersecurity
            3-Month). Students enrolled in the program get access to this
            course&apos;s lessons.
          </p>
        </button>
      </div>

      {/* Program Selection (only shown when PROGRAM is selected) */}
      {courseType === "PROGRAM" && (
        <div className="space-y-6 p-6 rounded-xl border border-white/10 bg-white/5">
          <h4 className="text-lg font-semibold text-white">
            Select Program Details
          </h4>

          {/* Program Name Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300">Program Name</Label>
            <Select
              value={selectedProgramName}
              onValueChange={handleProgramNameSelect}>
              <SelectTrigger className="bg-background/50 border-white/20 text-white">
                <SelectValue placeholder="Select a program..." />
              </SelectTrigger>
              <SelectContent>
                {programNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection */}
          {selectedProgramName && (
            <div className="space-y-2">
              <Label className="text-gray-300">Program Duration</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableDurations.map((d) => {
                  const isSelected = programSlug === d.slug;
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => handleDurationSelect(d.slug)}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-neon-purple bg-neon-purple/20 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                      }`}>
                      <Clock className="w-5 h-5 mx-auto mb-2" />
                      <span className="text-sm font-medium">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Program Summary */}
          {selectedProgram && (
            <div className="p-4 rounded-lg bg-neon-purple/10 border border-neon-purple/30">
              <h5 className="text-white font-semibold mb-2">
                {selectedProgram.name}
                {selectedProgram.durationLabel !== selectedProgram.name &&
                  ` – ${selectedProgram.durationLabel}`}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Duration:</span>{" "}
                  <span className="text-white">
                    {selectedProgram.durationLabel}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Price:</span>{" "}
                  <span className="text-white">
                    ₦{selectedProgram.fullPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Curriculum:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedProgram.curriculum.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Students enrolled in this program will have access to the
                lessons you create in this course.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
