"use client";

import { FileText, FilePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/convex/notes/types";
import { NoteName } from "./note-name";
import { cn } from "@/lib/utils";

interface NoteButtonProps {
  note: Note;
  isRenaming: boolean;
  isSelected: boolean;
  onNoteSelected: () => void;
  onFinishRename: (name: string) => void;
}

export function NoteButton({
  note,
  isRenaming,
  isSelected,
  onNoteSelected,
  onFinishRename,
}: NoteButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0",
        isSelected && "bg-muted",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onNoteSelected();
      }}
    >
      <div className="flex items-center gap-1 min-w-0 w-full pl-2">
        {isRenaming ? (
          <FilePen className="h-4 w-4 shrink-0" />
        ) : (
          <FileText className="h-4 w-4 shrink-0" />
        )}
        <NoteName
          note={note}
          isRenaming={isRenaming}
          onFinishRename={onFinishRename}
        />
      </div>
    </Button>
  );
}
