"use client";

import { EditableName } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/file-sidebar/sidebar-item/editable-name";
import { UNTITLED_NOTE_TITLE } from "@/convex/notes/types";
import { Note } from "@/convex/notes/types";

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
