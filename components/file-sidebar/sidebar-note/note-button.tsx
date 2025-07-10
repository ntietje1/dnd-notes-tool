"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/convex/types";
import { NoteName } from "./note-name";
import { NoteContextMenu } from "./note-context-menu";

interface NoteButtonProps {
  note: Note;
  isRenaming: boolean;
  onNoteSelected: (note: Note) => void;
  onStartRename: () => void;
  onFinishRename: (name: string) => void;
  onDelete: () => void;
}

export function NoteButton({
  note,
  isRenaming,
  onNoteSelected,
  onStartRename,
  onFinishRename,
  onDelete,
}: NoteButtonProps) {
  return (
    <NoteContextMenu onEdit={onStartRename} onDelete={onDelete}>
      <Button
        variant="ghost"
        className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
        onClick={(e) => {
          e.stopPropagation();
          onNoteSelected(note);
        }}
      >
        <div className="flex items-center gap-1 min-w-0 w-full pl-4">
          <FileText className="h-4 w-4 shrink-0" />
          <NoteName
            note={note}
            isRenaming={isRenaming}
            onFinishRename={onFinishRename}
          />
        </div>
      </Button>
    </NoteContextMenu>
  );
}
