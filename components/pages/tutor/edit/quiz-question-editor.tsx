import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface QuestionData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

interface QuizQuestionEditorProps {
  index: number;
  data: QuestionData;
  onChange: (updated: QuestionData) => void;
  onRemove?: () => void;
}

export function QuizQuestionEditor({
  index,
  data,
  onChange,
  onRemove,
}: QuizQuestionEditorProps) {
  const handleOptionChange = (value: string, idx: number) => {
    const updatedOptions = [...data.options];
    updatedOptions[idx] = value;
    onChange({ ...data, options: updatedOptions });
  };

  return (
    <div className="border p-4 rounded-lg space-y-3 bg-white/5">
      <div className="flex justify-between items-center">
        <h4 className="text-white font-semibold">Question {index + 1}</h4>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>

      <Textarea
        placeholder="Enter question text"
        value={data.question}
        onChange={(e) => onChange({ ...data, question: e.target.value })}
      />

      <div className="space-y-2">
        {data.options.map((opt, i) => (
          <Input
            key={i}
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(e.target.value, i)}
          />
        ))}
      </div>

      <Input
        placeholder="Correct answer"
        value={data.correctAnswer}
        onChange={(e) => onChange({ ...data, correctAnswer: e.target.value })}
      />

      <Textarea
        placeholder="Explanation (optional)"
        value={data.explanation || ""}
        onChange={(e) => onChange({ ...data, explanation: e.target.value })}
      />

      <Input
        type="number"
        placeholder="Points"
        value={data.points}
        onChange={(e) =>
          onChange({ ...data, points: Number(e.target.value) || 1 })
        }
      />
    </div>
  );
}
