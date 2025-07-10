"use client";

import { useDraggable } from "@dnd-kit/core";
import { Note } from "@/convex/types";
import { cn } from "@/lib/utils";

interface DraggableNoteProps {
  note: Note;
  children: React.ReactNode;
}

export function DraggableNote({ note, children }: DraggableNoteProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note._id,
    data: {
      type: "note",
      id: note._id,
    },
  });

  return (
    <div
      className={cn("flex w-full min-w-0", isDragging && "opacity-50")}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
