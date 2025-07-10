"use client";

import { EditableName } from "@/components/shared/editable-name";
import { UNTITLED_NOTE_TITLE } from "@/convex/types";

interface NoteNameProps {
  note: any;
  isRenaming: boolean;
  onFinishRename: (name: string) => void;
}

export function NoteName({ note, isRenaming, onFinishRename }: NoteNameProps) {
  return (
    <EditableName
      initialName={note.title}
      defaultName={UNTITLED_NOTE_TITLE}
      isRenaming={isRenaming}
      onFinishRename={onFinishRename}
    />
  );
}
