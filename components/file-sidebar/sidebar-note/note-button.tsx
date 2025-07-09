"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/convex/types";
import { UNTITLED_NOTE_TITLE } from "@/convex/types";
import { cn } from "@/lib/utils";

interface NoteButtonProps {
  note: any;
  isDragging?: boolean;
  onNoteSelected?: (note: Note) => void;
}

export function NoteButton({
  note,
  isDragging,
  onNoteSelected,
}: NoteButtonProps) {
  return (
    <div className="flex w-full min-w-0">
      <Button
        variant="ghost"
        className={cn(
          "flex-1 justify-start gap-2 h-9 px-2 min-w-0",
          isDragging && "opacity-50",
        )}
        onClick={() => onNoteSelected?.(note)}
      >
        <div className="flex items-center gap-2 min-w-0 w-full">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{note.title || UNTITLED_NOTE_TITLE}</span>
        </div>
      </Button>
    </div>
  );
}
