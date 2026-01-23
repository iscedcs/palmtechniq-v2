"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function QuizRunnerClient({
  quiz,
  userId,
  enrollmentId,
}: {
  quiz: any;
  userId: string;
  enrollmentId?: string;
}) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState((quiz.timeLimit || 10) * 60); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await fetch(`/api/quiz/${quiz.id}/attempts`);
        const data = await res.json();
        if (res.ok) setRemainingAttempts(data.remaining);
        else toast.error("Could not load remaining attempts");
      } catch (err) {
        console.error("Failed to load attempts", err);
      }
    };
    fetchAttempts();
  }, [quiz.id]);

  const handleSelect = (qid: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (remainingAttempts !== null && remainingAttempts <= 0) {
      toast.error(
        "You have no attempts left. Re-watch the last lesson to reset attempts."
      );
      return;
    }
    setSubmitting(true);

    try {
      const score = quiz.questions.reduce((acc: number, q: any) => {
        const studentAnswer = answers[q.id];
        return studentAnswer === q.correctAnswer ? acc + q.points : acc;
      }, 0);

      const total = quiz.questions.reduce(
        (sum: number, q: any) => sum + q.points,
        0
      );

      const percent = Math.round((score / total) * 100);

      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          score: percent,
          timeSpent: quiz.timeLimit * 60 - timeLeft,
          enrollmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.passed) {
        toast.success("✅ You passed the quiz!");
        if (data.taskRequired) {
          toast.info("Submit the module task to continue.");
          router.push("/student/assignments");
          return;
        }
        if (data.nextLesson) {
          router.push(
            `/courses/${quiz.lesson.module.courseId}/learn/${data.nextLesson.id}`
          );
          router.refresh();
        } else {
          router.push(`/courses/${quiz.lesson.module.courseId}/learn`);
          router.refresh();
        }
      } else {
        toast.error(
          `You scored ${percent}%. You need ${quiz.passingScore}% to pass.`
        );

        if (data.remainingAttempts !== undefined)
          setRemainingAttempts(data.remainingAttempts);

        if (data.remainingAttempts <= 0 && data.retryLesson) {
          toast.info(
            "You must rewatch the last lesson before retrying the quiz."
          );
          router.push(
            `/courses/${quiz.lesson.module.courseId}/learn/${data.retryLesson.id}`
          );
        } else if (data.remainingAttempts > 0) {
          toast.info(
            `You have ${data.remainingAttempts} attempt(s) remaining.`
          );
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Submit failed", err);
      toast.error("Error submitting quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-20 text-white">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>

      {remainingAttempts !== null && (
        <p className="text-sm text-gray-400 mb-4">
          🧠 Attempts Remaining:{" "}
          <span
            className={`font-semibold ${
              remainingAttempts > 1 ? "text-green-400" : "text-red-400"
            }`}>
            {remainingAttempts}
          </span>
        </p>
      )}

      <div className="mb-6">
        ⏳ Time Left: {Math.floor(timeLeft / 60)}:
        {String(timeLeft % 60).padStart(2, "0")}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((q: any, idx: number) => (
          <div key={q.id}>
            <p className="font-medium mb-2">
              {idx + 1}. {q.question}
            </p>
            <div className="space-y-1">
              {q.options.map((opt: string, i: number) => (
                <label
                  key={i}
                  className="block border px-4 py-2 rounded-md cursor-pointer bg-white/5 hover:bg-white/10">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleSelect(q.id, opt)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        className="mt-8"
        disabled={submitting || remainingAttempts === 0}
        onClick={handleSubmit}>
        Submit Quiz
      </Button>
    </div>
  );
}
