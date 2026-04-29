import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizQuestionEditor } from "./quiz-question-editor";

interface QuizQuestionListProps {
  onChange: (q: any[]) => void;
  initialQuestions?: any[]; // <== Accept initial questions
}

export function QuizQuestionList({
  onChange,
  initialQuestions = [],
}: QuizQuestionListProps) {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (initialQuestions.length) {
      setQuestions(initialQuestions);
      onChange(initialQuestions);
    }
  }, [initialQuestions]);

  const updateQuestion = (index: number, updated: any) => {
    const newList = [...questions];
    newList[index] = updated;
    setQuestions(newList);
    onChange(newList);
  };

  const removeQuestion = (index: number) => {
    const newList = questions.filter((_, i) => i !== index);
    setQuestions(newList);
    onChange(newList);
  };

  const addQuestion = () => {
    const newList = [
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        points: 1,
      },
    ];
    setQuestions(newList);
    onChange(newList);
  };

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-white font-semibold text-lg">Quiz Questions</h3>
      {questions.map((q, idx) => (
        <QuizQuestionEditor
          key={idx}
          index={idx}
          data={q}
          onChange={(updated) => updateQuestion(idx, updated)}
          onRemove={() => removeQuestion(idx)}
        />
      ))}
      <Button onClick={addQuestion} variant="outline">
        + Add Question
      </Button>
    </div>
  );
}
