"use client";

import { useDraggable } from "@dnd-kit/core";
import { Note } from "@/convex/types";
import { NoteButton } from "./note-button";

interface DraggableNoteProps {
  note: any;
  onNoteSelected: (note: Note) => void;
}

export function DraggableNote({ note, onNoteSelected }: DraggableNoteProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note._id,
    data: {
      type: "note",
      id: note._id,
    },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <NoteButton
        note={note}
        isDragging={isDragging}
        onNoteSelected={onNoteSelected}
      />
    </div>
  );
}
