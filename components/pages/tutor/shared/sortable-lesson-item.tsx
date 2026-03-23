"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

export function SortableLessonItem({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        title="Drag to reorder">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
}
