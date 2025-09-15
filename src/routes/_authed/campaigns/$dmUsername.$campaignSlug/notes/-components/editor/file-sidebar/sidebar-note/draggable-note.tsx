import { useDraggable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import type { Note } from "convex/notes/types";

interface DraggableNoteProps {
  note: Note;
  children: React.ReactNode;
}

export function DraggableNote({ note, children }: DraggableNoteProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note._id,
    data: note,
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
