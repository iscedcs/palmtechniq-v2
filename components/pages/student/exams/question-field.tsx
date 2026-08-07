"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Renders the input for one question.
 *
 * `answer` is whatever shape that question type stores, and is handed straight
 * back to the server — the client never scores anything, so these shapes only
 * have to match what lib/exam/grading.ts expects to read.
 */

export type QuestionFieldProps = {
  questionId: string;
  questionType: string;
  options: unknown;
  answer: unknown;
  disabled?: boolean;
  onChange: (answer: unknown) => void;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export function QuestionField({
  questionId,
  questionType,
  options,
  answer,
  disabled,
  onChange,
}: QuestionFieldProps) {
  const choices = asStringArray(options);

  switch (questionType) {
    case "MULTIPLE_CHOICE":
      return (
        <RadioGroup
          value={answer === null || answer === undefined ? "" : String(answer)}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
          className="space-y-2">
          {choices.map((option, i) => (
            <Label
              key={`${questionId}-${i}`}
              htmlFor={`${questionId}-${i}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-normal transition-colors",
                "hover:bg-muted/50",
                String(answer) === option && "border-primary bg-primary/5",
              )}>
              <RadioGroupItem value={option} id={`${questionId}-${i}`} />
              <span className="flex-1">{option}</span>
            </Label>
          ))}
        </RadioGroup>
      );

    case "TRUE_FALSE":
      return (
        <RadioGroup
          value={answer === null || answer === undefined ? "" : String(answer)}
          onValueChange={(v) => onChange(v === "true")}
          disabled={disabled}
          className="space-y-2">
          {["true", "false"].map((option) => (
            <Label
              key={`${questionId}-${option}`}
              htmlFor={`${questionId}-${option}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-normal capitalize transition-colors",
                "hover:bg-muted/50",
                String(answer) === option && "border-primary bg-primary/5",
              )}>
              <RadioGroupItem value={option} id={`${questionId}-${option}`} />
              <span className="flex-1">{option}</span>
            </Label>
          ))}
        </RadioGroup>
      );

    case "MULTI_SELECT": {
      const selected = asStringArray(answer);
      return (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select all that apply.</p>
          {choices.map((option, i) => {
            const isChecked = selected.includes(option);
            return (
              <Label
                key={`${questionId}-${i}`}
                htmlFor={`${questionId}-${i}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-normal transition-colors",
                  "hover:bg-muted/50",
                  isChecked && "border-primary bg-primary/5",
                )}>
                <Checkbox
                  id={`${questionId}-${i}`}
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...selected, option]
                        : selected.filter((s) => s !== option),
                    )
                  }
                />
                <span className="flex-1">{option}</span>
              </Label>
            );
          })}
        </div>
      );
    }

    case "MATCHING": {
      // options: { left: string[], right: string[] }; answer: { [left]: right }
      const pairs = (options ?? {}) as { left?: unknown; right?: unknown };
      const left = asStringArray(pairs.left);
      const right = asStringArray(pairs.right);
      const current = (answer ?? {}) as Record<string, string>;

      return (
        <div className="space-y-3">
          {left.map((item) => (
            <div key={item} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="flex-1 rounded-lg border bg-muted/30 p-3 text-sm">{item}</span>
              <Select
                value={current[item] ?? ""}
                disabled={disabled}
                onValueChange={(v) => onChange({ ...current, [item]: v })}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="Match with…" />
                </SelectTrigger>
                <SelectContent>
                  {right.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      );
    }

    case "NUMERIC":
      return (
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          disabled={disabled}
          value={answer === null || answer === undefined ? "" : String(answer)}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder="Your answer"
          className="max-w-xs"
        />
      );

    case "SHORT_ANSWER":
    case "FILL_IN_BLANK":
      return (
        <Input
          disabled={disabled}
          value={answer === null || answer === undefined ? "" : String(answer)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
        />
      );

    case "CODE":
      return (
        <Textarea
          disabled={disabled}
          value={answer === null || answer === undefined ? "" : String(answer)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your code here…"
          spellCheck={false}
          className="min-h-64 font-mono text-sm"
        />
      );

    case "ESSAY":
    default:
      return (
        <Textarea
          disabled={disabled}
          value={answer === null || answer === undefined ? "" : String(answer)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here…"
          className="min-h-48"
        />
      );
  }
}

/** Has this question been answered? Used by the navigator and the submit warning. */
export function isAnswered(questionType: string, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;
  if (typeof answer === "string") return answer.trim() !== "";
  if (Array.isArray(answer)) return answer.length > 0;
  if (questionType === "MATCHING" && typeof answer === "object") {
    return Object.values(answer as Record<string, unknown>).some(
      (v) => v !== null && v !== undefined && String(v) !== "",
    );
  }
  return true;
}
