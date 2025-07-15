"use client";

import { EditableName } from "@/components/shared/editable-name";
import { UNTITLED_NOTE_TITLE } from "@/convex/types";
import { Note } from "@/convex/types";

interface NoteNameProps {
  note: Note;
  isRenaming: boolean;
  onFinishRename: (name: string) => void;
}

export function NoteName({ note, isRenaming, onFinishRename }: NoteNameProps) {
  return (
    <EditableName
      initialName={note.name || ""}
      defaultName={UNTITLED_NOTE_TITLE}
      isRenaming={isRenaming}
      onFinishRename={onFinishRename}
    />
  );
}
