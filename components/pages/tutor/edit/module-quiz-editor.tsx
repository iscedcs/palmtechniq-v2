"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createQuizForLesson, updateQuizForLesson } from "@/actions/quiz";
import { QuizQuestionList } from "./quiz-question-list";

interface LessonQuizEditorProps {
  lessonId: string;
  existingQuiz?: {
    id: string;
    title: string;
    description?: string | null;
    timeLimit?: number | null;
    passingScore: number;
    maxAttempts: number;
  };
}

export function LessonQuizEditor({
  lessonId,
  existingQuiz,
}: LessonQuizEditorProps) {
  const [title, setTitle] = useState(existingQuiz?.title || "");
  const [description, setDescription] = useState(
    existingQuiz?.description || ""
  );
  const [timeLimit, setTimeLimit] = useState(existingQuiz?.timeLimit ?? 10);
  const [passingScore, setPassingScore] = useState(
    existingQuiz?.passingScore ?? 70
  );
  const [maxAttempts, setMaxAttempts] = useState(
    existingQuiz?.maxAttempts ?? 3
  );
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!existingQuiz?.id) return;
      try {
        const res = await fetch(`/api/quiz/${existingQuiz.id}/questions`);
        if (!res.ok) throw new Error("Failed to fetch quiz");

        const { quiz } = await res.json();
        setTitle(quiz.title);
        setDescription(quiz.description || "");
        setTimeLimit(quiz.timeLimit ?? 10);
        setPassingScore(quiz.passingScore ?? 70);
        setMaxAttempts(quiz.maxAttempts ?? 3);
        setQuestions(quiz.questions || []);
      } catch (err) {
        console.error("Quiz fetch failed:", err);
      }
    };

    fetchQuizDetails();
  }, [existingQuiz?.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("timeLimit", timeLimit.toString());
      formData.set("passingScore", passingScore.toString());
      formData.set("maxAttempts", maxAttempts.toString());
      formData.set("questions", JSON.stringify(questions));

      if (existingQuiz?.id) {
        await updateQuizForLesson(existingQuiz.id, formData);
      } else {
        await createQuizForLesson(lessonId, formData);
      }
      toast.success("Quiz saved successfully");
    } catch (error) {
      toast.error("Failed to save quiz");
      console.error("Quiz save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-6 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-base sm:text-lg font-semibold text-white">
        {existingQuiz ? "Edit Quiz" : "Add Quiz for this Lesson"}
      </h3>

      {/* Title */}
      <Input
        placeholder="Quiz Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-white/10 border-white/20 text-white"
      />

      {/* Description */}
      <Textarea
        placeholder="Description (optional)"
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-white/10 border-white/20 text-white min-h-[100px]"
      />

      {/* Numeric Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          type="number"
          min={1}
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          placeholder="Time Limit (mins)"
          className="bg-white/10 border-white/20 text-white"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={passingScore}
          onChange={(e) => setPassingScore(Number(e.target.value))}
          placeholder="Passing Score (%)"
          className="bg-white/10 border-white/20 text-white"
        />
        <Input
          type="number"
          min={1}
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(Number(e.target.value))}
          placeholder="Max Attempts"
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

      {/* Questions */}
      <div className="mt-4">
        <QuizQuestionList
          initialQuestions={questions}
          onChange={(q) => setQuestions(q)}
        />
      </div>

      {/* Save Button */}
      <Button
        disabled={loading}
        onClick={handleSave}
        className="w-full sm:w-auto bg-gradient-to-r from-neon-green to-emerald-400 text-white mt-4">
        {existingQuiz ? "Update Quiz" : "Create Quiz"}
      </Button>
    </div>
  );
}
